// categories.js - Category Management Module
// ===============================
// Category Management Module
// ===============================

// Ensure API_BASE_URL is declared globally (from products.js)
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://dummyjson.com';
}

const CATEGORY_API = `${API_BASE_URL}/products/categories`;
const CATEGORY_PRODUCT_API = (category) => `${API_BASE_URL}/products/category/${encodeURIComponent(category)}`;

// CATEGORY IMAGES - Map each category to a relevant image (FIXED URLs)
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

// Get image URL for a category
function getCategoryImage(category) {
    if (!category) return CATEGORY_IMAGES.default;

    let categoryName = '';

    if (typeof category === 'object' && category !== null) {
        categoryName = category.name || category.slug || '';
    } else if (typeof category === 'string') {
        categoryName = category;
    }

    // Handle common variations
    const key = categoryName.toLowerCase().trim();

    // Map variations to standardized keys
    const categoryMap = {
        'jewelry': 'jewelery',
        'mens clothing': "men's clothing",
        'womens clothing': "women's clothing",
        'mens-fashion': "men's clothing",
        'womens-fashion': "women's clothing"
    };

    const normalizedKey = categoryMap[key] || key;
    return CATEGORY_IMAGES[normalizedKey] || CATEGORY_IMAGES.default;
}

// Format category name properly
function formatCategoryName(category) {
    if (!category) return 'Unknown';

    let categoryName = '';

    if (typeof category === 'object' && category !== null) {
        categoryName = category.name || category.slug || 'Unknown';
    } else if (typeof category === 'string') {
        categoryName = category;
    } else {
        return 'Unknown';
    }

    // Convert kebab-case to readable text
    categoryName = categoryName
        .replace(/-/g, ' ')
        .replace(/'s/g, "'s")
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return categoryName;
}

// Generate star rating HTML
function generateStarRating(rating) {
    if (typeof rating !== 'number' || rating < 0) rating = 0;
    if (rating > 5) rating = 5;

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star text-warning"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt text-warning"></i>';
    }

    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star text-muted"></i>';
    }

    return stars;
}

// Format price with dollar sign
function formatPrice(price) {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }
    return `$${price.toFixed(2)}`;
}

// Create category card with proper image handling
function createCategoryCard(category) {
    const categoryName = formatCategoryName(category);
    const categoryImage = getCategoryImage(category);
    const categorySlug = typeof category === 'object' ? (category.slug || category.name) : category;

    // Use a simple placeholder if main image fails
    const placeholderUrl = `https://via.placeholder.com/300x200/6c757d/ffffff?text=${encodeURIComponent(categoryName.substring(0, 15))}`;

    return `
        <div class="card category-card h-100 shadow-sm border-0 hover-effect">
            <div class="category-image-wrapper overflow-hidden" style="height: 200px; background-color: #f8f9fa;">
                <img src="${categoryImage}" 
                     class="card-img-top w-100 h-100" 
                     style="object-fit: cover; transition: transform 0.3s ease;"
                     alt="${categoryName}"
                     onerror="this.onerror=null; this.src='${placeholderUrl}'; this.style.objectFit='contain'; this.style.padding='20px';">
            </div>
            <div class="card-body d-flex flex-column text-center p-3">
                <h5 class="card-title mb-3 fw-bold">${categoryName}</h5>
                <a href="categories.html?category=${encodeURIComponent(categorySlug)}" 
                   class="btn btn-primary mt-auto px-4">
                    Shop Now <i class="fas fa-arrow-right ms-2"></i>
                </a>
            </div>
        </div>
    `;
}

