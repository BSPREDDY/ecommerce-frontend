// products.js

// API Base URL - use window property to avoid redeclaration
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://dummyjson.com';
}

// Global variables - use unique names
let productsAllProducts = [];
let filteredProducts = [];

// ===============================
// HELPER FUNCTIONS
// ===============================

function showLoading(container) {
    if (!container) return;
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Loading products...</p>
        </div>
    `;
}

function showError(container, message) {
    if (!container) return;
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
            <h4>${message}</h4>
            <button class="btn btn-primary mt-3" onclick="location.reload()">
                <i class="fas fa-redo me-2"></i>Try Again
            </button>
        </div>
    `;
}

function showNotification(message, type = 'success') {
    // Notifications disabled for optimization
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function addToCart(product, quantity = 1) {
    if (!product || !product.id) {
        showNotification('Invalid product', 'danger');
        return false;
    }

    // Use cart.js function if available
    if (typeof window.cartAddToCart === 'function') {
        const result = window.cartAddToCart(product, quantity);
        if (result) {
            showNotification(`<strong>${product.title}</strong> added to cart!`, 'success');
        }
        return result;
    }

    // Fallback implementation
    console.warn('[Products] Using fallback addToCart (cart.js not loaded)');
    let cart = [];
    try {
        const cartData = localStorage.getItem('cart');
        cart = cartData ? JSON.parse(cartData) : [];
        if (!Array.isArray(cart)) cart = [];
    } catch (e) {
        cart = [];
    }

    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title || 'Unknown Product',
            price: product.price || 0,
            image: product.image || product.thumbnail || 'https://via.placeholder.com/80',
            quantity: quantity,
            category: product.category || 'General'
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: cart } }));

    // Update cart count
    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
    }

    showNotification(`${product.title || 'Product'} added to cart!`, 'success');
    return true;
}

function formatPrice(price) {
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return `₹${numPrice.toFixed(2)}`;
}

function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

function generateStarRating(rating) {
    if (!rating || rating < 0) rating = 0;
    if (rating > 5) rating = 5;

    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star text-warning"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt text-warning"></i>';
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star text-muted"></i>';
    }

    return stars;
}

function updateCartCount() {
    if (typeof window.cartUpdateCartCount === 'function') {
        window.cartUpdateCartCount();
    }
}

