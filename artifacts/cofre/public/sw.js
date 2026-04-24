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
    vibrate: [100, 50, 100, 50, 400], // Vibração em segundo plano
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      { action: 'explore', title: 'Abrir App' },
      { action: 'close', title: 'Fechar' },
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Elite Approval", options)
  );
});

// Clique na Notificação (Trazer para Primeiro Plano)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
