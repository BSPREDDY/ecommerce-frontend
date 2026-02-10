// ================= COMMON FUNCTIONS =================

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    // Scroll to top button
    const scrollToTopBtn = document.getElementById('scrollToTop');
    let scrollTimeout;

    if (scrollToTopBtn) {
        window.addEventListener(
            'scroll',
            () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    scrollToTopBtn.classList.toggle('show', window.pageYOffset > 300);
                }, 100);
            },
            { passive: true }
        );

        scrollToTopBtn.addEventListener('click', e => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Update auth button
    if (!document.querySelector('.auth-container')) {
        updateAuthButton();
    }

    // Lazy loading images
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', function () {
                if (!this.src.includes('placeholder')) {
                    this.src = 'https://via.placeholder.com/300';
                }
            });

            if (img.dataset.src) observer.observe(img);
        });
    }

    // Register Service Worker (IMPORTANT FIX)
    registerServiceWorker();
});

// ================= SERVICE WORKER REGISTRATION =================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Only register on HTTPS or localhost (for development)
        const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (window.location.protocol === 'https:' || isLocalhost) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js')
                    .then(function (registration) {
                        console.log('✅ Service Worker registered with scope:', registration.scope);

                        // Check for updates
                        registration.onupdatefound = function () {
                            const installingWorker = registration.installing;
                            if (installingWorker == null) return;

                            installingWorker.onstatechange = function () {
                                if (installingWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        // New update available
                                        console.log('🔄 New content is available; please refresh.');
                                        showUpdateNotification();
                                    } else {
                                        // First installation
                                        console.log('📦 Content is cached for offline use.');
                                    }
                                }
                            };
                        };
                    })
                    .catch(function (error) {
                        console.error('❌ Service Worker registration failed:', error);
                    });
            });
        } else {
            console.log('ℹ️ Service Worker not registered: HTTPS required (or localhost)');
        }
    } else {
        console.log('❌ Service Worker not supported by this browser');
    }
}

function showUpdateNotification() {
    // Create update notification element
    const updateDiv = document.createElement('div');
    updateDiv.id = 'sw-update-notification';
    updateDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 9999;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInRight 0.3s ease-out;
        max-width: 350px;
    `;

    updateDiv.innerHTML = `
        <div style="font-size: 24px;">🔄</div>
        <div>
            <strong style="display: block; margin-bottom: 5px;">Update Available!</strong>
            <small style="opacity: 0.9;">Click to refresh for new features.</small>
        </div>
    `;

    updateDiv.onclick = function () {
        updateDiv.innerHTML = `
            <div style="font-size: 24px;">⏳</div>
            <div>
                <strong style="display: block; margin-bottom: 5px;">Updating...</strong>
                <small style="opacity: 0.9;">Please wait</small>
            </div>
        `;
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    // Add animation styles if not already present
    if (!document.getElementById('sw-update-styles')) {
        const style = document.createElement('style');
        style.id = 'sw-update-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(updateDiv);

    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (updateDiv.parentNode) {
            updateDiv.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (updateDiv.parentNode) {
                    updateDiv.parentNode.removeChild(updateDiv);
                }
            }, 300);
        }
    }, 15000);
}

// ================= CART COUNT (FIXED) =================

function updateCartCount() {
    const cartCountEl = document.getElementById('cartCount');
    if (!cartCountEl) return;

    let cart = [];
    try {
        const cartData = localStorage.getItem('cart');
        cart = cartData ? JSON.parse(cartData) : [];
        if (!Array.isArray(cart)) cart = [];
    } catch (e) {
        console.error('Error parsing cart:', e);
        cart = [];
    }

    const totalItems = cart.reduce((sum, item) => {
        // ✅ backward compatible
        const quantity = item.quantity ? Number(item.quantity) : 1;
        return sum + (isNaN(quantity) ? 1 : quantity);
    }, 0);

    cartCountEl.textContent = totalItems;
    cartCountEl.style.display = totalItems > 0 ? 'inline' : 'none';
}

// ================= ADD TO CART =================

function addToCart(product) {
    if (!product || !product.id) {
        console.error('Invalid product');
        showNotification('Cannot add invalid product', 'danger');
        return;
    }

    let cart = [];
    try {
        const cartData = localStorage.getItem('cart');
        cart = cartData ? JSON.parse(cartData) : [];
        if (!Array.isArray(cart)) cart = [];
    } catch (e) {
        console.error('Error loading cart:', e);
        cart = [];
    }

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title || 'Unknown Product',
            price: product.price || 0,
            image: product.thumbnail ||
                product.images?.[0] ||
                product.image ||
                'https://via.placeholder.com/100',
            quantity: 1,
            category: product.category
        });
    }

    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();

        // Show enhanced notification
        const productName = product.title || 'Product';
        showNotification(`<strong>${productName}</strong> added to cart!`);

        // Animate cart icon
        const cartIcon = document.querySelector('.fa-shopping-cart');
        if (cartIcon) {
            cartIcon.style.transform = 'scale(1.3)';
            setTimeout(() => {
                cartIcon.style.transform = 'scale(1)';
            }, 300);
        }
    } catch (e) {
        console.error('Error saving cart:', e);
        showNotification('Failed to add to cart. Storage might be full.', 'danger');
    }
}

// ================= AUTH BUTTON =================

function updateAuthButton() {
    const authBtn = document.getElementById('authBtn');
    if (!authBtn) return;

    let user = null;
    try {
        const userData = localStorage.getItem('user');
        user = userData ? JSON.parse(userData) : null;
    } catch (e) {
        console.error('Error parsing user data:', e);
        user = null;
    }

    if (user && user.email) {
        // Truncate long names
        const displayName = user.displayName || user.email.split('@')[0];
        const shortName = displayName.length > 15 ? displayName.substring(0, 12) + '...' : displayName;

        authBtn.innerHTML = `<i class="fas fa-user-circle me-2"></i>${shortName}`;
        authBtn.href = '#';
        authBtn.className = authBtn.className.replace('btn-outline-light', 'btn-light');

        authBtn.onclick = e => {
            e.preventDefault();
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            } else {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('user');
                    updateAuthButton();
                    showNotification('Logged out successfully', 'info');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            }
        };
    } else {
        authBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login';
        authBtn.href = 'auth.html';
        authBtn.className = authBtn.className.replace('btn-light', 'btn-outline-light');
        authBtn.onclick = null;
    }
}

// ================= NOTIFICATIONS =================

function showNotification(message, type = 'success', duration = 3000) {
    // Remove any existing notifications
    document.querySelectorAll('.alert-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-notification`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 400px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        border: none;
        border-radius: 10px;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 12px;
    `;

    // Set icon based on type
    let icon = 'fa-check-circle';
    if (type === 'danger') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    if (type === 'info') icon = 'fa-info-circle';

    notification.innerHTML = `
        <i class="fas ${icon} fa-lg" style="color: var(--bs-${type});"></i>
        <div style="flex: 1;">${message}</div>
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
}

