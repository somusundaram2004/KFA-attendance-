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
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Register SW (if needed), request permission, subscribe to PushManager, and register with Backend.
 */
export async function subscribeToPushNotifications(): Promise<{ success: boolean; message: string }> {
  try {
    if (!isPushNotificationSupported()) {
      return { success: false, message: 'Web Push Notifications are not supported by this browser.' };
    }

    // 1. Request Browser Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Notification permission was denied by the user.' };
    }

    // 2. Fetch Public VAPID Key from Backend
    const vapidRes = await fetch(`${BACKEND_URL}/api/notifications/vapid-key`);
    if (!vapidRes.ok) {
      throw new Error(`Failed to fetch VAPID key: status ${vapidRes.status}`);
    }
    const vapidData = await vapidRes.json();
    if (!vapidData.success || !vapidData.publicKey) {
      throw new Error('Invalid VAPID key received from server');
    }

    // 3. Ensure Service Worker is Active
    const swRegistration = await navigator.serviceWorker.ready;
    if (!swRegistration) {
      throw new Error('Service Worker is not ready');
    }

    // 4. Subscribe to PushManager
    const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
    let subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // 5. Register Push Subscription with Backend API
    const subRes = await fetch(`${BACKEND_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!subRes.ok) {
      throw new Error(`Backend failed to store push subscription: status ${subRes.status}`);
    }

    return {
      success: true,
      message: 'Background Web Push Notifications enabled successfully! You will receive alerts even when the app is closed.',
    };
  } catch (error: any) {
    console.error('Error enabling push notifications:', error);
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
    console.error('Error sending test push notification:', error);
    return {
      success: false,
      message: error.message || 'Failed to trigger test notification.',
    };
  }
}
