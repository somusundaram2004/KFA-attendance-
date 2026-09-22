import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

let publicVapidKey = process.env.VAPID_PUBLIC_KEY || '';
let privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const mailto = process.env.VAPID_MAILTO || 'mailto:admin@kfaacademy.com';

if (!publicVapidKey || !privateVapidKey) {
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ WARNING: VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is missing from environment variables in production! Ephemeral keys generated.');
  } else {
    console.log('⚡ Generating ephemeral VAPID keys for Web Push Notifications...');
  }
  const vapidKeys = webpush.generateVAPIDKeys();
  publicVapidKey = vapidKeys.publicKey;
  privateVapidKey = vapidKeys.privateKey;
}

webpush.setVapidDetails(mailto, publicVapidKey, privateVapidKey);

export { publicVapidKey, privateVapidKey, webpush };