// ================= UTILITIES =================

function formatPrice(price) {
    const num = Number(price) || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================= FETCH CACHE =================

const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchWithCache(url, options = {}) {
    const cacheKey = `${url}-${JSON.stringify(options)}`;

    // Check cache
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log(`📦 Using cached data for: ${url}`);
        return cached.data;
    }

    try {
        console.log(`🌐 Fetching: ${url}`);
        const res = await fetch(url, options);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        // Cache the response
        apiCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });

        return data;
    } catch (err) {
        console.error('Fetch error:', err);

        // Return cached data even if stale
        if (cached) {
            console.log('⚠️ Using stale cache due to network error');
            return cached.data;
        }

        throw err;
    }
}

// Clear cache function
function clearApiCache() {
    apiCache.clear();
    console.log('🧹 API cache cleared');
}

// ================= OFFLINE DETECTION =================

function checkOnlineStatus() {
    if (!navigator.onLine) {
        showNotification('You are currently offline', 'warning', 5000);
    }
}

window.addEventListener('online', () => {
    showNotification('Back online!', 'success', 2000);
});

window.addEventListener('offline', () => {
    showNotification('You are offline', 'warning', 5000);
});

// Initial check
checkOnlineStatus();

// ================= EXPORT FUNCTIONS =================

// Make functions available globally
window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
window.updateAuthButton = updateAuthButton;
window.showNotification = showNotification;
window.formatPrice = formatPrice;
window.getQueryParam = getQueryParam;
window.escapeHtml = escapeHtml;
window.fetchWithCache = fetchWithCache;
window.clearApiCache = clearApiCache;

// ================= INITIALIZATION =================

// Initialize on page load
console.log('🚀 ShopEasy main.js loaded');

// Check for pending offline orders
if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(registration => {
        // Check if we have pending orders
        const pendingOrders = localStorage.getItem('pendingOrders');
        if (pendingOrders) {
            try {
                const orders = JSON.parse(pendingOrders);
                if (orders.length > 0 && navigator.onLine) {
                    // Register sync event
                    registration.sync.register('sync-orders')
                        .then(() => console.log('📤 Sync registered for pending orders'))
                        .catch(err => console.error('Sync registration failed:', err));
                }
            } catch (e) {
                console.error('Error parsing pending orders:', e);
            }
        }
    });
}