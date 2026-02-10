// categories.js - Category Management Module - FIXED
// ===============================
// Category Management Module
// ===============================

// Ensure API_BASE_URL is declared globally
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://dummyjson.com';
}

const CATEGORY_API = `${API_BASE_URL}/products/categories`;

// CATEGORY IMAGES
const CATEGORY_IMAGES = {
    electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    jewelery: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    "men's clothing": 'https://images.unsplash.com/photo-1521572163474-68674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    "women's clothing": 'https://images.unsplash.com/photo-1491553895917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    beauty: 'https://images.unsplash.com/photo-1558618666917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    fragrances: 'https://images.unsplash.com/photo-1587318014919-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    groceries: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    automotive: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    lighting: 'https://images.unsplash.com/photo-1558618666917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    skincare: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
};

// Global variables
let categories = [];
let allProducts = [];

// ===============================
// UTILITY FUNCTIONS
// ===============================
function getCategoryImage(category) {
    if (!category) return CATEGORY_IMAGES.default;

    const key = category.toLowerCase().trim();

    // Map variations
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

    return category
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
        </div>
    `;
}

// ===============================
// CATEGORY CARD TEMPLATE
// ===============================
function createCategoryCard(category) {
    const categoryName = formatCategoryName(category);
    const categoryImage = getCategoryImage(category);

    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="card category-card h-100 shadow-sm border-0 hover-effect">
                <div class="category-image-wrapper overflow-hidden" style="height: 200px;">
                    <img src="${categoryImage}" 
                         class="card-img-top w-100 h-100" 
                         style="object-fit: cover;"
                         alt="${categoryName}"
                         onerror="this.src='https://via.placeholder.com/300x200/6c757d/ffffff?text=${encodeURIComponent(categoryName)}'">
                </div>
                <div class="card-body d-flex flex-column text-center p-3">
                    <h5 class="card-title mb-3 fw-bold">${categoryName}</h5>
                    <button class="btn btn-primary mt-auto px-4" onclick="filterByCategory('${category}')">
                        Shop Now <i class="fas fa-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===============================
// MAIN FILTER FUNCTION - FIXED
// ===============================
function filterByCategory(category) {
    console.log('Filtering by category:', category);

    if (!category || category === 'all') {
        // Show all products
        if (typeof window.renderProducts === 'function' && allProducts.length > 0) {
            window.renderProducts(allProducts);
            updateCategoryTitle('All Categories');
        } else {
            // Fallback: load all products
            window.location.href = 'products.html';
        }
        return;
    }

    // Filter products by category
    if (allProducts.length === 0) {
        console.warn('No products loaded yet');
        // Load products first
        loadCategoryProductsFromAPI(category);
        return;
    }

    const filteredProducts = allProducts.filter(product =>
        product.category && product.category.toLowerCase() === category.toLowerCase()
    );

    console.log(`Found ${filteredProducts.length} products in category ${category}`);

    // Update UI
    updateCategoryTitle(formatCategoryName(category));
    showCategoryProducts(filteredProducts);
}

function updateCategoryTitle(title) {
    const titleElement = document.getElementById('categoryTitle');
    if (titleElement) {
        titleElement.innerHTML = `
            <div class="d-flex align-items-center">
                <button onclick="showAllCategories()" class="btn btn-outline-secondary me-3">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h2 class="mb-0">${title}</h2>
            </div>
        `;
    }
}

// ===============================
// PRODUCT DISPLAY FUNCTIONS
// ===============================
function showCategoryProducts(products) {
    const container = document.getElementById('categoryProducts');
    const categoryList = document.getElementById('categoryList');

    if (container && categoryList) {
        // Hide category list, show products
        categoryList.style.display = 'none';
        container.style.display = 'block';
        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4>No products found</h4>
                    <p class="text-muted">No products available in this category</p>
                    <button onclick="showAllCategories()" class="btn btn-primary mt-3">
                        <i class="fas fa-arrow-left me-2"></i>Back to Categories
                    </button>
                </div>
            `;
            return;
        }

        // Show results count
        const resultsHtml = `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="alert alert-info d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-info-circle me-2"></i>
                            Showing ${products.length} product${products.length !== 1 ? 's' : ''}
                        </div>
                        <button onclick="showAllCategories()" class="btn btn-sm btn-outline-info">
                            <i class="fas fa-arrow-left me-1"></i>All Categories
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = resultsHtml;

        // Create products grid
        const row = document.createElement('div');
        row.className = 'row';

        products.forEach((product, index) => {
            const productCard = createProductCard(product, index);
            row.innerHTML += productCard;
        });

        container.appendChild(row);

        // Attach event listeners
        attachProductEventListeners(products);
    }
}

function showAllCategories() {
    const container = document.getElementById('categoryProducts');
    const categoryList = document.getElementById('categoryList');

    if (container && categoryList) {
        // Show category list, hide products
        container.style.display = 'none';
        categoryList.style.display = 'block';

        // Reset title
        const titleElement = document.getElementById('categoryTitle');
        if (titleElement) {
            titleElement.innerHTML = '<h2 class="mb-0">Shop by Category</h2>';
        }

        // Clear URL parameter
        if (window.history && window.history.replaceState) {
            const url = new URL(window.location);
            url.searchParams.delete('category');
            window.history.replaceState({}, '', url);
        }
    }
}

// ===============================
// PRODUCT CARD TEMPLATE
// ===============================
function createProductCard(product, index = 0) {
    if (!product) return '';

    const description = product.description ?
        product.description.substring(0, 80) + (product.description.length > 80 ? '...' : '') :
        'No description available';

    const image = product.thumbnail || product.image || 'https://via.placeholder.com/300';
    const rating = product.rating || 0;
    const stock = product.stock || 5;
    const isInStock = stock > 0;

    // Generate star rating
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star text-warning small"></i>';
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt text-warning small"></i>';
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star text-muted small"></i>';

    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4" style="animation: fadeIn 0.5s ease-out ${index * 0.05}s both;">
            <div class="card product-card h-100 shadow-sm border-0">
                <div class="position-relative">
                    <img src="${image}" 
                         class="card-img-top" 
                         alt="${product.title}"
                         style="height: 200px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/300'">
                    <div class="position-absolute top-0 end-0 m-2">
                        <span class="badge ${isInStock ? 'bg-success' : 'bg-danger'}">
                            ${isInStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title fw-bold mb-2">${product.title}</h6>
                    <p class="card-text text-muted small mb-2 flex-grow-1">${description}</p>
                    <div class="d-flex align-items-center mb-2">
                        <div class="text-warning">${stars}</div>
                        <small class="text-muted ms-1">(${rating.toFixed(1)})</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="text-primary fw-bold fs-5">
                            ${typeof window.formatPrice === 'function' ? window.formatPrice(product.price) : `₹${product.price}`}
                        </span>
                        <button class="btn btn-sm btn-primary add-to-cart-btn" 
                                data-id="${product.id}"
                                ${!isInStock ? 'disabled' : ''}>
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

function attachProductEventListeners(products) {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const productId = parseInt(this.dataset.id);
            const product = products.find(p => p.id === productId);

            if (product) {
                // Use addToCart from products.js or main.js
                if (typeof window.addToCart === 'function') {
                    window.addToCart(product);
                } else {
                    // Fallback
                    console.log('Adding product to cart:', product);
                    alert(`${product.title} added to cart!`);
                }

                // Visual feedback
                const originalHtml = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                this.disabled = true;

                setTimeout(() => {
                    this.innerHTML = originalHtml;
                    this.disabled = false;
                }, 2000);
            }
        });
    });
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

        // Ensure it's an array
        if (!Array.isArray(categoryList)) {
            if (categoryList && typeof categoryList === 'object') {
                if (Array.isArray(categoryList.categories)) {
                    categoryList = categoryList.categories;
                } else {
                    categoryList = Object.values(categoryList);
                }
            }

            if (!Array.isArray(categoryList)) {
                categoryList = FALLBACK_CATEGORIES;
            }
        }

        categories = categoryList;
        container.innerHTML = '';

        if (categories.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h4>No categories available</h4>
                </div>
            `;
            return;
        }

        // Render categories
        categories.forEach((category, index) => {
            container.innerHTML += createCategoryCard(category);
        });

        console.log(`Loaded ${categories.length} categories`);

    } catch (error) {
        console.error('Error loading categories:', error);

        // Use fallback categories
        categories = FALLBACK_CATEGORIES;
        container.innerHTML = '';

        categories.forEach((category, index) => {
            container.innerHTML += createCategoryCard(category);
        });

        console.log(`Loaded ${categories.length} fallback categories`);
    }
}

