// products.js - UPDATED & FIXED
// ===============================
// Products Management Module
// ===============================

// API Base URL
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://dummyjson.com';
}
const API_BASE_URL = window.API_BASE_URL;

// Global variables
let allProducts = [];
let filteredProducts = [];

// Helper functions
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
    // Use main.js notification if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 80px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function addToCart(product, quantity = 1) {
    if (!product || !product.id) {
        showNotification('Invalid product', 'danger');
        return false;
    }

    // Use cart.js function if available
    if (typeof window.cartAddToCart === 'function') {
        // Create a product object with required properties
        const cartProduct = {
            id: product.id,
            title: product.title || product.name || 'Unknown Product',
            price: product.price || 0,
            image: product.image || product.thumbnail || 'https://via.placeholder.com/80',
            qty: quantity
        };
        window.cartAddToCart(cartProduct);
        return true;
    }

    // Fallback to localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].qty = (cart[existingIndex].qty || 1) + quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title || product.name || 'Unknown Product',
            price: product.price || 0,
            image: product.image || product.thumbnail || 'https://via.placeholder.com/80',
            qty: quantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    // Update cart count
    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
    }

    showNotification(`${product.title || 'Product'} added to cart!`, 'success');
    return true;
}

function formatPrice(price) {
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return `₹${numPrice.toFixed(0)}`;
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
// PRODUCT CARD TEMPLATE
// ===============================
function createProductCard(product) {
    const description = product.description ?
        product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '') :
        'No description available';

    const image = product.thumbnail || product.image || 'https://via.placeholder.com/300';
    const rating = product.rating || 0;
    const stock = product.stock || 5;

    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="card product-card h-100 border-0 shadow-sm">
                <div class="position-relative">
                    <img src="${image}" 
                         class="card-img-top product-img" 
                         alt="${product.title}"
                         style="height: 200px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/300'">
                    ${stock <= 10 && stock > 0 ?
            `<span class="badge bg-warning position-absolute top-0 end-0 m-2">Low Stock</span>` :
            ''}
                    ${stock === 0 ?
            `<span class="badge bg-danger position-absolute top-0 end-0 m-2">Out of Stock</span>` :
            ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title fw-bold mb-2" title="${product.title}">${product.title}</h6>
                    <p class="card-text text-muted small mb-2 flex-grow-1">${description}</p>
                    <div class="d-flex align-items-center mb-2">
                        <div class="text-warning small">
                            ${generateStarRating(rating)}
                        </div>
                        <small class="text-muted ms-1">(${rating.toFixed(1)})</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="text-primary fw-bold fs-5">${formatPrice(product.price)}</span>
                        <button class="btn btn-sm btn-primary add-to-cart-btn" 
                                data-id="${product.id}"
                                ${stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Add
                        </button>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <a href="product-details.html?id=${product.id}" 
                       class="btn btn-outline-primary btn-sm w-100">
                        <i class="fas fa-eye me-1"></i> View Details
                    </a>
                </div>
            </div>
        </div>
    `;
}

// ===============================
// RENDER PRODUCTS (CENTRAL FUNCTION)
// ===============================
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) {
        console.error('Products container not found');
        return;
    }

    container.innerHTML = '';

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
        resultsCount.textContent = `Showing ${products.length} of ${allProducts.length} products`;
    }

    // Render products in batches for better performance
    const batchSize = 12;
    const batches = Math.ceil(products.length / batchSize);

    let currentBatch = 0;

    function renderBatch() {
        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, products.length);
        const batch = products.slice(start, end);

        let html = '';
        batch.forEach(product => {
            html += createProductCard(product);
        });

        container.innerHTML += html;

        // Attach event listeners for this batch
        attachCartEventListeners(batch);

        currentBatch++;
        if (currentBatch < batches) {
            // Render next batch on next animation frame
            requestAnimationFrame(renderBatch);
        }
    }

    renderBatch();
}

// ===============================
// ATTACH EVENT LISTENERS
// ===============================
function attachCartEventListeners(products) {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const productId = parseInt(this.dataset.id);
            const product = products.find(p => p.id === productId);

            if (!product) {
                console.error('Product not found:', productId);
                return;
            }

            // Visual feedback
            const originalHtml = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            this.disabled = true;

            // Add to cart
            if (addToCart(product, 1)) {
                this.innerHTML = '<i class="fas fa-check"></i> Added!';
                setTimeout(() => {
                    this.innerHTML = originalHtml;
                    this.disabled = false;
                }, 2000);
            } else {
                this.innerHTML = originalHtml;
                this.disabled = false;
            }
        });
    });
}

// ===============================
// FILTER FUNCTIONS
// ===============================
function filterProducts() {
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const minPrice = parseFloat(document.getElementById('priceMin')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('priceMax')?.value) || 1000;
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const sortBy = document.getElementById('sortFilter')?.value || 'default';

    // Apply filters
    filteredProducts = allProducts.filter(product => {
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

    // Update price range display
    const priceDisplay = document.getElementById('priceDisplay');
    if (priceDisplay) {
        priceDisplay.textContent = `₹${minPrice} - ₹${maxPrice}`;
    }
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
    if (!categorySelect || allProducts.length === 0) return;

    // Get unique categories
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

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

    // Price range filters
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
        console.log('Loading products from API...');
        const response = await fetch(`${API_BASE_URL}/products?limit=100`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allProducts = data.products;
        filteredProducts = [...allProducts];

        console.log(`Loaded ${allProducts.length} products`);

        // Initialize filters
        populateCategories();
        setupFilters();

        // Render all products
        renderProducts(allProducts);

    } catch (error) {
        console.error('Error loading products:', error);
        showError(container, 'Failed to load products. Please check your connection.');
    }
}

async function loadLatestProducts() {
    const container = document.getElementById('latestProducts');
    if (!container) return;

    showLoading(container);

    try {
        const response = await fetch(`${API_BASE_URL}/products?limit=8`);
        if (!response.ok) throw new Error('Failed to load products');

        const data = await response.json();
        const products = data.products;

        container.innerHTML = '';

        products.forEach(product => {
            container.innerHTML += createProductCard(product);
        });

        // Attach event listeners
        attachCartEventListeners(products);

    } catch (error) {
        console.error('Error loading latest products:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="text-muted">Failed to load products</p>
            </div>
        `;
    }
}

// ===============================
// PRODUCT DETAILS
// ===============================
async function loadProductDetails() {
    const productId = getQueryParam('id');
    if (!productId) {
        window.location.href = 'products.html';
        return;
    }

    const container = document.getElementById('productDetails');
    if (!container) return;

    showLoading(container);

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
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
        <div class="row">
            <!-- Product Images -->
            <div class="col-lg-6 mb-4">
                <div class="card border-0 shadow-sm">
                    <div class="card-body p-0">
                        <div id="productCarousel" class="carousel slide" data-bs-ride="carousel">
                            <div class="carousel-inner">
                                ${images.map((img, index) => `
                                    <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                        <img src="${img}" 
                                             class="d-block w-100" 
                                             alt="${product.title}"
                                             style="height: 400px; object-fit: contain;"
                                             onerror="this.src='https://via.placeholder.com/500'">
                                    </div>
                                `).join('')}
                            </div>
                            ${images.length > 1 ? `
                                <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                                    <span class="carousel-control-prev-icon"></span>
                                </button>
                                <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                                    <span class="carousel-control-next-icon"></span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Product Info -->
            <div class="col-lg-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <h1 class="h2 mb-3">${product.title}</h1>
                        
                        <!-- Rating -->
                        <div class="d-flex align-items-center mb-3">
                            <div class="text-warning me-2">
                                ${generateStarRating(rating)}
                            </div>
                            <span class="text-muted">(${rating.toFixed(1)}/5)</span>
                            <span class="ms-3 badge bg-light text-dark">
                                ${product.reviews || 0} reviews
                            </span>
                        </div>
                        
                        <!-- Price -->
                        <div class="mb-4">
                            <span class="display-4 fw-bold text-primary">${formatPrice(product.price)}</span>
                        </div>
                        
                        <!-- Stock Status -->
                        <div class="mb-4">
                            ${isInStock ?
            `<span class="badge bg-success p-2"><i class="fas fa-check me-1"></i> In Stock (${stock} available)</span>` :
            `<span class="badge bg-danger p-2"><i class="fas fa-times me-1"></i> Out of Stock</span>`
        }
                        </div>
                        
                        <!-- Description -->
                        <div class="mb-4">
                            <h5 class="mb-2">Description</h5>
                            <p class="text-muted">${product.description || 'No description available.'}</p>
                        </div>
                        
                        <!-- Details -->
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="mb-2">
                                    <strong>Brand:</strong> ${product.brand || 'Not specified'}
                                </div>
                                <div class="mb-2">
                                    <strong>Category:</strong> ${product.category || 'Uncategorized'}
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-2">
                                    <strong>SKU:</strong> ${product.sku || 'N/A'}
                                </div>
                                <div class="mb-2">
                                    <strong>Weight:</strong> ${product.weight || 'Not specified'}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quantity & Actions -->
                        <div class="border-top pt-4">
                            <div class="row align-items-center mb-4">
                                <div class="col-auto">
                                    <label class="form-label mb-0">Quantity:</label>
                                </div>
                                <div class="col-auto">
                                    <div class="input-group" style="width: 150px;">
                                        <button class="btn btn-outline-secondary" type="button" id="decreaseQty">-</button>
                                        <input type="number" class="form-control text-center" id="quantity" value="1" min="1" max="${stock}">
                                        <button class="btn btn-outline-secondary" type="button" id="increaseQty">+</button>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="text-end">
                                        <strong>Total:</strong> <span id="totalPrice" class="text-primary fs-4">${formatPrice(product.price)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="d-flex gap-3">
                                <button class="btn btn-primary btn-lg flex-grow-1 ${!isInStock ? 'disabled' : ''}" 
                                        id="addToCartBtn" ${!isInStock ? 'disabled' : ''}>
                                    <i class="fas fa-cart-plus me-2"></i>Add to Cart
                                </button>
                                <button class="btn btn-outline-danger btn-lg" id="wishlistBtn">
                                    <i class="fas fa-heart"></i>
                                </button>
                            </div>
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
            product.requestedQuantity = quantity;

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
        wishlistBtn.addEventListener('click', () => {
            wishlistBtn.classList.toggle('active');
            if (wishlistBtn.classList.contains('active')) {
                wishlistBtn.innerHTML = '<i class="fas fa-heart text-danger"></i>';
                showNotification('Added to wishlist', 'success');
            } else {
                wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
                showNotification('Removed from wishlist', 'info');
            }
        });
    }
}

async function loadRelatedProducts(category) {
    const container = document.getElementById('relatedProducts');
    if (!container || !category) return;

    try {
        const response = await fetch(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}?limit=4`);
        if (!response.ok) return;

        const data = await response.json();
        const products = data.products.filter(p => p.id !== parseInt(getQueryParam('id')));

        if (products.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = `
            <h3 class="mb-4">Related Products</h3>
            <div class="row" id="relatedProductsGrid"></div>
        `;

        const grid = document.getElementById('relatedProductsGrid');
        products.forEach(product => {
            grid.innerHTML += createProductCard(product);
        });

        // Attach event listeners
        attachCartEventListeners(products);

    } catch (error) {
        console.error('Error loading related products:', error);
        container.style.display = 'none';
    }
}

// ===============================
// PAGE INITIALIZATION
// ===============================
function initializePage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    console.log('Initializing page:', page);

    // Update cart count
    updateCartCount();

    // Initialize based on page
    if (page === 'index.html' || path === '/' || path === '' || path.endsWith('/')) {
        loadLatestProducts();
    } else if (page === 'products.html') {
        loadAllProducts();
    } else if (page.includes('product-details.html')) {
        loadProductDetails();
    }
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

// ===============================
// DOM READY
// ===============================
document.addEventListener('DOMContentLoaded', initializePage);