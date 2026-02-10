// ===============================
// Cart functionality
// ===============================

let cart = [];

// ===============================
// Initialize cart safely - FIXED
// ===============================
function initializeCart() {
    try {
        const storedCart = localStorage.getItem('cart');
        cart = storedCart ? JSON.parse(storedCart) : [];
        console.log('[v1] Cart initialized with', cart.length, 'items');
        return cart;
    } catch (e) {
        console.error('Error parsing cart from localStorage:', e);
        cart = [];
        return cart;
    }
}

// ===============================
// Load cart items - FIXED
// ===============================
function loadCart() {
    // Ensure cart is initialized first
    if (!Array.isArray(cart)) {
        console.log('[v1] Cart is not an array, initializing...');
        initializeCart();
    }

    console.log('[v1] Loading cart. Items in cart:', cart.length);

    const container = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');

    // Check if cart is empty or not an array
    if (!Array.isArray(cart) || cart.length === 0) {
        console.log('[v1] Cart is empty or not an array');
        if (emptyCart) {
            emptyCart.classList.remove('d-none');
        }
        if (cartContent) {
            cartContent.classList.add('d-none');
        }
        updateCartSummary();
        updateCartCount();
        return;
    }

    console.log('[v1] Cart has items, showing cart content');
    if (emptyCart) {
        emptyCart.classList.add('d-none');
    }
    if (cartContent) {
        cartContent.classList.remove('d-none');
    }

    if (!container) {
        console.error('[v1] cartItems container not found!');
        return;
    }

    container.innerHTML = '';

    cart.forEach((item, index) => {
        // Validate item structure
        if (!item || typeof item !== 'object') {
            console.warn('[v1] Invalid item at index', index, item);
            return;
        }

        const row = document.createElement('tr');
        row.className = 'cart-item';
        row.style.animation = 'fadeIn 0.5s ease-out';

        const itemTitle = item.title || 'Unknown Product';
        const itemPrice = typeof item.price === 'number' ? item.price : 0;
        const itemQuantity = typeof item.quantity === 'number' ? Math.max(1, item.quantity) : 1;
        const itemId = item.id || 'N/A';

        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.image || 'https://via.placeholder.com/80'}"
                         class="img-thumbnail me-3"
                         style="width:80px;height:80px;object-fit:contain;"
                         onerror="this.src='https://via.placeholder.com/80'">
                    <div>
                        <h6 class="mb-1">${escapeHtml(itemTitle)}</h6>
                        <small class="text-muted">Product ID: ${escapeHtml(itemId.toString())}</small>
                    </div>
                </div>
            </td>

            <td>
                <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${index},-1)">-</button>
                <span class="mx-2">${itemQuantity}</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${index},1)">+</button>
            </td>

            <td>${formatPrice(itemPrice)}</td>
            <td>${formatPrice(itemPrice * itemQuantity)}</td>

            <td>
                <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})" title="Remove from cart">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        container.appendChild(row);
    });

    console.log('[v1] Rendered', cart.length, 'items in cart');
    updateCartSummary();
    updateCartCount();
}

// ===============================
// Update quantity - FIXED
// ===============================
function updateQuantity(index, delta) {
    if (!Array.isArray(cart) || index < 0 || index >= cart.length) {
        console.error('[v1] Invalid index for updateQuantity:', index);
        return;
    }

    const item = cart[index];
    if (!item) return;

    const currentQty = typeof item.quantity === 'number' ? item.quantity : 1;
    item.quantity = Math.max(1, currentQty + delta);
    saveCart();
}

// ===============================
// Remove item - FIXED
// ===============================
function removeFromCart(index) {
    if (!Array.isArray(cart) || index < 0 || index >= cart.length) {
        console.error('[v1] Invalid index for removeFromCart:', index);
        return;
    }

    if (!confirm('Remove this item?')) return;

    cart.splice(index, 1);
    saveCart();
}

