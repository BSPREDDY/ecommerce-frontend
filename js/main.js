// ================= COMMON FUNCTIONS =================

// Currency Formatter (Rupees)
function formatPrice(price) {
    if (!price && price !== 0) return '₹0.00';
    const numPrice = parseFloat(price) || 0;
    return `₹${numPrice.toFixed(2)}`;
}

// Make formatPrice globally available
window.formatPrice = formatPrice;

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    // Listen for cart changes using storage events (cross-tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart') {
            updateCartCount();
            console.log('[v0] Cart updated from another tab/window');
        }
    });

    // Listen for custom cart update events (same tab)
    window.addEventListener('cartUpdated', () => {
        updateCartCount();
        console.log('[v0] Cart updated (custom event)');
    });

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
        const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (window.location.protocol === 'https:' || isLocalhost) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js')
                    .then(function (registration) {
                        console.log('✅ Service Worker registered with scope:', registration.scope);
                    })
                    .catch(function (error) {
                        console.error('❌ Service Worker registration failed:', error);
                    });
            });
        }
    }
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

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title || 'Unknown Product',
            price: product.price || 0,
            image: product.thumbnail || product.images?.[0] || product.image || 'https://via.placeholder.com/100',
            quantity: 1,
            category: product.category
        });
    }

    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        showNotification(`<strong>${product.title}</strong> added to cart!`);
        return true;
    } catch (e) {
        console.error('Error saving cart:', e);
        showNotification('Failed to add to cart.', 'danger');
        return false;
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
        authBtn.onclick = e => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('user');
                updateAuthButton();
                showNotification('Logged out successfully', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 800);
            }
        };
    } else {
        authBtn.innerHTML = '<i class="fas fa-user me-1"></i>Login';
        authBtn.href = 'auth.html';
        authBtn.onclick = null;
    }
}

// ================= NOTIFICATIONS =================

function showNotification(message, type = 'success', duration = 3000) {
    document.querySelectorAll('.alert-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-notification`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 9999;
        min-width: 320px;
        max-width: 450px;
        border: none;
        border-radius: 12px;
        border-left: 4px solid;
        animation: slideInRight 0.3s ease-out;
        padding: 1rem 1.5rem;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    `;

    const colors = {
        'success': { icon: 'fa-check-circle', color: '#10b981' },
        'danger': { icon: 'fa-exclamation-circle', color: '#ef4444' },
        'warning': { icon: 'fa-exclamation-triangle', color: '#f59e0b' },
        'info': { icon: 'fa-info-circle', color: '#06b6d4' }
    };

    const typeConfig = colors[type] || colors['success'];
    notification.style.borderLeftColor = typeConfig.color;
    notification.style.color = typeConfig.color;

    notification.innerHTML = `
        <i class="fas ${typeConfig.icon} fa-lg me-2"></i>${message}
    `;

    document.body.appendChild(notification);

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

// ================= CHECKOUT FUNCTION =================

function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showNotification('Your cart is empty. Add items before checkout.', 'warning');
        return;
    }
    window.location.href = 'checkout.html';
}

// ================= UTILITIES =================

function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

// ================= EXPORT FUNCTIONS =================

window.formatPrice = formatPrice;
window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
window.updateAuthButton = updateAuthButton;
window.showNotification = showNotification;
window.getQueryParam = getQueryParam;
window.checkout = checkout;

console.log('🚀 ShopEasy main.js loaded');
