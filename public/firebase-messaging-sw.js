// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Using the same credentials from firebase-applet-config.json
firebase.initializeApp({
  apiKey: "AIzaSyCycCOkBHlCiXCvcxtO-sAuj-DmCXVmCqQ",
  authDomain: "project-04bfa200-a957-4b5f-a54.firebaseapp.com",
  projectId: "project-04bfa200-a957-4b5f-a54",
  storageBucket: "project-04bfa200-a957-4b5f-a54.firebasestorage.app",
  messagingSenderId: "249278901100",
  appId: "1:249278901100:web:c2cc64162cb7923ca56149"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Chalo One';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new update.',
    icon: payload.notification?.icon || payload.data?.icon || '/assets/logo.png',
    image: payload.notification?.image || payload.data?.image || undefined,
    badge: '/assets/logo.png',
    data: {
      click_action: payload.data?.click_action || payload.notification?.click_action || '/',
      notificationId: payload.data?.notificationId || `NOTIF-${Date.now()}`
    },
    actions: [
      { action: 'open', title: 'Open App', icon: '/assets/logo.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click and deep link behavior
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    console.log('[firebase-messaging-sw.js] User dismissed the notification via action button');
    return;
  }

  const clickAction = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === clickAction && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});

// Handle notification close events (close event support)
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed event received: ', event);
});
