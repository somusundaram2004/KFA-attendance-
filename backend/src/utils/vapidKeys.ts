import webpush from 'web-push';

let publicVapidKey = process.env.VAPID_PUBLIC_KEY || '';
let privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const mailto = process.env.VAPID_MAILTO || 'mailto:admin@kfaacademy.com';

if (!publicVapidKey || !privateVapidKey) {
  console.log('⚡ Generating ephemeral VAPID keys for Web Push Notifications...');
  const vapidKeys = webpush.generateVAPIDKeys();
  publicVapidKey = vapidKeys.publicKey;
  privateVapidKey = vapidKeys.privateKey;
}

webpush.setVapidDetails(mailto, publicVapidKey, privateVapidKey);

export { publicVapidKey, privateVapidKey, webpush };
