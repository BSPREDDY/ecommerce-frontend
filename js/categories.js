// categories.js - COMPLETE FIXED VERSION
// ===============================
// Category Management Module
// ===============================

// API Configuration
const API_URL = window.API_BASE_URL || 'https://dummyjson.com';
const CATEGORY_API = `${API_URL}/products/categories`;

// Category Images Mapping
const CATEGORY_IMAGES = {
    electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    jewelery: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    "men's clothing": 'https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    "women's clothing": 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    beauty: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    fragrances: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    automotive: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    lighting: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    skincare: 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
};

// Fallback Categories
const FALLBACK_CATEGORIES = [
    "electronics", "jewelery", "men's clothing", "women's clothing",
    "fragrances", "groceries", "furniture", "beauty", "sports",
    "automotive", "lighting", "skincare"
];

// Global variables
let categories = [];
let categoryProducts = [];

// ===============================
// UTILITY FUNCTIONS
// ===============================

function getCategoryImage(category) {
    if (!category) return CATEGORY_IMAGES.default;

    const categoryStr = typeof category === 'object' && category.name ? category.name : category;
    const key = String(categoryStr).toLowerCase().trim();

    const categoryMap = {
        'jewelry': 'jewelery',
        'mens clothing': "men's clothing",
        'womens clothing': "women's clothing"
    };

    const normalizedKey = categoryMap[key] || key;
    return CATEGORY_IMAGES[normalizedKey] || CATEGORY_IMAGES.default;
}

