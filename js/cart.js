// ================= MAIN.JS - Updated for Cart System =================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Main.js loaded');

    // Initialize cart count
    if (typeof window.cartUpdateCartCount === 'function') {
        window.cartUpdateCartCount();
    } else {
        updateCartCountFallback();
    }

    // Scroll to top button
    initScrollToTop();

    // Update auth button
    if (!document.querySelector('.auth-container')) {
        updateAuthButton();
    }

    // Lazy loading images
    initLazyLoading();

    // Register Service Worker
    registerServiceWorker();

    // Setup event listeners
    setupEventListeners();
});

// ================= CART FUNCTIONS (Compatibility Layer) =================

function addToCart(product) {
    // Use cart.js function if available
    if (typeof window.cartAddToCart === 'function') {
        return window.cartAddToCart(product);
    }

    // Fallback implementation
    console.warn('Using fallback addToCart');
    return addToCartFallback(product);
}

function updateCartCount() {
    // Use cart.js function if available
    if (typeof window.cartUpdateCartCount === 'function') {
        window.cartUpdateCartCount();
        return;
    }

    // Fallback implementation
    updateCartCountFallback();
}

// Fallback implementation
function addToCartFallback(product) {
    if (!product || !product.id) {
        console.error('Invalid product');
        return false;
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

    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].qty = (cart[existingIndex].qty || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title || 'Unknown Product',
            price: product.price || 0,
            image: product.image || product.thumbnail || 'https://via.placeholder.com/80',
            qty: 1
        });
    }

    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification(`<strong>${product.title || 'Product'}</strong> added to cart!`);
        return true;
    } catch (e) {
        console.error('Error saving cart:', e);
        showNotification('Failed to add to cart', 'danger');
        return false;
    }
}

function updateCartCountFallback() {
    const cartCountEl = document.getElementById('cartCount');
    if (!cartCountEl) return;

    let cart = [];
    try {
        const cartData = localStorage.getItem('cart');
        cart = cartData ? JSON.parse(cartData) : [];
        if (!Array.isArray(cart)) cart = [];
    } catch (e) {
        console.error('Error loading cart:', e);
        cart = [];
    }

    const totalQty = cart.reduce((sum, item) => {
        return sum + (item.qty || 1);
    }, 0);

    cartCountEl.textContent = totalQty;

    if (totalQty > 0) {
        cartCountEl.style.display = 'inline';
        cartCountEl.classList.remove('d-none');
    } else {
        cartCountEl.style.display = 'none';
        cartCountEl.classList.add('d-none');
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
        const displayName = user.displayName || user.email.split('@')[0];
        const shortName = displayName.length > 15 ? displayName.substring(0, 12) + '...' : displayName;

        authBtn.innerHTML = `<i class="fas fa-user-circle me-2"></i>${shortName}`;
        authBtn.href = '#';
        authBtn.className = authBtn.className.replace('btn-outline-light', 'btn-light');

        authBtn.onclick = e => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('user');
                updateAuthButton();
                showNotification('Logged out successfully', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
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

// ================= INIT FUNCTIONS =================

function initScrollToTop() {
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
}

function initLazyLoading() {
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
}

function setupEventListeners() {
    // Add click animation to all buttons
    document.querySelectorAll('button, a.btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            if (!this.classList.contains('no-animation')) {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }
        });
    });
}

// ================= SERVICE WORKER =================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (window.location.protocol === 'https:' || isLocalhost) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js')
                    .then(function (registration) {
                        console.log('✅ Service Worker registered');
                    })
                    .catch(function (error) {
                        console.error('❌ Service Worker registration failed:', error);
                    });
            });
        }
    }
}

// ================= OFFLINE DETECTION =================

window.addEventListener('online', () => {
    showNotification('Back online!', 'success', 2000);
});

window.addEventListener('offline', () => {
    showNotification('You are offline', 'warning', 5000);
});

// ================= GLOBAL EXPORTS =================

window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
window.updateAuthButton = updateAuthButton;
window.showNotification = showNotification;
window.formatPrice = formatPrice;
window.getQueryParam = getQueryParam;
window.escapeHtml = escapeHtml;

// ================= INITIAL CHECK =================

// Check online status on load
if (!navigator.onLine) {
    showNotification('You are currently offline', 'warning', 5000);
}