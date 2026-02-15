// Service Worker for ShopEasy - FIXED
// ===============================
// Progressive Web App with proper caching strategy
// ===============================

const APP_VERSION = 'v1.0.2';
const CACHE_NAME = `shopeasy-cache-${APP_VERSION}`;

// URLs to cache (app shell)
const STATIC_CACHE_URLS = [
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
    '/product-details.html',
    '/offline.html',
    '/css/style.css',
    '/js/main.js',
    '/js/auth.js',
    '/js/cart.js',
    '/js/products.js',
    '/js/contact.js',
    '/js/categories.js',
    '/manifest.json',
    '/images/icon-192.png',
    '/images/icon-512.png'
];

// External resources to cache
const EXTERNAL_CACHE_URLS = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://code.jquery.com/jquery-3.6.0.min.js'
];

// Combined cache URLs
const CACHE_URLS = [...STATIC_CACHE_URLS, ...EXTERNAL_CACHE_URLS];

// ===============================
// INSTALL EVENT - Cache app shell
// ===============================
self.addEventListener('install', event => {
    console.log(`[SW ${APP_VERSION}] Installing Service Worker...`);

    // Skip waiting - activate immediately
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log(`[SW ${APP_VERSION}] Caching app shell...`);

                // Cache static assets
                return Promise.all(
                    STATIC_CACHE_URLS.map(url => {
                        return cache.add(url).catch(error => {
                            console.warn(`[SW ${APP_VERSION}] Failed to cache ${url}:`, error);
                            return null; // Don't fail entire installation
                        });
                    })
                ).then(() => {
                    // Cache external resources
                    return Promise.all(
                        EXTERNAL_CACHE_URLS.map(url => {
                            return fetch(url)
                                .then(response => {
                                    if (response.ok) {
                                        return cache.put(url, response);
                                    }
                                    throw new Error(`Failed to fetch ${url}: ${response.status}`);
                                })
                                .catch(error => {
                                    console.warn(`[SW ${APP_VERSION}] Failed to cache external ${url}:`, error);
                                    return null;
                                });
                        })
                    );
                });
            })
            .then(() => {
                console.log(`[SW ${APP_VERSION}] App shell cached successfully`);
            })
            .catch(error => {
                console.error(`[SW ${APP_VERSION}] Installation failed:`, error);
            })
    );
});

// ===============================
// ACTIVATE EVENT - Clean up old caches
// ===============================
self.addEventListener('activate', event => {
    console.log(`[SW ${APP_VERSION}] Activating Service Worker...`);

    event.waitUntil(
        // Clean up old caches
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Delete caches that aren't current
                        if (cacheName !== CACHE_NAME && cacheName.startsWith('shopeasy-cache-')) {
                            console.log(`[SW ${APP_VERSION}] Deleting old cache:`, cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Claim all clients immediately
                return self.clients.claim();
            })
            .then(() => {
                console.log(`[SW ${APP_VERSION}] Activated and ready`);
            })
            .catch(error => {
                console.error(`[SW ${APP_VERSION}] Activation failed:`, error);
            })
    );
});

// ===============================
// FETCH EVENT - Handle network requests
// ===============================
self.addEventListener('fetch', event => {
    // Skip non-GET requests, browser extensions, and development tools
    if (event.request.method !== 'GET' ||
        event.request.url.startsWith('chrome-extension://') ||
        event.request.url.startsWith('chrome://') ||
        event.request.url.includes('sockjs-node') ||
        event.request.url.includes('hot-update')) {
        return;
    }

    const url = new URL(event.request.url);

    // Strategy selection
    if (url.pathname.startsWith('/api/') ||
        url.hostname.includes('dummyjson.com') ||
        url.pathname.includes('/api/')) {
        // API requests: Network first, then cache
        event.respondWith(networkFirstWithCacheFallback(event));
    } else if (STATIC_CACHE_URLS.some(staticUrl =>
        url.pathname === staticUrl ||
        url.pathname === staticUrl + '/')) {
        // Static assets: Cache first, then network
        event.respondWith(cacheFirstWithNetworkFallback(event));
    } else {
        // Dynamic pages: Network first
        event.respondWith(networkFirstWithCacheFallback(event));
    }
});

// ===============================
// CACHING STRATEGIES
// ===============================