// ===============================
// FIXED: AUTH BUTTON FUNCTION
// ===============================
function updateAuthButton() {
    const authBtn = document.getElementById('authButton');
    if (!authBtn) return;

    try {
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');

        if (user && user.username) {
            // User is logged in
            authBtn.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-primary dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle me-1"></i>${user.username}
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i>Profile</a></li>
                        <li><a class="dropdown-item" href="orders.html"><i class="fas fa-box me-2"></i>Orders</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="window.logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                    </ul>
                </div>
            `;
        } else {
            // User is not logged in
            authBtn.innerHTML = '<a href="login.html" class="btn btn-outline-primary"><i class="fas fa-sign-in-alt me-1"></i>Login</a>';
        }
    } catch (e) {
        console.error('Error updating auth button:', e);
        authBtn.innerHTML = '<a href="login.html" class="btn btn-outline-primary"><i class="fas fa-sign-in-alt me-1"></i>Login</a>';
    }
}

// ===============================
// FIXED: LOGOUT FUNCTION
// ===============================
window.logout = function () {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    showNotification('Logged out successfully', 'success');
    updateAuthButton();
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
};

// ===============================
// PRODUCT CARD TEMPLATE
// ===============================
function createProductCard(product, isRelated = false) {
    const description = product.description ?
        product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '') :
        'No description available';

    const image = product.thumbnail || product.image || 'https://via.placeholder.com/300';
    const rating = product.rating || 0;
    const stock = product.stock || 5;

    // For related products in product-details page
    if (isRelated) {
        return `
            <div class="product-card">
                <div class="position-relative">
                    <img src="${image}" 
                         alt="${product.title}"
                         onerror="this.src='https://via.placeholder.com/300'">
                    ${stock <= 10 && stock > 0 ?
                `<span class="badge bg-warning position-absolute top-0 end-0 m-2">Low Stock</span>` :
                ''}
                    ${stock === 0 ?
                `<span class="badge bg-danger position-absolute top-0 end-0 m-2">Out of Stock</span>` :
                ''}
                    ${product.discountPercentage ? `
                        <span class="badge bg-danger position-absolute top-0 start-0 m-2">
                            -${Math.round(product.discountPercentage)}%
                        </span>
                    ` : ''}
                </div>
                <div class="product-card-body">
                    <h5 title="${product.title}">${product.title}</h5>
                    <div class="product-card-rating">
                        <div class="text-warning small d-inline-block">
                            ${generateStarRating(rating)}
                        </div>
                        <small class="text-muted ms-1">(${rating.toFixed(1)})</small>
                    </div>
                    <div class="product-card-price">${formatPrice(product.price)}</div>
                    <button class="btn btn-sm btn-primary add-to-cart-btn" 
                            data-id="${product.id}"
                            data-title="${product.title}"
                            data-price="${product.price}"
                            data-image="${image}"
                            ${stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus me-1"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    // For regular products grid
    return `
        <div class="col-xl-3 col-lg-3 col-md-4 col-sm-6 col-xs-6 mb-4">
            <div class="card product-card h-100 border-0 shadow-sm">
                <div class="position-relative product-image-container">
                    <img src="${image}" 
                         class="card-img-top product-img" 
                         alt="${product.title}"
                         onerror="this.src='https://via.placeholder.com/300'">
                    ${stock <= 10 && stock > 0 ?
            `<span class="badge bg-warning position-absolute top-0 end-0 m-2">Low Stock</span>` :
            ''}
                    ${stock === 0 ?
            `<span class="badge bg-danger position-absolute top-0 end-0 m-2">Out of Stock</span>` :
            ''}
                    ${product.discountPercentage ? `
                        <span class="badge bg-danger position-absolute top-0 start-0 m-2">
                            -${Math.round(product.discountPercentage)}%
                        </span>
                    ` : ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title fw-bold" title="${product.title}">${product.title}</h6>
                    <p class="card-text text-muted small flex-grow-1">${description}</p>
                    <div class="d-flex align-items-center mb-2">
                        <div class="text-warning small">
                            ${generateStarRating(rating)}
                        </div>
                        <small class="text-muted ms-1">(${rating.toFixed(1)})</small>
                    </div>
                    <div class="d-flex align-items-center gap-2 mt-auto mb-3 flex-wrap">
                        ${product.discountPercentage ? `
                            <span class="text-muted product-old-price">
                                ${formatPrice(product.price / (1 - product.discountPercentage / 100))}
                            </span>
                            <span class="text-primary fw-bold">${formatPrice(product.price)}</span>
                            <span class="badge bg-danger">-${Math.round(product.discountPercentage)}%</span>
                        ` : `
                            <span class="text-primary fw-bold">${formatPrice(product.price)}</span>
                        `}
                    </div>
                    <div class="d-flex gap-2 mt-2">
                        <button class="btn btn-sm btn-primary add-to-cart-btn flex-grow-1" 
                                data-id="${product.id}"
                                data-title="${product.title}"
                                data-price="${product.price}"
                                data-image="${image}"
                                ${stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart me-1"></i><span class="d-none d-sm-inline">Cart</span>
                        </button>
                        <button class="btn btn-sm btn-outline-danger add-to-wishlist-btn flex-grow-1" 
                                data-id="${product.id}"
                                data-title="${product.title}"
                                data-price="${product.price}"
                                data-image="${image}"
                                data-description="${product.description || ''}"
                                data-rating="${product.rating || 0}"
                                data-discount="${product.discountPercentage || 0}"
                                data-category="${product.category || 'General'}"
                                title="Add to wishlist">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <a href="product-details.html?id=${product.id}" 
                       class="btn btn-outline-primary btn-sm w-100">
                        <i class="fas fa-eye me-1"></i><span class="d-none d-sm-inline">View</span>
                    </a>
                </div>
            </div>
        </div>
    `;
}

// ===============================
// RENDER PRODUCTS (CENTRAL FUNCTION)
// ===============================
let renderTimeout = null;
let currentRenderBatch = 0;

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) {
        return;
    }

    // Cancel any pending renders to prevent duplicates
    if (renderTimeout) {
        clearTimeout(renderTimeout);
        cancelAnimationFrame(renderTimeout);
    }

    container.innerHTML = '';
    currentRenderBatch = 0;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>No products found</h4>
                <p class="text-muted">Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }

    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `Showing ${products.length} of ${productsAllProducts.length} products`;
    }

    // Render all products at once to prevent multiple renders
    let html = '';
    products.forEach(product => {
        html += createProductCard(product);
    });

    container.innerHTML = html;

    // Attach event listeners for all products
    attachCartEventListeners(products);
}