// ===============================
// Save cart - FIXED
// ===============================
function saveCart() {
    try {
        if (!Array.isArray(cart)) {
            console.warn('[v1] Cart is not an array, resetting to empty array');
            cart = [];
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('[v1] Cart saved to localStorage:', cart.length, 'items');
        loadCart();
    } catch (e) {
        console.error('[v1] Error saving cart:', e);
        showNotification('Error saving cart', 'danger');
    }
}

// ===============================
// Calculate totals (optimized) - FIXED
// ===============================
function calculateTotals() {
    if (!Array.isArray(cart) || cart.length === 0) {
        return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
    }

    const subtotal = cart.reduce((sum, item) => {
        if (!item || typeof item !== 'object') return sum;
        const price = typeof item.price === 'number' ? item.price : 0;
        const quantity = typeof item.quantity === 'number' ? Math.max(1, item.quantity) : 1;
        return sum + (price * quantity);
    }, 0);

    const shipping = subtotal > 50 ? 0 : 10;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
}

// ===============================
// Update summary - FIXED
// ===============================
function updateCartSummary() {
    const { subtotal, shipping, tax, total } = calculateTotals();

    const subEl = document.getElementById('cartSubtotal');
    const shipEl = document.getElementById('cartShipping');
    const taxEl = document.getElementById('cartTax');
    const totalEl = document.getElementById('cartTotal');

    if (subEl) subEl.textContent = formatPrice(subtotal);
    if (shipEl) shipEl.textContent = formatPrice(shipping);
    if (taxEl) taxEl.textContent = formatPrice(tax);
    if (totalEl) totalEl.textContent = formatPrice(total);
}

// ===============================
// Checkout - FIXED
// ===============================
function checkout() {
    // Ensure cart is initialized
    if (!Array.isArray(cart)) {
        initializeCart();
    }

    const userStr = localStorage.getItem('user');
    let user = null;

    try {
        user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('[v1] Error parsing user from localStorage:', e);
    }

    if (!user) {
        alert('Please login first to complete your order');
        window.location.href = 'auth.html?redirect=cart.html';
        return;
    }

    if (!Array.isArray(cart) || cart.length === 0) {
        alert('Your cart is empty! Add some products first.');
        return;
    }

    const totals = calculateTotals();

    const order = {
        orderNumber: 'ORD' + Date.now(),
        date: new Date().toISOString(),
        items: [...cart], // Create a copy of cart
        ...totals,
        status: 'Processing'
    };

    try {
        localStorage.setItem('currentOrder', JSON.stringify(order));
        localStorage.removeItem('cart');
        cart = []; // Clear the in-memory cart
        console.log('[v1] Checkout successful, order saved');

        window.location.href = 'checkout.html';
    } catch (e) {
        console.error('[v1] Error during checkout:', e);
        alert('Error processing your order. Please try again.');
    }
}

// ===============================
// Add to cart function (if not already defined)
// ===============================
function addToCart(product) {
    if (!product || typeof product !== 'object') {
        console.error('[v1] Invalid product:', product);
        return false;
    }

    // Initialize cart if needed
    if (!Array.isArray(cart)) {
        initializeCart();
    }

    // Check if product already exists in cart
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        // Update quantity if product exists
        const currentQty = cart[existingIndex].quantity || 1;
        cart[existingIndex].quantity = currentQty + 1;
    } else {
        // Add new product to cart
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();
    showNotification('Product added to cart!', 'success');
    return true;
}

// ===============================
// Clear cart function
// ===============================
function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
    }
}

// ===============================
// Order confirmation - FIXED
// ===============================
function loadOrderConfirmation() {
    let order = null;
    try {
        const orderStr = localStorage.getItem('currentOrder');
        order = orderStr ? JSON.parse(orderStr) : null;
    } catch (e) {
        console.error('[v1] Error parsing currentOrder:', e);
    }

    if (!order) {
        console.warn('[v1] No order found, redirecting to cart');
        window.location.href = 'cart.html';
        return;
    }

    const container = document.getElementById('orderConfirmation');
    if (!container) {
        console.error('[v1] orderConfirmation container not found');
        return;
    }

    const userStr = localStorage.getItem('user');
    let user = {};
    try {
        user = userStr ? JSON.parse(userStr) : {};
    } catch (e) {
        console.error('[v1] Error parsing user:', e);
    }

    const orderDate = order.date ? new Date(order.date) : new Date();
    const estimatedDelivery = new Date(orderDate.getTime() + (5 * 24 * 60 * 60 * 1000));

    let itemsHtml = '';
    if (Array.isArray(order.items) && order.items.length > 0) {
        itemsHtml = order.items.map((item, index) => {
            if (!item) return '';
            const itemTitle = item.title || 'Unknown Product';
            const itemPrice = typeof item.price === 'number' ? item.price : 0;
            const itemQuantity = typeof item.quantity === 'number' ? Math.max(1, item.quantity) : 1;

            return `
                <tr style="animation: fadeIn 0.5s ease-out ${index * 0.1}s both;">
                    <td>
                        <img src="${item.image || 'https://via.placeholder.com/80'}" 
                             style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;"
                             onerror="this.src='https://via.placeholder.com/80'">
                    </td>
                    <td><strong>${escapeHtml(itemTitle)}</strong></td>
                    <td>${itemQuantity}</td>
                    <td>${formatPrice(itemPrice)}</td>
                    <td>${formatPrice(itemPrice * itemQuantity)}</td>
                </tr>
            `;
        }).join('');
    }

    container.innerHTML = `
        <!-- HTML content remains the same, just using safe values -->
        ${generateOrderConfirmationHTML(order, user, orderDate, estimatedDelivery, itemsHtml)}
    `;

    // Clear cart data after showing confirmation
    setTimeout(() => {
        try {
            localStorage.removeItem('cart');
            localStorage.removeItem('currentOrder');
            cart = []; // Reset in-memory cart
        } catch (e) {
            console.error('[v1] Error clearing cart data:', e);
        }
    }, 1000);
}

