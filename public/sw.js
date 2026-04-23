// KAVACH National Neural Network - Service Worker v1.0.0
// Responsibility: Background Persistence, SOS Notification Relay, and Heartbeat Sync

const CACHE_NAME = 'kavach-neural-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'EMERGENCY PROTOCOL ACTIVATED: Instant SOS detected in your vicinity.',
    icon: '/shield-red.png',
    badge: '/shield-red.png',
    vibrate: [200, 100, 200, 100, 400],
    data: { url: data.url || '/' },
    actions: [
      { action: 'respond', title: 'RESPOND NOW' },
      { action: 'dismiss', title: 'DISMISS' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('KAVACH TACTICAL ALERT', options)
  );
});

// Simulate background heartbeat when the browser is "closed" or in background
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'kavach-heartbeat') {
    event.waitUntil(syncLocationInBackground());
  }
});

async function syncLocationInBackground() {
  console.log('KAVACH: Performing National Neural Network Background Sync...');
  // In a real PWA on a phone, this would use Background Sync API
  return Promise.resolve();
}
