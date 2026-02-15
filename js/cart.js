// ===============================
// CART MANAGEMENT MODULE
// ===============================

const CART_STORAGE_KEY = 'cart';
const CURRENCY = '₹';

// Global cart object
let cart = [];

// ===============================
// INITIALIZATION
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Cart] Initializing cart module');
    loadCart();
    updateCartCount();

    // Initialize cart page if we're on it
    const cartContainer = document.getElementById('cartItems');
    if (cartContainer) {
        initializeCartPage();
    }

    // Listen for cart changes from other tabs/windows
    window.addEventListener('storage', (event) => {
        if (event.key === CART_STORAGE_KEY) {
            console.log('[Cart] Cart updated from another tab');
            loadCart();
            updateCartCount();
            if (cartContainer) {
                renderCart();
            }
        }
    });

    // Listen for custom cart update events from same tab
    window.addEventListener('cartUpdated', () => {
        console.log('[Cart] Cart updated (custom event)');
        loadCart();
        updateCartCount();
        if (cartContainer) {
            renderCart();
        }
    });
});

// ===============================
// CART FUNCTIONS
// ===============================

function loadCart() {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        cart = cartData ? JSON.parse(cartData) : [];
        if (!Array.isArray(cart)) {
            cart = [];
        }
    } catch (e) {
        console.error('[Cart] Error loading cart:', e);
        cart = [];
    }
    return cart;
}

function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartCount();

        // Notify other tabs/windows of cart update
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: cart } }));

        // Also call global updateCartCount from main.js if available
        if (typeof window.updateCartCount === 'function' && window.updateCartCount !== updateCartCount) {
            window.updateCartCount();
        }

        return true;
    } catch (e) {
        console.error('[Cart] Error saving cart:', e);
        return false;
    }
}

function cartAddToCart(product, quantity = 1) {
    if (!product || !product.id) {
        console.error('[Cart] Invalid product');
        return false;
    }

    console.log('[Cart] Adding product:', product.title, 'Qty:', quantity);

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
        console.log('[Cart] Updated quantity for:', product.title, 'New qty:', existingItem.quantity);
    } else {
        cart.push({
            id: product.id,
            title: product.title || 'Unknown Product',
            price: parseFloat(product.price) || 0,
            image: product.thumbnail || product.image || 'https://via.placeholder.com/100',
            quantity: quantity,
            category: product.category || 'General'
        });
        console.log('[Cart] Added new product:', product.title);
    }

    if (saveCart()) {
        return true;
    }

    return false;
}

function cartRemoveFromCart(productId) {
    const initialLength = cart.length;
    cart = cart.filter(item => item.id !== productId);

    if (cart.length < initialLength) {
        saveCart();
        console.log('[Cart] Removed product:', productId);
        return true;
    }

    return false;
}

function cartUpdateQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);

    if (!item) {
        console.error('[Cart] Product not found:', productId);
        return false;
    }

    if (quantity <= 0) {
        return cartRemoveFromCart(productId);
    }

    item.quantity = Math.max(1, parseInt(quantity) || 1);
    saveCart();
    console.log('[Cart] Updated quantity for:', productId, 'to:', item.quantity);
    return true;
}

function cartClearCart() {
    cart = [];
    saveCart();
    console.log('[Cart] Cart cleared');
    return true;
}

function cartGetTotal() {
    return cart.reduce((total, item) => {
        return total + (item.price * (item.quantity || 1));
    }, 0);
}

function cartGetCount() {
    return cart.reduce((count, item) => {
        return count + (item.quantity || 1);
    }, 0);
}

function updateCartCount() {
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        const count = cartGetCount();
        cartCountEl.textContent = count;
        cartCountEl.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// ===============================
// CART PAGE FUNCTIONS
// ===============================

function initializeCartPage() {
    console.log('[Cart] Initializing cart page');
    renderCart();
    attachEventListeners();
}

function renderCart() {
    const cartContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');

    if (!cartContainer) return;

    // Load fresh cart data
    loadCart();

    console.log('[v0] Cart contents:', cart);

    if (cart.length === 0) {
        if (cartContainer) cartContainer.innerHTML = '';
        if (emptyCart) emptyCart.classList.remove('d-none');
        if (cartContent) cartContent.classList.add('d-none');
        updateCartSummary();
        return;
    }

    if (emptyCart) emptyCart.classList.add('d-none');
    if (cartContent) cartContent.classList.remove('d-none');

    let html = '';

    cart.forEach((item) => {
        if (!item || !item.id) return;

        const quantity = item.quantity || 1;
        const itemTotal = (item.price || 0) * quantity;

        html += `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <img src="${item.image || 'https://via.placeholder.com/80'}" 
                             alt="${item.title}" 
                             class="img-fluid rounded"
                             style="max-width: 80px; max-height: 80px; object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/80'">
                        <div>
                            <h6 class="mb-1">${item.title || 'Product'}</h6>
                            <small class="text-secondary">${item.category || 'General'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="input-group input-group-sm" style="max-width: 100px;">
                        <button class="btn btn-outline-secondary btn-sm" 
                                onclick="cartUpdateQuantity(${item.id}, ${quantity - 1}); renderCart();">-</button>
                        <input type="number" 
                               value="${quantity}" 
                               class="form-control text-center quantity-input"
                               data-id="${item.id}"
                               min="1" 
                               max="999">
                        <button class="btn btn-outline-secondary btn-sm" 
                                onclick="cartUpdateQuantity(${item.id}, ${quantity + 1}); renderCart();">+</button>
                    </div>
                </td>
                <td>
                    <span class="fw-bold">${CURRENCY}${(item.price || 0).toFixed(2)}</span>
                </td>
                <td>
                    <span class="fw-bold text-success">${CURRENCY}${itemTotal.toFixed(2)}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" 
                            onclick="removeItem(${item.id})"
                            title="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    cartContainer.innerHTML = html;
    updateCartSummary();
}

function updateCartSummary() {
    const total = cartGetTotal();
    const count = cartGetCount();
    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');
    const countEl = document.getElementById('cartItemCount');

    if (subtotalEl) subtotalEl.textContent = `${CURRENCY}${total.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `${CURRENCY}${total.toFixed(2)}`;
    if (countEl) countEl.textContent = count;

    // Update checkout button state
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

function removeItem(productId) {
    const item = cart.find(i => i.id === productId);
    if (item && confirm(`Remove ${item.title} from cart?`)) {
        cartRemoveFromCart(productId);
        renderCart();
        if (typeof window.showNotification === 'function') {
            window.showNotification(`${item.title} removed from cart`, 'info');
        }
    }
}

function attachEventListeners() {
    // Quantity input listeners
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function () {
            const productId = parseInt(this.dataset.id);
            const quantity = parseInt(this.value) || 1;
            cartUpdateQuantity(productId, quantity);
            renderCart();
        });
    });

    // Clear cart button
    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your entire cart?')) {
                cartClearCart();
                renderCart();
                if (typeof window.showNotification === 'function') {
                    window.showNotification('Cart cleared', 'info');
                }
            }
        });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                window.location.href = 'checkout.html';
            }
        });
    }
}

// ===============================
// EXPORT FUNCTIONS
// ===============================

window.cartAddToCart = cartAddToCart;
window.cartRemoveFromCart = cartRemoveFromCart;
window.cartUpdateQuantity = cartUpdateQuantity;
window.cartClearCart = cartClearCart;
window.cartGetTotal = cartGetTotal;
window.cartGetCount = cartGetCount;
window.updateCartCount = updateCartCount;
window.loadCart = loadCart;
window.saveCart = saveCart;

console.log('[Cart] Module loaded successfully');