// Helper function for HTML generation
function generateOrderConfirmationHTML(order, user, orderDate, estimatedDelivery, itemsHtml) {
    return `
        <div style="animation: fadeIn 0.5s ease-out;">
            <!-- Success Message -->
            <div class="alert alert-success alert-dismissible fade show" role="alert" style="border-left: 5px solid #28a745;">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Order Confirmed!</strong> Your order has been successfully placed.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>

            <!-- Order Details -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title mb-3">Order Details</h5>
                            <div class="mb-3">
                                <small class="text-muted">Order Number</small>
                                <h6 class="mb-0" style="color: #007bff; font-weight: 700;">${order.orderNumber || 'N/A'}</h6>
                            </div>
                            <div class="mb-3">
                                <small class="text-muted">Order Date</small>
                                <h6 class="mb-0">${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}</h6>
                            </div>
                            <div class="mb-3">
                                <small class="text-muted">Status</small>
                                <span class="badge bg-primary ms-2">${order.status || 'Processing'}</span>
                            </div>
                            <div>
                                <small class="text-muted">Estimated Delivery</small>
                                <h6 class="mb-0">${estimatedDelivery.toLocaleDateString()}</h6>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title mb-3">Customer Information</h5>
                            <div class="mb-3">
                                <small class="text-muted">Name</small>
                                <h6 class="mb-0">${escapeHtml(user.displayName || user.email || 'Guest')}</h6>
                            </div>
                            <div class="mb-3">
                                <small class="text-muted">Email</small>
                                <h6 class="mb-0">${escapeHtml(user.email || 'Not provided')}</h6>
                            </div>
                            <div>
                                <small class="text-muted">Total Items</small>
                                <h6 class="mb-0">${Array.isArray(order.items) ? order.items.length : 0} item(s)</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Order Items -->
            ${Array.isArray(order.items) && order.items.length > 0 ? `
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-light border-0">
                        <h5 class="mb-0">Order Items</h5>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Image</th>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ` : '<p class="text-muted">No items in order</p>'}

            <!-- Order Summary -->
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <div class="row text-right">
                        <div class="col-md-8 text-end">
                            <strong>Subtotal:</strong>
                        </div>
                        <div class="col-md-4 text-end">
                            <strong>${formatPrice(order.subtotal || 0)}</strong>
                        </div>
                    </div>
                    <div class="row text-right mt-2">
                        <div class="col-md-8 text-end">
                            <strong>Shipping:</strong>
                        </div>
                        <div class="col-md-4 text-end">
                            <strong class="text-success">${order.shipping === 0 ? 'FREE' : formatPrice(order.shipping || 0)}</strong>
                        </div>
                    </div>
                    <div class="row text-right mt-2">
                        <div class="col-md-8 text-end">
                            <strong>Tax (10%):</strong>
                        </div>
                        <div class="col-md-4 text-end">
                            <strong>${formatPrice(order.tax || 0)}</strong>
                        </div>
                    </div>
                    <hr>
                    <div class="row text-right">
                        <div class="col-md-8 text-end">
                            <h5>Total:</h5>
                        </div>
                        <div class="col-md-4 text-end">
                            <h5 class="text-primary" style="font-weight: 700;">${formatPrice(order.total || 0)}</h5>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-3 mb-4">
                <a href="index.html" class="btn btn-primary flex-fill">
                    <i class="fas fa-home me-2"></i>Back to Home
                </a>
                <a href="products.html" class="btn btn-outline-primary flex-fill">
                    <i class="fas fa-shopping-bag me-2"></i>Continue Shopping
                </a>
            </div>

            <!-- Order Tracking Section -->
            <div class="alert alert-info" role="alert">
                <i class="fas fa-info-circle me-2"></i>
                <strong>What's Next?</strong> You will receive an email confirmation shortly with tracking information.
            </div>
        </div>
    `;
}

// ===============================
// Helpers - ADDED
// ===============================
function formatPrice(price) {
    const num = typeof price === 'number' ? price : 0;
    return '$' + num.toFixed(2);
}

function updateCartCount() {
    const el = document.getElementById('cartCount');
    if (el) {
        const count = Array.isArray(cart) ? cart.reduce((sum, item) => {
            const qty = typeof item.quantity === 'number' ? Math.max(1, item.quantity) : 1;
            return sum + qty;
        }, 0) : 0;
        el.textContent = count;
    }
}

function showNotification(message, type) {
    // Create a Bootstrap toast or alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===============================
// Global initialization - FIXED
// ===============================
// Initialize cart immediately when script loads
initializeCart();

// Update cart count in navbar on all pages
updateCartCount();

// ===============================
// Init on page load - FIXED
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    console.log('[v1] DOM loaded, current path:', path);

    // Re-initialize cart to ensure it's fresh
    if (!Array.isArray(cart)) {
        initializeCart();
    }

    if (path.includes('cart.html')) {
        console.log('[v1] Loading cart page');
        // Small delay to ensure DOM is fully ready
        setTimeout(() => loadCart(), 50);
    }

    if (path.includes('order-confirmation.html')) {
        console.log('[v1] Loading order confirmation');
        setTimeout(() => loadOrderConfirmation(), 50);
    }

    // Update cart count on all pages
    updateCartCount();
});

// Make cart functions globally available
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.checkout = checkout;
window.clearCart = clearCart;