// ===============================
// ATTACH EVENT LISTENERS
// ===============================
function attachCartEventListeners(products) {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        // Remove existing listeners to prevent duplicates
        button.removeEventListener('click', handleAddToCart);
        button.addEventListener('click', handleAddToCart);
    });

    // Attach wishlist event listeners
    document.querySelectorAll('.add-to-wishlist-btn').forEach(button => {
        button.removeEventListener('click', handleAddToWishlist);
        button.addEventListener('click', handleAddToWishlist);
    });

    // Update wishlist button states
    if (typeof updateWishlistButtons === 'function') {
        updateWishlistButtons();
    }
}

function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const productId = parseInt(button.dataset.id);

    // Try to find product in productsAllProducts
    let product = productsAllProducts.find(p => p.id === productId);

    // If not found, create from data attributes
    if (!product) {
        product = {
            id: productId,
            title: button.dataset.title,
            price: parseFloat(button.dataset.price),
            image: button.dataset.image,
            thumbnail: button.dataset.image
        };
    }

    if (!product) {
        return;
    }

    // Visual feedback
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;

    // Add to cart
    if (addToCart(product, 1)) {
        button.innerHTML = '<i class="fas fa-check"></i> Added!';
        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.disabled = false;
        }, 2000);
    } else {
        button.innerHTML = originalHtml;
        button.disabled = false;
    }
}

function handleAddToWishlist(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const productId = parseInt(button.dataset.id);

    // Try to find product in productsAllProducts
    let product = productsAllProducts.find(p => p.id === productId);

    // If not found, create from data attributes
    if (!product) {
        product = {
            id: productId,
            title: button.dataset.title,
            price: parseFloat(button.dataset.price),
            image: button.dataset.image,
            thumbnail: button.dataset.image,
            description: button.dataset.description || '',
            rating: parseFloat(button.dataset.rating) || 0,
            discountPercentage: parseFloat(button.dataset.discount) || 0,
            category: button.dataset.category || 'General'
        };
    }

    if (!product || !product.id) {
        showNotification('Product not found', 'danger');
        return;
    }

    // Check if already in wishlist
    if (typeof isInWishlist === 'function' && isInWishlist(productId)) {
        if (typeof removeFromWishlist === 'function') {
            removeFromWishlist(productId);
            button.classList.remove('in-wishlist');
            button.innerHTML = '<i class="far fa-heart"></i>';
            button.title = 'Add to wishlist';
            if (typeof updateWishlistCount === 'function') {
                updateWishlistCount();
            }
            // Update button styles
            updateWishlistButtons();
        }
    } else {
        if (typeof addToWishlist === 'function') {
            addToWishlist(product);
            button.classList.add('in-wishlist');
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.title = 'Remove from wishlist';
            if (typeof updateWishlistCount === 'function') {
                updateWishlistCount();
            }
            // Update button styles
            updateWishlistButtons();
        }
    }
}

// ===============================
// FILTER FUNCTIONS
// ===============================
function filterProducts() {
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const minPrice = 0;
    // Get maxPrice from either new single range input or legacy inputs
    const priceRange = document.getElementById('priceRange');
    const maxPrice = priceRange ?
        parseFloat(priceRange.value) :
        (parseFloat(document.getElementById('priceMax')?.value) || 100000);
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const sortBy = document.getElementById('sortFilter')?.value || 'default';

    // Apply filters
    filteredProducts = productsAllProducts.filter(product => {
        // Category filter
        if (category !== 'all' && product.category !== category) {
            return false;
        }

        // Price filter
        if (product.price < minPrice || product.price > maxPrice) {
            return false;
        }

        // Search filter
        if (searchTerm && !product.title.toLowerCase().includes(searchTerm) &&
            !product.description.toLowerCase().includes(searchTerm)) {
            return false;
        }

        return true;
    });

    // Apply sorting
    sortProducts(filteredProducts, sortBy);

    // Render filtered products
    renderProducts(filteredProducts);
}

function sortProducts(products, sortBy) {
    switch (sortBy) {
        case 'price-low':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'name':
            products.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'newest':
            // Assuming newer products have higher IDs
            products.sort((a, b) => b.id - a.id);
            break;
        default:
            // Default sort (original order)
            break;
    }
}