// Create product card for categories page
function createProductCardForCategory(product) {
    if (!product || typeof product !== 'object') {
        console.error('Invalid product:', product);
        return '<div class="col"><p>Invalid product data</p></div>';
    }

    const description = product.description ?
        product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '') :
        'No description available';

    // Use product thumbnail or category image, with proper fallback
    let imageUrl = product.thumbnail || product.image;
    if (!imageUrl || imageUrl === 'undefined') {
        // Use category-specific image
        imageUrl = getCategoryImage(product.category) || 'https://via.placeholder.com/300x200/6c757d/ffffff?text=Product';
    }

    const placeholderUrl = `https://via.placeholder.com/300x200/e9ecef/666666?text=${encodeURIComponent((product.title || 'Product').substring(0, 20))}`;
    const rating = typeof product.rating === 'number' ? product.rating : 0;
    const stars = generateStarRating(rating);
    const stock = product.stock || product.quantity || 5;

    return `
        <div class="card product-card h-100 shadow-sm border-0 hover-effect">
            <div class="position-relative" style="height: 200px; overflow: hidden; background-color: #f8f9fa;">
                <img src="${imageUrl}" 
                     class="card-img-top w-100 h-100" 
                     alt="${product.title || 'Product'}"
                     style="object-fit: cover; transition: transform 0.3s ease;"
                     loading="lazy"
                     onerror="this.src='${placeholderUrl}'; this.style.objectFit='contain'; this.style.padding='10px';">
                <div class="position-absolute top-0 end-0 p-2">
                    <span class="badge ${stock > 0 ? 'bg-success' : 'bg-danger'} rounded-pill">
                        ${stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>
            </div>
            <div class="card-body d-flex flex-column p-3">
                <h6 class="card-title fw-bold mb-2" title="${product.title || 'Product'}">${product.title || 'Untitled Product'}</h6>
                <p class="card-text text-muted small flex-grow-1 mb-2">${description}</p>
                <div class="mb-2">
                    <small class="text-warning">${stars}</small>
                    <small class="text-muted ms-1">(${rating.toFixed(1)})</small>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                    <span class="text-primary fw-bold fs-5">${formatPrice(product.price || 0)}</span>
                    <button class="btn btn-sm btn-primary add-to-cart" data-id="${product.id || ''}" data-title="${product.title || ''}" title="Add to cart">
                        <i class="fas fa-cart-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Add CSS for hover effects
function addCategoryStyles() {
    if (!document.getElementById('category-styles')) {
        const style = document.createElement('style');
        style.id = 'category-styles';
        style.textContent = `
            .hover-effect:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                transition: all 0.3s ease;
            }
            .category-card, .product-card {
                transition: all 0.3s ease;
            }
            .category-image-wrapper img:hover {
                transform: scale(1.05);
            }
            .card-title {
                color: #333;
                min-height: 3rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Load featured categories for home page
async function loadFeaturedCategories() {
    const container = document.getElementById('categoryList');
    if (!container) {
        console.log('Category list container not found');
        return;
    }

    // Add styles for category cards
    addCategoryStyles();

    showLoading(container, 'Loading categories...');

    try {
        console.log('Fetching categories from:', CATEGORY_API);
        const response = await fetch(CATEGORY_API);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const categories = await response.json();
        console.log('Categories response:', categories);

        // Check if categories is an array
        if (!Array.isArray(categories)) {
            console.error('Categories is not an array:', categories);

            // Try to handle different response formats
            if (categories && typeof categories === 'object') {
                // Maybe it's an object with categories property
                if (Array.isArray(categories.categories)) {
                    categories = categories.categories;
                } else {
                    // Try to convert object keys to array
                    categories = Object.values(categories);
                }
            }

            // If still not an array, use fallback categories
            if (!Array.isArray(categories)) {
                console.log('Using fallback categories');
                categories = ["electronics", "jewelery", "men's clothing", "women's clothing", "fragrances", "groceries", "furniture", "beauty"];
            }
        }

        container.innerHTML = '';

        // Display top 8 categories
        const featuredCategories = categories.slice(0, 8);

        if (featuredCategories.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h4>No categories found</h4>
                    <p class="text-muted">Categories will appear here soon</p>
                </div>
            `;
            return;
        }

        console.log('Displaying featured categories:', featuredCategories);

        featuredCategories.forEach((category, index) => {
            const col = document.createElement('div');
            col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
            col.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s both`;
            col.innerHTML = createCategoryCard(category);
            container.appendChild(col);
        });

        console.log(`Loaded ${featuredCategories.length} categories`);
    } catch (error) {
        console.error('Error loading categories:', error);

        // Use fallback categories on error
        const fallbackCategories = [
            "electronics", "jewelery", "men's clothing", "women's clothing",
            "fragrances", "groceries", "furniture", "beauty"
        ];

        container.innerHTML = '';

        fallbackCategories.forEach((category, index) => {
            const col = document.createElement('div');
            col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
            col.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s both`;
            col.innerHTML = createCategoryCard(category);
            container.appendChild(col);
        });

        console.log(`Loaded ${fallbackCategories.length} fallback categories`);
    }
}

// Load all categories for categories page
async function loadAllCategoryCards() {
    const container = document.getElementById('categoryList');
    if (!container) {
        console.log('Category list container not found');
        return;
    }

    // Add styles for category cards
    addCategoryStyles();

    showLoading(container, 'Loading categories...');

    try {
        console.log('Fetching all categories from:', CATEGORY_API);
        const response = await fetch(CATEGORY_API);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let categories = await response.json();
        console.log('All categories response:', categories);

        // Check if categories is an array
        if (!Array.isArray(categories)) {
            console.warn('Categories is not an array, attempting to fix...');

            if (categories && typeof categories === 'object') {
                // Check for nested array
                if (Array.isArray(categories.categories)) {
                    categories = categories.categories;
                } else if (Array.isArray(categories.data)) {
                    categories = categories.data;
                } else {
                    // Convert object to array of category names
                    categories = Object.keys(categories).map(key => {
                        const value = categories[key];
                        return typeof value === 'string' ? value : key;
                    });
                }
            }

            // Fallback if still not an array
            if (!Array.isArray(categories)) {
                categories = ["electronics", "jewelery", "men's clothing", "women's clothing",
                    "fragrances", "groceries", "furniture", "beauty", "sports",
                    "automotive", "lighting", "skincare"];
            }
        }

        container.innerHTML = '';

        if (categories.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h4>No categories available</h4>
                    <p class="text-muted">Check back later for new categories</p>
                </div>
            `;
            return;
        }

        console.log('Displaying all categories:', categories);

        categories.forEach((category, index) => {
            const col = document.createElement('div');
            col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
            col.style.animation = `fadeIn 0.5s ease-out ${index * 0.05}s both`;
            col.innerHTML = createCategoryCard(category);
            container.appendChild(col);
        });

        console.log(`Loaded ${categories.length} categories`);
    } catch (error) {
        console.error('Error loading categories:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4>Failed to load categories</h4>
                <p class="text-muted">Please try again later</p>
                <button onclick="loadAllCategoryCards()" class="btn btn-primary mt-3">
                    <i class="fas fa-redo me-2"></i>Retry
                </button>
            </div>
        `;
    }
}

// Load products for a specific category
async function loadCategoryProducts(category) {
    console.log('Loading products for category:', category);

    const categoryName = formatCategoryName(category);
    const titleElement = document.getElementById('categoryTitle');
    if (titleElement) {
        titleElement.textContent = categoryName;
        // Add a back button
        titleElement.innerHTML = `
            <div class="d-flex align-items-center">
                <button onclick="window.history.back()" class="btn btn-outline-secondary me-3">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <span>${categoryName}</span>
            </div>
        `;
    }

    const container = document.getElementById('categoryProducts');
    if (!container) {
        console.log('categoryProducts container not found');
        return;
    }

    // Hide the category list
    const categoryList = document.getElementById('categoryList');
    if (categoryList) {
        categoryList.style.display = 'none';
    }

    showLoading(container, `Loading ${categoryName} products...`);

    try {
        console.log('Fetching category products from:', CATEGORY_PRODUCT_API(category));
        const response = await fetch(CATEGORY_PRODUCT_API(category));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const products = data.products || [];

        displayCategoryProductsGrid(products);
    } catch (error) {
        console.error('Error loading category products:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4>Failed to load products</h4>
                <p class="text-muted">Please try again later</p>
                <a href="categories.html" class="btn btn-primary mt-3">
                    <i class="fas fa-arrow-left me-2"></i>Back to Categories
                </a>
            </div>
        `;
    }
}

// Display products in grid
function displayCategoryProductsGrid(products) {
    const container = document.getElementById('categoryProducts');
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h4>No products found</h4>
                <p class="text-muted">This category currently has no products</p>
                <a href="categories.html" class="btn btn-primary mt-3">
                    <i class="fas fa-arrow-left me-2"></i>Browse Categories
                </a>
            </div>
        `;
        return;
    }

    const row = document.createElement('div');
    row.className = 'row';

    products.forEach((product, index) => {
        if (!product || typeof product !== 'object') {
            console.warn('Skipping invalid product at index', index, product);
            return;
        }

        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
        col.style.animation = `fadeIn 0.5s ease-out ${index * 0.05}s both`;
        col.innerHTML = createProductCardForCategory(product);
        row.appendChild(col);
    });

    container.appendChild(row);

    // Update the results count
    const resultsCount = document.createElement('div');
    resultsCount.className = 'row mb-4';
    resultsCount.innerHTML = `
        <div class="col-12">
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Found ${products.length} product${products.length !== 1 ? 's' : ''} in this category
            </div>
        </div>
    `;
    container.insertBefore(resultsCount, row);

    // Attach event listeners to add-to-cart buttons with proper product reference
    row.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const productId = parseInt(this.dataset.id);
            const product = products.find(p => p.id === productId);

            if (product) {
                console.log('[v0] Adding product from category:', product);

                // Add to cart - assuming this function exists globally
                if (typeof window.addToCart === 'function') {
                    window.addToCart(product);
                } else {
                    console.warn('addToCart function not found. Using fallback.');
                    // Fallback: store in localStorage
                    const cart = JSON.parse(localStorage.getItem('cart')) || [];
                    const existingItem = cart.find(item => item.id === product.id);

                    if (existingItem) {
                        existingItem.quantity = (existingItem.quantity || 1) + 1;
                    } else {
                        cart.push({
                            ...product,
                            quantity: 1
                        });
                    }

                    localStorage.setItem('cart', JSON.stringify(cart));
                }

                // Wait a brief moment for addToCart to save, then update cart count
                setTimeout(() => {
                    const cart = JSON.parse(localStorage.getItem('cart')) || [];
                    const cartCountElement = document.getElementById('cartCount');
                    if (cartCountElement) {
                        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                        cartCountElement.textContent = totalItems;
                        console.log('[v0] Cart count updated to:', totalItems);
                    }
                }, 50);

                // Add visual feedback
                const originalHtml = this.innerHTML;
                const originalClass = this.className;
                this.innerHTML = '<i class="fas fa-check me-1"></i>Added!';
                this.className = 'btn btn-sm btn-success add-to-cart';
                this.disabled = true;

                setTimeout(() => {
                    this.innerHTML = originalHtml;
                    this.className = originalClass;
                    this.disabled = false;
                }, 2000);
            }
        });
    });
}

// Helper function for loading state
function showLoading(container, message = 'Loading...') {
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h4>${message}</h4>
        </div>
    `;
}

// Initialize categories page
async function initCategoriesPage() {
    const category = getQueryParam('category');

    if (category) {
        await loadCategoryProducts(category);
    } else {
        await loadAllCategoryCards();
    }
}

// Initialize page based on URL
function initializeCategories() {
    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/' || path === '' || path.endsWith('/')) {
        console.log('Initializing home page categories');
        loadFeaturedCategories();
    } else if (path.includes('categories.html')) {
        console.log('Initializing categories page');
        initCategoriesPage();
    }
}

// Helper function to get URL query parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded - initializing categories module');

    // Wait a bit to ensure other scripts are loaded
    setTimeout(() => {
        if (typeof API_BASE_URL !== 'undefined') {
            initializeCategories();
        } else {
            console.warn('API_BASE_URL not found, retrying...');
            // Check again after 500ms
            setTimeout(() => {
                if (typeof API_BASE_URL !== 'undefined') {
                    initializeCategories();
                } else {
                    console.error('API_BASE_URL is still not defined');
                    // Show error message
                    const container = document.getElementById('categoryList') || document.getElementById('categoryProducts');
                    if (container) {
                        container.innerHTML = `
                            <div class="col-12 text-center py-5">
                                <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                                <h4>Configuration Error</h4>
                                <p class="text-muted">Please refresh the page or contact support</p>
                                <button onclick="window.location.reload()" class="btn btn-primary mt-3">
                                    <i class="fas fa-redo me-2"></i>Refresh Page
                                </button>
                            </div>
                        `;
                    }
                }
            }, 500);
        }
    }, 100);
});

// Make functions globally available
window.loadFeaturedCategories = loadFeaturedCategories;
window.loadAllCategoryCards = loadAllCategoryCards;
window.loadCategoryProducts = loadCategoryProducts;
window.formatCategoryName = formatCategoryName;

// Fallback categories in case API fails
const FALLBACK_CATEGORIES = [
    "electronics", "jewelery", "men's clothing", "women's clothing",
    "fragrances", "groceries", "furniture", "beauty", "sports",
    "automotive", "lighting", "skincare"
];

// Export functions for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadFeaturedCategories,
        loadAllCategoryCards,
        loadCategoryProducts,
        getCategoryImage,
        formatCategoryName,
        generateStarRating,
        formatPrice,
        FALLBACK_CATEGORIES
    };
}