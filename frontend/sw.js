// Service Worker para Web Push
self.addEventListener('install', event => {
    self.skipWaiting();
    console.log('Service Worker instalado');
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
    console.log('Service Worker ativado');
});

// Handler para push notifications
self.addEventListener('push', event => {
    let data = { title: 'Nova notificação', body: 'Você tem uma nova mensagem!' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || 'Você tem uma nova mensagem',
        icon: data.icon || './icon-192.png',
        badge: '/badge-72.png',
        image: data.image,
        data: data.url || self.location.origin,
        actions: data.actions || [],
        vibrate: [200, 100, 200, 100, 200],
        tag: data.tag || 'default',
        renotify: true,
        requireInteraction: data.requireInteraction || false,
        timestamp: Date.now()
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Notificação', options)
    );
});

// Handler para clique nas notificações
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const urlToOpen = event.notification.data || self.location.origin;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            // Verificar se já existe uma aba aberta
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Se não encontrar, abrir nova aba
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handler para ações das notificações
self.addEventListener('notificationclose', event => {
    console.log('Notificação fechada:', event.notification.tag);
});