// Fallback categories
const FALLBACK_CATEGORIES = [
    "electronics", "jewelery", "men's clothing", "women's clothing",
    "fragrances", "groceries", "furniture", "beauty", "sports",
    "automotive", "lighting", "skincare"
];

// ===============================
// LOAD CATEGORY PRODUCTS FROM API (Fallback)
// ===============================
async function loadCategoryProductsFromAPI(category) {
    const container = document.getElementById('categoryProducts');
    if (!container) return;

    showLoading(container, `Loading ${formatCategoryName(category)} products...`);

    try {
        const response = await fetch(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}`);
        if (!response.ok) throw new Error('Failed to load products');

        const data = await response.json();
        const products = data.products || [];

        showCategoryProducts(products);

    } catch (error) {
        console.error('Error loading category products:', error);
        showError(container, 'Failed to load products for this category');
    }
}

// ===============================
// INITIALIZATION
// ===============================
function initializeCategoriesPage() {
    console.log('Initializing categories page');

    // Load all products from products.js if available
    if (typeof window.allProducts !== 'undefined' && Array.isArray(window.allProducts)) {
        allProducts = window.allProducts;
        console.log(`Loaded ${allProducts.length} products from products.js`);
    }

    // Check for category parameter in URL
    const category = getQueryParam('category');

    if (category) {
        // Filter by category from URL
        filterByCategory(category);
    } else {
        // Show all categories
        loadAllCategories();
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

    if (page === 'index.html' || path === '/' || path === '' || path.endsWith('/')) {
        initializeHomePageCategories();
    } else if (page === 'categories.html') {
        initializeCategoriesPage();
    }
}

// ===============================
// EXPORT FUNCTIONS
// ===============================
window.filterByCategory = filterByCategory;
window.showAllCategories = showAllCategories;
window.loadAllCategories = loadAllCategories;
window.formatCategoryName = formatCategoryName;

// ===============================
// CSS STYLES
// ===============================
if (!document.getElementById('category-styles')) {
    const style = document.createElement('style');
    style.id = 'category-styles';
    style.textContent = `
        .category-card, .product-card {
            transition: all 0.3s ease;
        }
        
        .category-card:hover, .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        
        .category-image-wrapper img:hover {
            transform: scale(1.05);
            transition: transform 0.3s ease;
        }
        
        .category-image-wrapper {
            overflow: hidden;
            border-radius: 8px 8px 0 0;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .add-to-cart-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}

// ===============================
// DOM READY
// ===============================
document.addEventListener('DOMContentLoaded', initializePage);