function populateCategories() {
    const categorySelect = document.getElementById('categoryFilter');
    if (!categorySelect || productsAllProducts.length === 0) return;

    // Get unique categories
    const categories = [...new Set(productsAllProducts.map(p => p.category).filter(Boolean))];

    // Clear existing options (keep "All Categories")
    categorySelect.innerHTML = '<option value="all">All Categories</option>';

    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categorySelect.appendChild(option);
    });
}

function setupFilters() {
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    // Price range filters (new single range input)
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            const maxPrice = parseInt(e.target.value);
            const priceValue = document.getElementById('priceValue');
            if (priceValue) {
                priceValue.textContent = `₹0 - ₹${maxPrice.toLocaleString('en-IN')}`;
            }
            filterProducts();
        });
    }

    // Price range filters (legacy support)
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    if (priceMin && priceMax) {
        priceMin.addEventListener('input', filterProducts);
        priceMax.addEventListener('input', filterProducts);
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', filterProducts);
    }
}

// ===============================
// LOAD FUNCTIONS
// ===============================
async function loadAllProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) {
        console.log('Products container not found');
        return;
    }

    showLoading(container);

    try {
        console.log('[v0] Loading products from API...');
        const response = await fetch(`${window.API_BASE_URL}/products?limit=10000`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        productsAllProducts = data.products || [];
        filteredProducts = [...productsAllProducts];

        // Make products available globally for other modules with a unique name
        window.productsAllProducts = productsAllProducts;
        window.allProducts = productsAllProducts; // Also store as allProducts for compatibility

        console.log(`[v0] Loaded ${productsAllProducts.length} products`);

        // Initialize filters
        populateCategories();
        setupFilters();

        // Render all products
        renderProducts(productsAllProducts);

    } catch (error) {
        console.error('[v0] Error loading products, retrying...', error);
        
        // Retry with basic endpoint
        try {
            console.log('[v0] Retrying with /products endpoint...');
            const retryResponse = await fetch(`${window.API_BASE_URL}/products`);
            if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                productsAllProducts = retryData.products || [];
                filteredProducts = [...productsAllProducts];
                window.productsAllProducts = productsAllProducts;
                window.allProducts = productsAllProducts;
                
                console.log(`[v0] Loaded ${productsAllProducts.length} products on retry`);
                populateCategories();
                setupFilters();
                renderProducts(productsAllProducts);
            } else {
                throw new Error('Retry failed');
            }
        } catch (retryError) {
            console.error('[v0] Retry failed:', retryError);
            showError(container, 'Failed to load products. Please check your connection.');
        }
    }
}

