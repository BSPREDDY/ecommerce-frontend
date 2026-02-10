// Service Worker for ShopEasy
const CACHE_NAME = 'shopeasy-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/about.html',
    '/auth.html',
    '/cart.html',
    '/categories.html',
    '/checkout.html',
    '/contact.html',
    '/order-confirmation.html',
    '/products.html',
    '/search.html',
    '/css/style.css',
    '/js/main.js',
    '/js/auth.js',
    '/js/cart.js',
    '/js/products.js',
    '/js/contact.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://code.jquery.com/jquery-3.6.0.min.js'
];

// Install event - FIXED
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...', CACHE_NAME);

    // Skip waiting to activate immediately
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                // Use cache.add() for each URL to handle failures gracefully
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.warn(`[Service Worker] Failed to cache ${url}:`, error);
                        });
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Install completed');
            })
    );
});

// Activate event - FIXED
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(() => {
                // Take control of all clients immediately
                return self.clients.claim();
            })
            .then(() => {
                console.log('[Service Worker] Activated');
            })
    );
});

// Fetch event - FIXED
self.addEventListener('fetch', event => {
    // Skip non-GET requests and Chrome extensions
    if (event.request.method !== 'GET' ||
        event.request.url.startsWith('chrome-extension://') ||
        event.request.url.includes('sockjs-node')) {
        return;
    }

    // Handle API requests differently
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('dummyjson.com')) {
        // For API calls, try network first, then cache
        event.respondWith(networkFirstStrategy(event));
    } else {
        // For static assets, try cache first, then network
        event.respondWith(cacheFirstStrategy(event));
    }
});

// Cache First Strategy for static assets
async function cacheFirstStrategy(event) {
    try {
        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', event.request.url);
            return cachedResponse;
        }

        console.log('[Service Worker] Not in cache, fetching:', event.request.url);
        const response = await fetch(event.request);

        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
        }

        // Cache the new response
        const responseToCache = response.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, responseToCache);

        return response;

    } catch (error) {
        console.log('[Service Worker] Fetch failed, returning offline page:', error);

        // If it's a page request, return offline page
        if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html') ||
                new Response('<h1>You are offline</h1><p>Please check your internet connection.</p>', {
                    headers: { 'Content-Type': 'text/html' }
                });
        }

        // For other requests, return a generic error
        return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Network First Strategy for API calls
async function networkFirstStrategy(event) {
    try {
        const response = await fetch(event.request);

        // Update cache with fresh API response
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());

        return response;

    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache for API:', error);

        // Try to get from cache if network fails
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return error response
        return new Response(JSON.stringify({
            error: 'Network error',
            offline: true
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Background sync (simplified)
self.addEventListener('sync', event => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    try {
        // Get pending orders from localStorage (simulated)
        const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');

        if (pendingOrders.length === 0) {
            return;
        }

        console.log('[Service Worker] Syncing', pendingOrders.length, 'orders');

        // Simulate sync - in real app, send to your backend
        for (const order of pendingOrders) {
            try {
                // Example API call
                await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });

                console.log('[Service Worker] Order synced:', order.id);
            } catch (error) {
                console.error('[Service Worker] Failed to sync order:', error);
                throw error; // Stop if one fails
            }
        }

        // Clear pending orders on success
        localStorage.removeItem('pendingOrders');

    } catch (error) {
        console.error('[Service Worker] Sync failed:', error);
        throw error;
    }
}

// Push notifications
self.addEventListener('push', event => {
    console.log('[Service Worker] Push received:', event);

    let data = {
        title: 'ShopEasy',
        body: 'You have a new notification!',
        icon: '/images/icon-192.png',
        badge: '/images/badge-72.png'
    };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/images/icon-192.png',
        badge: data.badge || '/images/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/images/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'ShopEasy', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification click:', event.notification.tag);

    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            // Check if there's already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});