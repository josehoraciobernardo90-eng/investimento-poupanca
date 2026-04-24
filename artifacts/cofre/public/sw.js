/**
 * 📡 ELITE PWA SERVICE WORKER v2.0
 * Gerencia cache e notificações em segundo plano.
 */

const CACHE_NAME = 'cofre-elite-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Interceção de chamadas (Offline Support)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// 🔔 LIGAR O MOTOR DE NOTIFICAÇÕES (Segundo Plano)
self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: "Cofre Capital", message: event.data.text() };
    }
  }

  const options = {
    body: data.message || "Há uma nova atualização na sua conta.",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 500, 100, 200], // Vibração de Alta Intensidade
    tag: 'elite-approval',
    renotify: true,
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Elite Approval", options)
  );
});

// Clique na Notificação (Trazer para Primeiro Plano e disparar Flash)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Se já houver uma janela aberta, foca nela
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
