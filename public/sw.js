self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: 'Street Surfers', body: event.data.text() }; }

  const { title, body, icon, badge, data } = payload;

  event.waitUntil(
    self.registration.showNotification(title || 'Street Surfers', {
      body:              body  || '',
      icon:              icon  || '/icon-192.png',
      badge:             badge || '/icon-192.png',
      data:              data  || {},
      vibrate:           [200, 100, 200],
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
