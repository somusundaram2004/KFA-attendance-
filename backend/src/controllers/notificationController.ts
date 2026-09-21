import { Request, Response } from 'express';
import { publicVapidKey, webpush } from '../utils/vapidKeys';

interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// In-memory store for Web Push subscriptions
// In production, store these in Supabase / PostgreSQL database table
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

/**
 * Subscribe Browser Client to Web Push Notifications
 */
export const subscribePushNotification = (req: Request, res: Response) => {
  try {
    const subscription: PushSubscriptionPayload = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, error: 'Invalid push subscription payload' });
    }

    pushSubscriptions.set(subscription.endpoint, subscription);

    console.log(`✓ Stored push subscription for endpoint: ${subscription.endpoint.substring(0, 30)}... (Total: ${pushSubscriptions.size})`);

    return res.status(201).json({
      success: true,
      message: 'Push subscription stored successfully',
      activeSubscriptionsCount: pushSubscriptions.size,
    });
  } catch (error: any) {
    console.error('Error subscribing to push notifications:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Unsubscribe Browser Client
 */
export const unsubscribePushNotification = (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    if (endpoint && pushSubscriptions.has(endpoint)) {
      pushSubscriptions.delete(endpoint);
    }
    return res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Helper to dispatch push notifications to all active subscriptions
 */
export const dispatchPushNotification = async (payload: { title: string; body: string; url?: string; icon?: string }) => {
  const notificationData = JSON.stringify({
    title: payload.title || 'KFA Attendance Alert',
    body: payload.body || 'You have a new update.',
    icon: payload.icon || '/manifest.json',
    url: payload.url || '/',
    timestamp: Date.now(),
  });

  const sendPromises: Promise<any>[] = [];

  pushSubscriptions.forEach((sub, endpoint) => {
    sendPromises.push(
      webpush
        .sendNotification(sub as any, notificationData)
        .catch((err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription expired or unregistered by user browser
            console.log(`Removing expired subscription: ${endpoint.substring(0, 30)}...`);
            pushSubscriptions.delete(endpoint);
          } else {
            console.warn(`Push delivery error to ${endpoint.substring(0, 30)}...`, err.message);
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
    console.error('Test notification failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
