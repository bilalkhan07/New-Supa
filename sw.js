// Design Quixo - Service Worker for Background Chrome Push Notifications & 5x Alert Sound Trigger
const CACHE_NAME = 'dq-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Background Push Messages from Server
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🚨 New Design Order Available!', body: event.data.text() };
    }
  }

  const title = data.title || '🚨 NEW DESIGN ORDER ALERT';
  const jobId = data.jobId || '';
  const body = data.body || 'A new client design order has been submitted. Tap to open workstation & claim!';
  const url = data.url || (jobId ? `/designer-dashboard.html?alertJob=${jobId}&autoPlay=5` : '/designer-dashboard.html?autoPlay=5');

  const options = {
    body: body,
    icon: data.icon || '/favicon.png',
    badge: '/favicon.png',
    vibrate: data.vibrate || [300, 150, 300, 150, 300, 150, 300, 150, 300], // 5 powerful vibration bursts
    tag: data.tag || (jobId ? `new-job-${jobId}` : 'dq-new-job'),
    renotify: true,
    requireInteraction: true,
    data: {
      url: url,
      jobId: jobId,
      autoPlay: data.autoPlay || 5,
      timestamp: Date.now()
    },
    actions: [
      { action: 'claim', title: '🚀 Open Workstation' },
      { action: 'dismiss', title: '✕ Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle User Click on Chrome Notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/designer-dashboard.html?autoPlay=5';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('designer-dashboard.html') || client.url.includes('admin-dashboard.html')) {
          client.postMessage({
            type: 'PLAY_JOB_CHIME',
            count: 5,
            jobId: event.notification.data ? event.notification.data.jobId : null
          });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