function formatCategoryName(category) {
    if (!category) return 'Unknown';

    let categoryStr = typeof category === 'string' ? category : String(category);
    if (categoryStr.trim() === '') return 'Unknown';

    return categoryStr
        .replace(/-/g, ' ')
        .replace(/'s/g, "'s")
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

function showLoading(container, message = 'Loading...') {
    if (!container) return;
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h4>${message}</h4>
        </div>
    `;
}

function showError(container, message) {
    if (!container) return;
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
            <h4>${message}</h4>
            <p class="text-muted">Please try again later</p>
            <button class="btn btn-primary mt-3" onclick="location.reload()">
                <i class="fas fa-redo me-2"></i>Retry
            </button>
        </div>
    `;
}

function showNotification(message, type = 'success') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 80px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function generateStarRating(rating) {
    if (!rating || rating < 0) rating = 0;
    if (rating > 5) rating = 5;

    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star text-warning small"></i>';
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt text-warning small"></i>';
    for (let i = 0; i < 5 - fullStars - (hasHalfStar ? 1 : 0); i++) stars += '<i class="far fa-star text-muted small"></i>';

    return stars;
}

// ===============================
// FIXED: formatPrice - NO RECURSION
// ===============================
function formatPrice(price) {
    // Use window.formatPrice if available, but DON'T call recursively
    if (typeof window.formatPrice === 'function' && window.formatPrice !== formatPrice) {
        return window.formatPrice(price);
    }

    // Fallback implementation
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return `₹${numPrice.toFixed(0)}`;
}

// ===============================
// CATEGORY CARD TEMPLATE
// ===============================

function createCategoryCard(category) {
    if (!category) return '';

    const categoryValue = typeof category === 'object' && category.name ? category.name : category;
    const categoryName = formatCategoryName(categoryValue);
    const categoryImage = getCategoryImage(categoryValue);

    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="card category-card h-100 shadow-sm border-0">
                <div class="category-image-wrapper overflow-hidden" style="height: 200px;">
                    <img src="${categoryImage}" 
                         class="card-img-top w-100 h-100" 
                         style="object-fit: cover; transition: transform 0.3s ease;"
                         alt="${categoryName}"
                         onerror="this.src='https://via.placeholder.com/300x200/6c757d/ffffff?text=${encodeURIComponent(categoryName)}'">
                </div>
                <div class="card-body d-flex flex-column text-center p-3">
                    <h5 class="card-title mb-3 fw-bold">${categoryName}</h5>
                    <a href="categories.html?category=${encodeURIComponent(categoryValue)}" class="btn btn-primary mt-auto px-4">
                        Shop Now <i class="fas fa-arrow-right ms-2"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
}

// ===============================
// PRODUCT CARD TEMPLATE
// ===============================

function createProductCard(product) {
    if (!product) return '';

    const description = product.description ?
        product.description.substring(0, 80) + (product.description.length > 80 ? '...' : '') :
        'No description available';

    const image = product.thumbnail || product.image || 'https://via.placeholder.com/300';
    const rating = product.rating || 0;
    const stock = product.stock || 0;
    const isInStock = stock > 0;

    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="card product-card h-100 shadow-sm border-0">
                <div class="position-relative">
                    <img src="${image}" 
                         class="card-img-top" 
                         alt="${product.title}"
                         style="height: 120px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/300'">
                    <span class="badge ${isInStock ? 'bg-success' : 'bg-danger'} position-absolute top-0 end-0 m-2">
                        ${isInStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    ${product.discountPercentage ? `
                        <span class="badge bg-warning position-absolute top-0 start-0 m-2">
                            -${Math.round(product.discountPercentage)}%
                        </span>
                    ` : ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title fw-bold mb-2" title="${product.title}">${product.title}</h6>
                    <p class="card-text text-muted small mb-2 flex-grow-1">${description}</p>
                    <div class="d-flex align-items-center mb-2">
                        <div class="text-warning">${generateStarRating(rating)}</div>
                        <small class="text-muted ms-1">(${rating.toFixed(1)})</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="text-primary fw-bold fs-5">${formatPrice(product.price)}</span>
                        <button class="btn btn-sm btn-primary add-to-cart-btn" 
                                data-id="${product.id}"
                                data-title="${product.title}"
                                data-price="${product.price}"
                                data-image="${image}"
                                ${!isInStock ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Add
                        </button>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <a href="product-details.html?id=${product.id}" class="btn btn-outline-primary btn-sm w-100">
                        <i class="fas fa-eye me-1"></i> View Details
                    </a>
                </div>
            </div>
        </div>
    `;
}

// ===============================
// LOAD PRODUCTS
// ===============================

async function loadCategoryProducts() {
    // Try to get products from window.allProducts first
    if (window.allProducts && window.allProducts.length > 0) {
        categoryProducts = window.allProducts;
        console.log(`[Categories] Using ${categoryProducts.length} products from window.allProducts`);
        return categoryProducts;
    }

    try {
        console.log('[Categories] Loading products from API...');
        const response = await fetch(`${API_URL}/products?limit=100`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        categoryProducts = data.products || [];
        window.allProducts = categoryProducts; // Share with other modules
        console.log(`[Categories] Loaded ${categoryProducts.length} products`);
        return categoryProducts;
    } catch (error) {
        console.error('[Categories] Error loading products:', error);
        return [];
    }
}

// ===============================
// FILTER BY CATEGORY - MAIN FUNCTION
// ===============================

async function filterByCategory(category) {
    console.log('Filtering by category:', category);

    // Update URL
    const url = new URL(window.location);
    if (category && category !== 'all') {
        url.searchParams.set('category', encodeURIComponent(category));
    } else {
        url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url);

    const container = document.getElementById('categoryProducts');
    const categoryList = document.getElementById('categoryList');

    if (!container || !categoryList) return;

    // Hide category list, show products container
    categoryList.style.display = 'none';
    container.style.display = 'block';

    // Show loading
    showLoading(container, `Loading ${formatCategoryName(category)} products...`);

    // Load products if needed
    if (categoryProducts.length === 0) {
        await loadCategoryProducts();
    }

    // Get products from either local variable or window
    const productsSource = categoryProducts.length > 0 ? categoryProducts : (window.allProducts || []);

    // Filter products by category
    const filtered = productsSource.filter(product =>
        product.category && product.category.toLowerCase() === category.toLowerCase()
    );

    if (filtered.length === 0) {
        // Try direct API call for this category
        try {
            const response = await fetch(`${API_URL}/products/category/${encodeURIComponent(category)}`);
            if (response.ok) {
                const data = await response.json();
                const apiProducts = data.products || [];
                filtered.push(...apiProducts);
            }
        } catch (error) {
            console.error('Error fetching category products from API:', error);
        }
    }

    console.log(`Found ${filtered.length} products in category ${category}`);

    // Update title
    const titleElement = document.getElementById('categoryTitle');
    if (titleElement) {
        titleElement.innerHTML = `
            <div class="d-flex align-items-center flex-wrap">
                <button onclick="window.showAllCategories()" class="btn btn-outline-secondary me-3 mb-2">
                    <i class="fas fa-arrow-left"></i> All Categories
                </button>
                <h2 class="mb-0">${formatCategoryName(category)}</h2>
            </div>
        `;
    }

    // Display products
    displayCategoryProducts(filtered);
}

function displayCategoryProducts(products) {
    const container = document.getElementById('categoryProducts');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
                <h4>No products found</h4>
                <p class="text-muted">No products available in this category</p>
                <button onclick="window.showAllCategories()" class="btn btn-primary mt-3">
                    <i class="fas fa-arrow-left me-2"></i>Browse Categories
                </button>
            </div>
        `;
        return;
    }

    let html = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="alert alert-info d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>${products.length}</strong> product${products.length !== 1 ? 's' : ''} found
                    </div>
                    <button onclick="window.showAllCategories()" class="btn btn-sm btn-outline-info">
                        <i class="fas fa-th me-1"></i> All Categories
                    </button>
                </div>
            </div>
        </div>
        <div class="row" id="productsGrid">
    `;

    products.forEach(product => {
        html += createProductCard(product);
    });

    html += '</div>';
    container.innerHTML = html;

    // Attach event listeners to Add to Cart buttons
    attachCartEventListeners();
}

function showAllCategories() {
    const container = document.getElementById('categoryProducts');
    const categoryList = document.getElementById('categoryList');

    if (container && categoryList) {
        container.style.display = 'none';
        categoryList.style.display = 'block';

        // Reset title
        const titleElement = document.getElementById('categoryTitle');
        if (titleElement) {
            titleElement.innerHTML = '<h2 class="mb-0">Shop by Category</h2>';
        }

        // Remove category from URL
        const url = new URL(window.location);
        url.searchParams.delete('category');
        window.history.replaceState({}, '', url);
    }
}

// ===============================
// CART FUNCTIONS
// ===============================

function attachCartEventListeners() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        // Remove existing listeners to prevent duplicates
        button.removeEventListener('click', handleAddToCart);
        button.addEventListener('click', handleAddToCart);
    });
}

function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const productId = parseInt(button.dataset.id);
    const product = {
        id: productId,
        title: button.dataset.title,
        price: parseFloat(button.dataset.price),
        image: button.dataset.image,
        quantity: 1
    };

    // Visual feedback
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;

    // Add to cart using global function
    if (typeof window.addToCart === 'function') {
        setTimeout(() => {
            const result = window.addToCart(product, 1);
            if (result) {
                button.innerHTML = '<i class="fas fa-check"></i> Added!';
                // Dispatch custom event for cart updates
                window.dispatchEvent(new CustomEvent('cartUpdated'));
                // Update cart count if function exists
                if (typeof window.updateCartCount === 'function') {
                    window.updateCartCount();
                }
                setTimeout(() => {
                    button.innerHTML = originalHtml;
                    button.disabled = false;
                }, 2000);
            } else {
                button.innerHTML = originalHtml;
                button.disabled = false;
            }
        }, 300);
    } else {
        // Fallback
        console.log('Add to cart:', product);
        button.innerHTML = '<i class="fas fa-check"></i> Added!';
        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.disabled = false;
        }, 2000);

        // Show notification
        showNotification(`${product.title} added to cart!`, 'success');
    }
}

// ===============================
// LOAD CATEGORIES
// ===============================

async function loadAllCategories() {
    const container = document.getElementById('categoryList');
    if (!container) return;

    showLoading(container, 'Loading categories...');

    try {
        console.log('Fetching categories from:', CATEGORY_API);
        const response = await fetch(CATEGORY_API);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let categoryList = await response.json();

        // Process categories
        if (!Array.isArray(categoryList)) {
            if (categoryList.categories && Array.isArray(categoryList.categories)) {
                categoryList = categoryList.categories;
            } else if (typeof categoryList === 'object') {
                categoryList = Object.values(categoryList).filter(v => v && typeof v === 'string');
            } else {
                categoryList = FALLBACK_CATEGORIES;
            }
        }

        categories = categoryList.filter(Boolean);

        if (categories.length === 0) {
            categories = FALLBACK_CATEGORIES;
        }

        // Render categories
        container.innerHTML = '';
        let html = '<div class="row">';

        categories.forEach(category => {
            if (category) {
                html += createCategoryCard(category);
            }
        });

        html += '</div>';
        container.innerHTML = html;

        console.log(`[Categories] Loaded ${categories.length} categories`);

    } catch (error) {
        console.error('[Categories] Error loading categories:', error);

        // Use fallback categories
        categories = FALLBACK_CATEGORIES;
        container.innerHTML = '<div class="row">' +
            categories.map(category => createCategoryCard(category)).join('') +
            '</div>';

        console.log(`[Categories] Loaded ${categories.length} fallback categories`);
    }
}



// ===============================
// INITIALIZATION
// ===============================

async function initializeCategoriesPage() {
    console.log('Initializing categories page');

    // Load products first
    await loadCategoryProducts();

    // Check for category parameter in URL
    const categoryParam = getQueryParam('category');

    if (categoryParam) {
        // Decode the category
        const category = decodeURIComponent(categoryParam);
        await filterByCategory(category);
    } else {
        // Show all categories
        await loadAllCategories();
    }
}

function initializeHomePageCategories() {
    console.log('Initializing home page categories');
    loadAllCategories();
}

// ===============================
// PAGE INITIALIZATION
// ===============================

function initializePage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    console.log('Categories.js: Initializing page:', page);

    // Update auth button and cart count
    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
    }
    if (typeof window.updateAuthButton === 'function') {
        window.updateAuthButton();
    }

    if (page === 'index.html' || path === '/' || path === '' || path.endsWith('/')) {
        initializeHomePageCategories();
    } else if (page === 'categories.html') {
        initializeCategoriesPage();
    }
}

// ===============================
// EXPORT FUNCTIONS TO WINDOW
// ===============================

window.filterByCategory = filterByCategory;
window.showAllCategories = showAllCategories;
window.loadAllCategories = loadAllCategories;
window.formatCategoryName = formatCategoryName;
window.initializeCategoriesPage = initializeCategoriesPage;
window.formatPrice = formatPrice; // Export the fixed version

// ===============================
// ADD CSS STYLES
// ===============================

if (!document.getElementById('category-styles')) {
    const style = document.createElement('style');
    style.id = 'category-styles';
    style.textContent = `
        .category-card, .product-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .category-card:hover, .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        
        .category-image-wrapper {
            overflow: hidden;
            border-radius: 8px 8px 0 0;
        }
        
        .category-image-wrapper img {
            transition: transform 0.5s ease;
        }
        
        .category-image-wrapper:hover img {
            transform: scale(1.1);
        }
        
        .add-to-cart-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .product-card {
            animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        #categoryProducts {
            animation: fadeIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}

// ===============================
// DOM READY
// ===============================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
