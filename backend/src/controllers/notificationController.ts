import { Request, Response } from 'express';
import { publicVapidKey, webpush } from '../utils/vapidKeys';
import { supabase } from '../config/supabase';
import { sessionStore } from '../middleware/authMiddleware';

interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// In-memory store for Web Push subscriptions (synced with Supabase)
const pushSubscriptions: Map<string, PushSubscriptionPayload> = new Map();

/**
 * Get Public VAPID Key for Browser Subscription
 */
export const getVapidPublicKey = (req: Request, res: Response) => {
  res.json({
    success: true,
    publicKey: publicVapidKey,
  });
};

export const subscribePushNotification = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const endpoint = body.endpoint || body.subscription?.endpoint;
    const p256dh = body.keys?.p256dh || body.p256dh || body.subscription?.keys?.p256dh;
    const authKey = body.keys?.auth || body.auth || body.subscription?.keys?.auth;

    if (!endpoint || !p256dh || !authKey) {
      console.warn('[PushNotification] Invalid push subscription payload received');
      return res.status(400).json({ success: false, error: 'Invalid push subscription payload' });
    }

    const subscription: PushSubscriptionPayload = {
      endpoint,
      keys: {
        p256dh,
        auth: authKey,
      },
    };

    // Identify user from Bearer session token if available
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const session = sessionStore.get(token);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    }

    if (!userId && req.body.user_id) {
      userId = req.body.user_id;
    }

    // 1. Save in local RAM store for fast delivery
    pushSubscriptions.set(subscription.endpoint, subscription);

    // 2. Persist in Supabase public.push_subscriptions table
    let dbPersisted = false;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            user_id: userId || null,
          },
          { onConflict: 'endpoint' }
        );

      if (dbError) {
        console.error('[PushNotification] Error storing subscription in Supabase push_subscriptions:', dbError.message);
      } else {
        dbPersisted = true;
        console.log(`[PushNotification] Successfully saved push_subscriptions row in Supabase for user ${userId || 'anonymous'}`);
      }
    }

    try {
      console.log(`[PushNotification] Stored push subscription for endpoint domain: ${new URL(subscription.endpoint).hostname}`);
    } catch (e) {
      console.log(`[PushNotification] Stored push subscription for endpoint`);
    }

    return res.status(201).json({
      success: true,
      message: 'Push subscription stored successfully',
      dbPersisted,
      activeSubscriptionsCount: pushSubscriptions.size,
    });
  } catch (error: any) {
    console.error('[PushNotification] Error subscribing to push notifications:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Unsubscribe Browser Client
 */
export const unsubscribePushNotification = async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      pushSubscriptions.delete(endpoint);

      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', endpoint);
        } catch (err: any) {
          console.error('[PushNotification] Error deleting subscription from Supabase:', err.message);
        }
      }
    }
    return res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Helper to dispatch push notifications to all active subscriptions (from RAM + Supabase)
 */
export const dispatchPushNotification = async (payload: { title: string; body: string; url?: string; icon?: string }) => {
  const notificationData = JSON.stringify({
    title: payload.title || 'KFA Attendance Alert',
    body: payload.body || 'You have a new update.',
    icon: payload.icon || '/manifest.json',
    url: payload.url || '/',
    timestamp: Date.now(),
  });

  // Load subscriptions from Supabase to ensure persistence across server restarts
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data: dbSubs, error } = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth');
      if (!error && dbSubs) {
        for (const sub of dbSubs) {
          if (!pushSubscriptions.has(sub.endpoint)) {
            pushSubscriptions.set(sub.endpoint, {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            });
          }
        }
      }
    } catch (e: any) {
      console.warn('[PushNotification] Error syncing subscriptions from Supabase:', e.message);
    }
  }

  const sendPromises: Promise<any>[] = [];

  pushSubscriptions.forEach((sub, endpoint) => {
    sendPromises.push(
      webpush
        .sendNotification(sub as any, notificationData)
        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(`[PushNotification] Removing expired subscription: ${endpoint.substring(0, 30)}...`);
            pushSubscriptions.delete(endpoint);
            if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
            }
          } else {
            console.warn(`[PushNotification] Push delivery error to ${endpoint.substring(0, 30)}...`, err.message);
          }
        })
    );
  });

  await Promise.all(sendPromises);
};

/**
 * Send Test Notification Endpoint
 */
export const sendTestPushNotification = async (req: Request, res: Response) => {
  try {
    // Fetch subscriptions from DB if RAM is empty
    if (pushSubscriptions.size === 0 && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: dbSubs } = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth');
      if (dbSubs && dbSubs.length > 0) {
        for (const sub of dbSubs) {
          pushSubscriptions.set(sub.endpoint, {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          });
        }
      }
    }

    if (pushSubscriptions.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active device push subscriptions found. Please enable background notifications first!',
      });
    }

    await dispatchPushNotification({
      title: '🔔 KFA Attendance Test Notification',
      body: 'Success! Web Push is working even when the site is closed.',
      url: '/(admin)',
    });

    return res.json({
      success: true,
      message: `Test notification sent to ${pushSubscriptions.size} device(s)`,
    });
  } catch (error: any) {
    console.error('[PushNotification] Test notification failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