async function loadLatestProducts() {
    const container = document.getElementById('latestProducts');
    if (!container) {
        console.log('[v0] Latest products container not found');
        return;
    }

    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    try {
        console.log('[v0] Fetching latest products...');
        const response = await fetch(`${window.API_BASE_URL}/products?limit=100`);
        if (!response.ok) throw new Error('Failed to load products');

        const data = await response.json();
        const allFetchedProducts = data.products || [];

        console.log('[v0] Fetched', allFetchedProducts.length, 'total products');

        // Get the latest 8 products (newest by ID)
        const latestProducts = allFetchedProducts.sort((a, b) => b.id - a.id).slice(0, 8);

        console.log('[v0] Displaying', latestProducts.length, 'latest products');

        if (latestProducts.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No products available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        // Add each product card
        let html = '';
        latestProducts.forEach(product => {
            html += createProductCard(product);
        });
        container.innerHTML = html;

        // Attach event listeners after rendering
        setTimeout(() => {
            attachCartEventListeners(latestProducts);

            // Update wishlist button states
            if (typeof updateWishlistButtons === 'function') {
                updateWishlistButtons();
            }

            console.log('[v0] Latest products loaded and listeners attached');
        }, 100);

    } catch (error) {
        console.error('[v0] Error loading latest products:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="text-muted">Failed to load products. Please refresh the page.</p>
            </div>
        `;
    }
}

async function loadProductDetails() {
    const productId = getQueryParam('id');
    const container = document.getElementById('productDetails');
    if (!container || !productId) return;

    showLoading(container);

    try {
        const response = await fetch(`${window.API_BASE_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Product not found');

        const product = await response.json();

        // Update page title
        document.title = `${product.title} - ShopEasy`;

        // Render product details
        renderProductDetails(product);

        // Load related products
        await loadRelatedProducts(product.category);

    } catch (error) {
        console.error('Error loading product details:', error);
        showError(container, 'Product not found. It may have been removed or the link is incorrect.');
    }
}

function renderProductDetails(product) {
    const container = document.getElementById('productDetails');
    if (!container) return;

    const images = product.images || [product.thumbnail || 'https://via.placeholder.com/500'];
    const rating = product.rating || 0;
    const stock = product.stock || 0;
    const isInStock = stock > 0;

    container.innerHTML = `
        <div class="product-details-wrapper">
            <div class="row g-4">
                <!-- Product Images Gallery -->
                <div class="col-lg-6">
                    <div class="product-image-gallery">
                        <div class="product-main-image" id="zoomContainer">
                            <img id="mainProductImage" 
                                 src="${images[0] || 'https://via.placeholder.com/500'}" 
                                 alt="${product.title}"
                                 style="cursor: zoom-in;"
                                 onerror="this.src='https://via.placeholder.com/500'">
                            <div class="zoom-lens" id="zoomLens"></div>
                        </div>
                        <div class="zoom-result" id="zoomResult"></div>
                        ${images.length > 1 ? `
                            <div class="product-thumbnails">
                                ${images.map((img, index) => `
                                    <img src="${img}" 
                                         alt="Product ${index + 1}"
                                         class="thumbnail-img ${index === 0 ? 'active' : ''}"
                                         onclick="updateMainImage('${img}', event);"
                                         onerror="this.src='https://via.placeholder.com/80'">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            
                <!-- Product Info -->
                <div class="col-lg-6">
                    <div class="product-info">
                        <h1>${product.title}</h1>
                        
                        <!-- Rating -->
                        <div class="product-rating">
                            <div class="stars">${generateStarRating(rating)}</div>
                            <span>(${rating.toFixed(1)}/5)</span>
                            <span class="ms-3" style="font-size: 0.85rem; color: var(--secondary);">${product.reviewCount || Math.floor(rating * 50)} customer reviews</span>
                        </div>
                        
                        <!-- Price -->
                        <div class="product-price">
                            ${product.discountPercentage ? `
                                <span class="original-price" style="text-decoration: line-through; color: var(--secondary); font-size: 0.9rem; margin-right: 0.5rem;">${formatPrice(product.price / (1 - product.discountPercentage / 100))}</span>
                            ` : ''}
                            <span class="discounted-price" style="font-size: 1.5rem; font-weight: 600; color: var(--primary);">${formatPrice(product.price)}</span>
                            ${product.discountPercentage ? `
                                <span class="badge bg-danger ms-2">-${Math.round(product.discountPercentage)}%</span>
                            ` : ''}
                        </div>
                        
                        <!-- Stock Status -->
                        <div class="mb-3">
                            ${isInStock ?
            `<span class="badge bg-success p-2"><i class="fas fa-check-circle me-1"></i>In Stock (${stock} available)</span>` :
            `<span class="badge bg-danger p-2"><i class="fas fa-times-circle me-1"></i>Out of Stock</span>`
        }
                        </div>
                        
                        <!-- Description -->
                        <div class="product-description">
                            ${product.description || 'No description available.'}
                        </div>
                        
                        <!-- Product Specs -->
                        <div class="product-specs">
                            <h6 class="mb-3">Product Details</h6>
                            <ul class="specs-list">
                                <li><span class="specs-label">Brand:</span><span class="specs-value">${product.brand || 'Not specified'}</span></li>
                                <li><span class="specs-label">Category:</span><span class="specs-value">${product.category || 'Uncategorized'}</span></li>
                                <li><span class="specs-label">SKU:</span><span class="specs-value">${product.sku || 'N/A'}</span></li>
                                <li><span class="specs-label">Weight:</span><span class="specs-value">${product.weight || 'Not specified'}</span></li>
                            </ul>
                        </div>
                        
                        <!-- Quantity & Actions -->
                        <div class="quantity-selector mt-4">
                            <label>Quantity:</label>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <button class="btn btn-sm btn-outline-secondary" type="button" id="decreaseQty"><i class="fas fa-minus"></i></button>
                                <input type="number" class="form-control" id="quantity" value="1" min="1" max="${stock || 999}">
                                <button class="btn btn-sm btn-outline-secondary" type="button" id="increaseQty"><i class="fas fa-plus"></i></button>
                                <span class="ms-auto" style="font-weight: 600; color: var(--primary);">Total: <span id="totalPrice">${formatPrice(product.price)}</span></span>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="product-actions">
                            <button class="btn btn-primary ${!isInStock ? 'disabled' : ''}" 
                                    id="addToCartBtn" ${!isInStock ? 'disabled' : ''}>
                                <i class="fas fa-shopping-cart me-2"></i>Add to Cart
                            </button>
                            <button class="btn btn-outline-primary" id="wishlistBtn">
                                <i class="fas fa-heart me-2"></i>Add to Wishlist
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Attach event listeners
    setupProductDetailListeners(product);
}

function setupProductDetailListeners(product) {
    const quantityInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const totalPriceSpan = document.getElementById('totalPrice');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const wishlistBtn = document.getElementById('wishlistBtn');

    // Update total price
    function updateTotalPrice() {
        const quantity = parseInt(quantityInput.value) || 1;
        const total = product.price * quantity;
        totalPriceSpan.textContent = formatPrice(total);
    }

    // Quantity controls
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value) || 1;
            if (quantity > 1) {
                quantity--;
                quantityInput.value = quantity;
                updateTotalPrice();
            }
        });
    }

    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value) || 1;
            const max = parseInt(quantityInput.max) || 999;
            if (quantity < max) {
                quantity++;
                quantityInput.value = quantity;
                updateTotalPrice();
            }
        });
    }

    if (quantityInput) {
        quantityInput.addEventListener('change', updateTotalPrice);
        quantityInput.addEventListener('input', updateTotalPrice);
    }

    // Add to cart button
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value) || 1;

            if (addToCart(product, quantity)) {
                // Visual feedback
                const originalHtml = addToCartBtn.innerHTML;
                addToCartBtn.innerHTML = '<i class="fas fa-check me-2"></i>Added!';
                addToCartBtn.disabled = true;

                setTimeout(() => {
                    addToCartBtn.innerHTML = originalHtml;
                    addToCartBtn.disabled = false;
                }, 2000);
            }
        });
    }

    // Wishlist button
    if (wishlistBtn) {
        // Update button state if product is already in wishlist
        if (typeof isInWishlist === 'function' && isInWishlist(product.id)) {
            wishlistBtn.classList.add('in-wishlist');
            wishlistBtn.innerHTML = '<i class="fas fa-heart me-2"></i>Remove from Wishlist';
        }

        wishlistBtn.addEventListener('click', () => {
            if (typeof isInWishlist === 'function' && isInWishlist(product.id)) {
                // Remove from wishlist
                if (typeof removeFromWishlist === 'function') {
                    removeFromWishlist(product.id);
                    wishlistBtn.classList.remove('in-wishlist');
                    wishlistBtn.innerHTML = '<i class="fas fa-heart me-2"></i>Add to Wishlist';
                    if (typeof updateWishlistCount === 'function') {
                        updateWishlistCount();
                    }
                }
            } else {
                // Add to wishlist
                if (typeof addToWishlist === 'function') {
                    addToWishlist(product);
                    wishlistBtn.classList.add('in-wishlist');
                    wishlistBtn.innerHTML = '<i class="fas fa-heart me-2"></i>Remove from Wishlist';
                    if (typeof updateWishlistCount === 'function') {
                        updateWishlistCount();
                    }
                }
            }
        });
    }
}

async function loadRelatedProducts(category) {
    const container = document.getElementById('relatedProducts');
    if (!container || !category) return;

    try {
        const response = await fetch(`${window.API_BASE_URL}/products/category/${encodeURIComponent(category)}?limit=8`);
        if (!response.ok) return;

        const data = await response.json();
        const currentProductId = parseInt(getQueryParam('id'));
        const relatedProducts = data.products.filter(p => p.id !== currentProductId).slice(0, 4);

        if (relatedProducts.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }

        // Clear the existing heading and use proper grid layout
        let html = '';
        relatedProducts.forEach(product => {
            html += createProductCard(product);
        });

        container.innerHTML = html;

        // Attach event listeners for cart and wishlist
        attachCartEventListeners(relatedProducts);

        // Update wishlist button states
        if (typeof updateWishlistButtons === 'function') {
            updateWishlistButtons();
        }

    } catch (error) {
        console.error('Error loading related products:', error);
        container.parentElement.style.display = 'none';
    }
}

// ===============================
// PAGE INITIALIZATION
// ===============================

// Flag to prevent multiple initializations
let pageInitialized = false;

function initializePage() {
    // Prevent duplicate initialization
    if (pageInitialized) {
        console.log('[v0] Products.js: Page already initialized, skipping...');
        return;
    }
    pageInitialized = true;

    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    console.log('[v0] Products.js: Initializing page:', page);

    // Initialize based on page
    if (page === 'index.html' || path === '/' || path === '' || path.endsWith('/')) {
        loadLatestProducts();
    } else if (page === 'products.html') {
        loadAllProducts();
        setupFilters();
    } else if (page.includes('product-details.html')) {
        loadProductDetails();
    }
}

// ===============================
// IMAGE ZOOM FUNCTIONALITY
// ===============================

function updateMainImage(imgSrc, event) {
    const mainImage = document.getElementById('mainProductImage');
    if (mainImage) {
        mainImage.src = imgSrc;
        document.querySelectorAll('.thumbnail-img').forEach(el => el.classList.remove('active'));
        if (event && event.target) {
            event.target.classList.add('active');
        }
        initializeZoom();
    }
}

function initializeZoom() {
    const container = document.getElementById('zoomContainer');
    const mainImage = document.getElementById('mainProductImage');
    const zoomLens = document.getElementById('zoomLens');
    const zoomResult = document.getElementById('zoomResult');

    if (!container || !mainImage || !zoomLens || !zoomResult) return;

    // Set zoom result image
    zoomResult.style.backgroundImage = `url('${mainImage.src}')`;

    // Zoom lens effect
    container.addEventListener('mouseenter', () => {
        zoomLens.classList.add('active');
        zoomResult.classList.add('active');
        mainImage.style.cursor = 'zoom-in';
    });

    container.addEventListener('mouseleave', () => {
        zoomLens.classList.remove('active');
        zoomResult.classList.remove('active');
    });

    container.addEventListener('mousemove', (e) => {
        if (!zoomLens.classList.contains('active')) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Position zoom lens
        let lensX = x - zoomLens.offsetWidth / 2;
        let lensY = y - zoomLens.offsetHeight / 2;

        // Keep lens within container
        lensX = Math.max(0, Math.min(lensX, rect.width - zoomLens.offsetWidth));
        lensY = Math.max(0, Math.min(lensY, rect.height - zoomLens.offsetHeight));

        zoomLens.style.left = lensX + 'px';
        zoomLens.style.top = lensY + 'px';

        // Calculate zoom position
        const zoomX = (-lensX) * (400 / 100);
        const zoomY = (-lensY) * (400 / 100);

        zoomResult.style.backgroundPosition = zoomX + 'px ' + zoomY + 'px';
    });

    // Touch zoom for mobile
    let touchStartDistance = 0;

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            touchStartDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    });

    container.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            const touchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            if (touchDistance > touchStartDistance) {
                mainImage.style.transform = 'scale(1.2)';
            } else {
                mainImage.style.transform = 'scale(1)';
            }
        }
    });

    container.addEventListener('touchend', () => {
        mainImage.style.transform = 'scale(1)';
    });
}

// ===============================
// EXPORT FUNCTIONS
// ===============================
window.loadAllProducts = loadAllProducts;
window.loadLatestProducts = loadLatestProducts;
window.loadProductDetails = loadProductDetails;
window.filterProducts = filterProducts;
window.addToCart = addToCart;
window.formatPrice = formatPrice;
window.renderProducts = renderProducts;
window.productsAllProducts = productsAllProducts;
window.updateMainImage = updateMainImage;
window.initializeZoom = initializeZoom;

// ===============================
// PAGE INITIALIZATION FUNCTION
// ===============================
function initializePage() {
    const latestProductsContainer = document.getElementById('latestProducts');
    const productDetailsContainer = document.getElementById('productDetails');
    const productsContainer = document.getElementById('productsContainer');
    const categoryListContainer = document.getElementById('categoryList');

    if (latestProductsContainer) {
        loadLatestProducts();
    }

    if (productDetailsContainer) {
        loadProductDetails();
        setTimeout(initializeZoom, 500);
    }

    if (productsContainer) {
        loadAllProducts();
    }

    if (categoryListContainer && typeof loadCategories === 'function') {
        loadCategories();
    }
}

// ===============================
// DOM READY - SINGLE INITIALIZATION
// ===============================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
