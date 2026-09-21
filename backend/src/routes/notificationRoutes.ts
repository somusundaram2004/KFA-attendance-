import { Router } from 'express';
import {
  getVapidPublicKey,
  subscribePushNotification,
  unsubscribePushNotification,
  sendTestPushNotification,
} from '../controllers/notificationController';

const router = Router();

// Public route to fetch public VAPID key
router.get('/vapid-key', getVapidPublicKey);

// Subscribe & Unsubscribe routes
router.post('/subscribe', subscribePushNotification);
router.post('/unsubscribe', unsubscribePushNotification);

// Route to trigger a test push notification
router.post('/send-test', sendTestPushNotification);

export default router;
