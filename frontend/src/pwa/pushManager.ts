import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  console.log(`[PushManager] isPushNotificationSupported: ${supported}`);
  return supported;
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  const permission = Notification.permission;
  console.log(`[PushManager] Notification permission state: ${permission}`);
  return permission;
}

/**
 * Register SW (if needed), request permission, subscribe to PushManager, and register with Backend.
 */
export async function subscribeToPushNotifications(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[PushManager] Starting push notification subscription flow...');
    if (!isPushNotificationSupported()) {
      console.warn('[PushManager] Push notifications not supported in this browser environment.');
      return { success: false, message: 'Web Push Notifications are not supported by this browser.' };
    }

    // 1. Request Browser Permission
    console.log('[PushManager] Step 1: Requesting Notification permission...');
    const permission = await Notification.requestPermission();
    console.log(`[PushManager] Permission request result: ${permission}`);
    if (permission !== 'granted') {
      return { success: false, message: 'Notification permission was denied by the user.' };
    }

    // 2. Fetch Public VAPID Key from Backend
    console.log(`[PushManager] Step 2: Fetching VAPID key from ${BACKEND_URL}/api/notifications/vapid-key...`);
    const vapidRes = await fetch(`${BACKEND_URL}/api/notifications/vapid-key`);
    if (!vapidRes.ok) {
      throw new Error(`Failed to fetch VAPID key: status ${vapidRes.status}`);
    }
    const vapidData = await vapidRes.json();
    if (!vapidData.success || !vapidData.publicKey) {
      throw new Error('Invalid VAPID key received from server');
    }
    console.log('[PushManager] Step 2: VAPID public key fetched successfully.');

    // 3. Ensure Service Worker is Active
    console.log('[PushManager] Step 3: Checking Service Worker registration...');
    const swRegistration = await navigator.serviceWorker.ready;
    if (!swRegistration) {
      throw new Error('Service Worker is not ready');
    }
    console.log(`[PushManager] Step 3: Service Worker ready with scope: ${swRegistration.scope}`);

    // 4. Subscribe to PushManager
    console.log('[PushManager] Step 4: Subscribing with browser PushManager...');
    const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
    let subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      console.log('[PushManager] No existing PushSubscription found. Creating new subscription...');
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
      console.log('[PushManager] New PushSubscription created successfully.');
    } else {
      console.log('[PushManager] Existing PushSubscription retrieved successfully.');
    }

    // 5. Retrieve user session token if available
    let sessionToken: string | null = null;
    try {
      sessionToken = await AsyncStorage.getItem('kfa_session_token');
    } catch (e) {
      console.warn('[PushManager] Could not read session token from AsyncStorage:', e);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    // 6. Register Push Subscription with Backend API
    console.log(`[PushManager] Step 5: Sending PushSubscription to backend at ${BACKEND_URL}/api/notifications/subscribe...`);
    const subRes = await fetch(`${BACKEND_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers,
      body: JSON.stringify(subscription),
    });

    if (!subRes.ok) {
      const errText = await subRes.text().catch(() => '');
      throw new Error(`Backend failed to store push subscription (HTTP ${subRes.status}): ${errText}`);
    }

    const subData = await subRes.json();
    console.log(`[PushManager] Step 5: Backend subscription registration response:`, subData);

    return {
      success: true,
      message: 'Background Web Push Notifications enabled successfully! You will receive alerts even when the app is closed.',
    };
  } catch (error: any) {
    console.error('[PushManager] Error enabling push notifications:', error);
    return {
      success: false,
      message: error.message || 'Failed to enable background push notifications.',
    };
  }
}

/**
 * Send a Test Push Notification via Backend
 */
export async function sendTestPushNotification(): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[PushManager] Triggering test push notification at ${BACKEND_URL}/api/notifications/send-test...`);
    const res = await fetch(`${BACKEND_URL}/api/notifications/send-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || data.error || 'Failed to send test push notification.',
      };
    }

    return {
      success: true,
      message: data.message || 'Test notification dispatched successfully!',
    };
  } catch (error: any) {
    console.error('[PushManager] Error sending test push notification:', error);
    return {
      success: false,
      message: error.message || 'Failed to trigger test notification.',
    };
  }
}