// Cache First with Network Fallback (for static assets)
async function cacheFirstWithNetworkFallback(event) {
    const request = event.request;

    try {
        // Try to get from cache first
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log(`[SW ${APP_VERSION}] Serving from cache:`, request.url);

            // Update cache in background (stale-while-revalidate)
            event.waitUntil(updateCache(request));

            return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log(`[SW ${APP_VERSION}] Fetching from network:`, request.url);
        const networkResponse = await fetch(request);

        // Check if response is valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
        }

        // Clone response to cache it
        const responseToCache = networkResponse.clone();

        // Cache the new response
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, responseToCache);

        return networkResponse;

    } catch (error) {
        console.log(`[SW ${APP_VERSION}] Cache first strategy failed:`, error);

        // For HTML pages, show offline page
        if (request.headers.get('accept').includes('text/html')) {
            return getOfflinePage();
        }

        // For other requests, return error
        return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Network First with Cache Fallback (for API/dynamic content)
async function networkFirstWithCacheFallback(event) {
    const request = event.request;
    const requestUrl = request.url || '';

    try {
        // Try network first
        console.log(`[SW ${APP_VERSION}] Network first attempt:`, requestUrl);
        const networkResponse = await fetch(request);

        // Cache successful responses (except opaque responses)
        if (networkResponse.ok && networkResponse.type !== 'opaque') {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse.clone());
        }

        return networkResponse;

    } catch (error) {
        console.log(`[SW ${APP_VERSION}] Network failed, trying cache:`, error);

        // Network failed, try cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log(`[SW ${APP_VERSION}] Serving from cache (network failed):`, requestUrl);
            return cachedResponse;
        }

        // For images and external resources, return a placeholder response
        if (requestUrl.includes('/placeholder') || requestUrl.includes('via.placeholder') || requestUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            console.log(`[SW ${APP_VERSION}] Returning placeholder image for:`, requestUrl);
            return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ccc" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="12">No Image</text></svg>',
                {
                    headers: { 'Content-Type': 'image/svg+xml' },
                    status: 200
                }
            );
        }

        // No cache, return appropriate error
        try {
            const acceptHeader = request.headers.get('accept') || '';
            if (acceptHeader.includes('text/html')) {
                return getOfflinePage();
            }
        } catch (headerError) {
            console.warn(`[SW ${APP_VERSION}] Could not read request headers:`, headerError);
        }

        if (request.headers.get('accept').includes('application/json')) {
            return new Response(JSON.stringify({
                error: 'You are offline',
                offline: true,
                cached: false
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response('Network error', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Update cache in background (stale-while-revalidate)
async function updateCache(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse);
            console.log(`[SW ${APP_VERSION}] Cache updated in background:`, request.url);
        }
    } catch (error) {
        // Silently fail - we already returned cached response
        console.log(`[SW ${APP_VERSION}] Background cache update failed:`, error);
    }
}

// Get offline page
async function getOfflinePage() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const offlinePage = await cache.match('/offline.html');

        if (offlinePage) {
            return offlinePage;
        }
    } catch (error) {
        console.log(`[SW ${APP_VERSION}] Could not get offline page:`, error);
    }

    // Fallback offline page
    return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - ShopEasy</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    padding: 20px;
                }
                .container {
                    max-width: 500px;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 40px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                }
                h1 {
                    font-size: 2.5em;
                    margin-bottom: 20px;
                }
                p {
                    font-size: 1.2em;
                    margin-bottom: 30px;
                    opacity: 0.9;
                }
                .icon {
                    font-size: 4em;
                    margin-bottom: 20px;
                }
                button {
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 12px 30px;
                    font-size: 1em;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: transform 0.3s;
                }
                button:hover {
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">📶</div>
                <h1>You're Offline</h1>
                <p>It seems you've lost your internet connection. Please check your network settings.</p>
                <p>Some features may be limited while offline.</p>
                <button onclick="window.location.reload()">Try Again</button>
                <button onclick="window.history.back()" style="margin-left: 10px; background: transparent; color: white; border: 1px solid white;">Go Back</button>
            </div>
            <script>
                // Check network status periodically
                setInterval(() => {
                    if (navigator.onLine) {
                        window.location.reload();
                    }
                }, 5000);
            </script>
        </body>
        </html>
    `, {
        headers: { 'Content-Type': 'text/html' }
    });
}

// ===============================
// BACKGROUND SYNC
// ===============================
self.addEventListener('sync', event => {
    console.log(`[SW ${APP_VERSION}] Background sync event:`, event.tag);

    if (event.tag === 'sync-orders') {
        event.waitUntil(syncPendingOrders());
    } else if (event.tag === 'sync-cart') {
        event.waitUntil(syncCartData());
    }
});

async function syncPendingOrders() {
    try {
        // Get pending orders from IndexedDB or localStorage
        const pendingOrders = await getPendingOrders();

        if (pendingOrders.length === 0) {
            return;
        }

        console.log(`[SW ${APP_VERSION}] Syncing ${pendingOrders.length} pending orders`);

        // Try to sync each order
        const results = await Promise.allSettled(
            pendingOrders.map(order => syncOrder(order))
        );

        // Check results
        const successful = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        console.log(`[SW ${APP_VERSION}] Sync complete: ${successful.length} successful, ${failed.length} failed`);

        // Remove successfully synced orders
        if (successful.length > 0) {
            await removeSyncedOrders(successful.map(r => r.value));
        }

        // Show notification if any failed
        if (failed.length > 0) {
            await showSyncNotification(failed.length);
        }

    } catch (error) {
        console.error(`[SW ${APP_VERSION}] Background sync failed:`, error);
    }
}

async function syncCartData() {
    try {
        // Sync cart data to server
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');

        if (cart.length === 0) {
            return;
        }

        // Simulate sync - in real app, send to server
        console.log(`[SW ${APP_VERSION}] Syncing cart data:`, cart.length, 'items');

        // Show notification
        await self.registration.showNotification('ShopEasy', {
            body: 'Cart synchronized successfully',
            icon: '/images/icon-192.png',
            tag: 'cart-sync'
        });

    } catch (error) {
        console.error(`[SW ${APP_VERSION}] Cart sync failed:`, error);
    }
}

// Helper functions for background sync
async function getPendingOrders() {
    // In a real app, use IndexedDB
    try {
        return JSON.parse(localStorage.getItem('pendingOrders') || '[]');
    } catch (error) {
        console.error(`[SW ${APP_VERSION}] Error getting pending orders:`, error);
        return [];
    }
}

async function syncOrder(order) {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // 90% success rate for demo
            if (Math.random() > 0.1) {
                console.log(`[SW ${APP_VERSION}] Order synced:`, order.id);
                resolve(order.id);
            } else {
                reject(new Error('Sync failed'));
            }
        }, 1000);
    });
}

async function removeSyncedOrders(orderIds) {
    try {
        const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
        const remainingOrders = pendingOrders.filter(order => !orderIds.includes(order.id));
        localStorage.setItem('pendingOrders', JSON.stringify(remainingOrders));
    } catch (error) {
        console.error(`[SW ${APP_VERSION}] Error removing synced orders:`, error);
    }
}

async function showSyncNotification(failedCount) {
    await self.registration.showNotification('ShopEasy', {
        body: `Failed to sync ${failedCount} order${failedCount > 1 ? 's' : ''}. Will retry later.`,
        icon: '/images/icon-192.png',
        tag: 'sync-error',
        requireInteraction: true
    });
}

// ===============================
// PUSH NOTIFICATIONS
// ===============================
self.addEventListener('push', event => {
    console.log(`[SW ${APP_VERSION}] Push notification received`);

    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.warn(`[SW ${APP_VERSION}] Could not parse push data:`, error);
        data = {
            title: 'ShopEasy',
            body: event.data ? event.data.text() : 'New update available!',
            icon: '/images/icon-192.png'
        };
    }

    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/images/icon-192.png',
        badge: '/images/icon-72.png',
        image: data.image,
        data: {
            url: data.url || '/',
            timestamp: Date.now(),
            ...data
        },
        actions: [
            {
                action: 'open',
                title: 'Open',
                icon: '/images/checkmark.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/images/xmark.png'
            }
        ],
        vibrate: [200, 100, 200],
        requireInteraction: data.requireInteraction || false
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'ShopEasy', options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log(`[SW ${APP_VERSION}] Notification clicked:`, event.notification.tag);

    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            // Check for existing window with same URL
            for (const client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            // Open new window if none exists
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('notificationclose', event => {
    console.log(`[SW ${APP_VERSION}] Notification closed:`, event.notification.tag);
});

// ===============================
// PERIODIC SYNC (if supported)
// ===============================
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', event => {
        console.log(`[SW ${APP_VERSION}] Periodic sync:`, event.tag);

        if (event.tag === 'update-content') {
            event.waitUntil(updateCachedContent());
        }
    });
}

async function updateCachedContent() {
    console.log(`[SW ${APP_VERSION}] Updating cached content`);

    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();

        // Update important pages
        const importantPages = ['/', '/index.html', '/products.html'];

        for (const page of importantPages) {
            try {
                const response = await fetch(page);
                if (response.ok) {
                    await cache.put(page, response);
                    console.log(`[SW ${APP_VERSION}] Updated cache for:`, page);
                }
            } catch (error) {
                console.warn(`[SW ${APP_VERSION}] Failed to update:`, page, error);
            }
        }

    } catch (error) {
        console.error(`[SW ${APP_VERSION}] Periodic sync failed:`, error);
    }
}

// ===============================
// MESSAGE HANDLING (from clients)
// ===============================
self.addEventListener('message', event => {
    console.log(`[SW ${APP_VERSION}] Message from client:`, event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: APP_VERSION });
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME)
            .then(() => {
                event.ports[0].postMessage({ success: true });
            })
            .catch(error => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
    }
});
