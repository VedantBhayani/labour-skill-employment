// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  return self.clients.claim();
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch (e) {
    // If JSON parsing fails, use text
    notificationData = {
      title: 'New Notification',
      message: event.data ? event.data.text() : 'No payload',
      url: '/'
    };
  }

  const title = notificationData.title || 'New Notification';
  const options = {
    body: notificationData.message || '',
    icon: '/notification-icon.png',
    badge: '/notification-badge.png',
    data: {
      url: notificationData.url || '/'
    },
    actions: notificationData.actions || [],
    tag: notificationData.tag || 'default',
    // Show badge on notification
    requireInteraction: notificationData.requireInteraction || false,
    // Add vibration pattern for mobile
    vibrate: [100, 50, 100],
    // Show notification timestamp
    timestamp: notificationData.timestamp || Date.now()
  };

  const notificationPromise = self.registration.showNotification(title, options);
  event.waitUntil(notificationPromise);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);
  
  event.notification.close();

  // Get the notification URL from data
  const urlToOpen = event.notification.data?.url || '/';

  // Handle actions (buttons on the notification)
  if (event.action) {
    // If an action button was clicked, handle it
    switch (event.action) {
      case 'view':
        // Default action, will be handled below
        break;
      case 'dismiss':
        // Just close the notification, which we already did
        return;
      default:
        // For custom actions, postMessage to the client
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NOTIFICATION_ACTION',
              action: event.action,
              tag: event.notification.tag,
              timestamp: Date.now()
            });
          });
        });
        return;
    }
  }

  // Handle regular notification click (open the app to the relevant page)
  const promiseChain = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    // Check if there is already a window open
    let matchingClient = null;
    
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
        matchingClient = windowClient;
        break;
      }
    }
    
    if (matchingClient) {
      return matchingClient.focus();
    } else if (windowClients.length > 0) {
      // If there's an open window but not on the right URL
      return windowClients[0].navigate(urlToOpen).then(client => client.focus());
    } else {
      // If no windows are open, open a new one
      return self.clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed', event);
  
  // You would typically re-subscribe and send the new subscription to your server
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then(newSubscription => {
        // Post the new subscription back to a client
        return self.clients.matchAll()
          .then(clients => {
            if (clients.length > 0) {
              clients[0].postMessage({
                type: 'SUBSCRIPTION_UPDATED',
                subscription: newSubscription
              });
            }
          });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  console.log('Message received in service worker', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 