// ========================================
// SEARCH MODULE - WITH 10,000 PRODUCTS
// ========================================

const API_BASE_URL = 'https://dummyjson.com';
let allProducts = [];
let searchResults = [];
let searchPageInitialized = false;
let isLoadingProducts = false;

// Wait for DOM and dependencies
document.addEventListener('DOMContentLoaded', () => {
    if (searchPageInitialized) {
        console.log('[Search] Already initialized, skipping...');
        return;
    }

    // Wait a bit for other scripts to load
    setTimeout(() => {
        initializeSearch();
    }, 300);
});

function initializeSearch() {
    if (searchPageInitialized) return;
    searchPageInitialized = true;

    console.log('[Search] Initializing search page');

    // Update cart count if function exists
    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
    }

    // Update wishlist count if function exists
    if (typeof window.updateWishlistCount === 'function') {
        window.updateWishlistCount();
    }

    // Update auth button if function exists
    if (typeof window.updateAuthButton === 'function') {
        window.updateAuthButton();
    }

    // Setup search form
    setupSearchForm();

    // Always load fresh products (ignore existing ones to ensure we get 10,000)
    console.log('[Search] Loading 10,000 products from API...');
    loadAllProducts().then(() => {
        checkUrlForSearch();
    });

    // Listen for cart updates
    window.addEventListener('cartUpdated', () => {
        if (typeof window.updateCartCount === 'function') {
            window.updateCartCount();
        }
    });

    // Listen for wishlist updates
    window.addEventListener('wishlistUpdated', () => {
        if (typeof window.updateWishlistCount === 'function') {
            window.updateWishlistCount();
        }
    });
}

// Check URL for search query
function checkUrlForSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');

    if (searchQuery) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchQuery;
            // Small delay to ensure everything is ready
            setTimeout(() => {
                performSearch();
            }, 100);
        }
    } else {
        displayEmptySearch();
    }
}

// Setup search form listener
function setupSearchForm() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        // Remove existing listeners to prevent duplicates
        const newSearchForm = searchForm.cloneNode(true);
        searchForm.parentNode.replaceChild(newSearchForm, searchForm);

        newSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch();
        });
    }

    // Real-time search as user types
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Remove existing listeners
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);

        let searchTimeout;
        newSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (newSearchInput.value.trim().length > 0) {
                    performSearch();
                } else {
                    displayEmptySearch();
                }
            }, 300);
        });
    }
}

// Load all products from API - MODIFIED TO GET 10,000 PRODUCTS
async function loadAllProducts() {
    // Prevent multiple simultaneous loading attempts
    if (isLoadingProducts) {
        console.log('[Search] Already loading products, skipping...');
        return allProducts;
    }

    isLoadingProducts = true;

    // Show loading state
    const searchResultsContainer = document.getElementById('searchResults');
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h4>Loading 10,000 products...</h4>
                <p class="text-muted">Please wait while we load the product catalog</p>
                <div class="progress mt-3" style="height: 20px; max-width: 500px; margin: 0 auto;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         id="loadingProgress" 
                         style="width: 0%"></div>
                </div>
                <p class="text-muted mt-2" id="loadingStatus">Loading products...</p>
            </div>
        `;
    }

    try {
        console.log('[Search] Loading 10,000 products from API...');

        // DummyJSON supports limit parameter - set to maximum (usually 100 is default, but we can request more)
        // Note: DummyJSON free tier might have limits, but we'll request as many as possible
        const response = await fetch(`${API_BASE_URL}/products?limit=10000`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allProducts = data.products || [];

        // Update progress
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingStatus = document.getElementById('loadingStatus');
        if (loadingProgress) {
            loadingProgress.style.width = '100%';
        }
        if (loadingStatus) {
            loadingStatus.textContent = `Loaded ${allProducts.length} products successfully!`;
        }

        console.log(`[Search] Loaded ${allProducts.length} products from API`);

        // If we got less than expected, try to get more by pagination
        if (allProducts.length < 10000 && allProducts.length > 0) {
            console.log(`[Search] Only got ${allProducts.length} products, trying pagination...`);
            allProducts = await loadAllProductsWithPagination();
        }

        // Store globally
        window.allProducts = allProducts;
        window.searchLoadedProducts = allProducts;

        // Also update products.js global if it exists
        if (window.productsAllProducts) {
            window.productsAllProducts = allProducts;
        }

        isLoadingProducts = false;
        return allProducts;

    } catch (error) {
        console.error('[Search] Error loading products:', error);

        // Try pagination approach as fallback
        console.log('[Search] Trying pagination to get more products...');
        allProducts = await loadAllProductsWithPagination();

        if (allProducts.length === 0) {
            // Use mock data as last resort with 100 products
            console.log('[Search] Using mock data as fallback');
            allProducts = getMockProducts(100); // Generate 100 mock products
        }

        window.allProducts = allProducts;
        window.searchLoadedProducts = allProducts;

        if (window.productsAllProducts) {
            window.productsAllProducts = allProducts;
        }

        // Update progress
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingStatus = document.getElementById('loadingStatus');
        if (loadingProgress) {
            loadingProgress.style.width = '100%';
        }
        if (loadingStatus) {
            loadingStatus.textContent = `Loaded ${allProducts.length} products (fallback mode)`;
        }

        isLoadingProducts = false;
        return allProducts;
    }
}

// New function to load products with pagination
async function loadAllProductsWithPagination() {
    let allFetchedProducts = [];
    let skip = 0;
    const limit = 100; // DummyJSON default limit per page
    let total = 0;
    let page = 1;

    try {
        // First request to get total count
        const firstResponse = await fetch(`${API_BASE_URL}/products?limit=1`);
        const firstData = await firstResponse.json();
        total = firstData.total || 100; // Fallback to 100 if total not available

        console.log(`[Search] Total products available: ${total}`);

        const totalPages = Math.ceil(Math.min(total, 10000) / limit);

        // Update loading message
        const loadingStatus = document.getElementById('loadingStatus');

        // Fetch all pages
        while (skip < Math.min(total, 10000)) {
            if (loadingStatus) {
                loadingStatus.textContent = `Loading page ${page} of ${totalPages}... (${skip} products loaded)`;
            }

            const response = await fetch(`${API_BASE_URL}/products?limit=${limit}&skip=${skip}`);
            if (!response.ok) break;

            const data = await response.json();
            const products = data.products || [];

            allFetchedProducts = [...allFetchedProducts, ...products];

            // Update progress
            const loadingProgress = document.getElementById('loadingProgress');
            if (loadingProgress) {
                const progress = (allFetchedProducts.length / Math.min(total, 10000)) * 100;
                loadingProgress.style.width = `${progress}%`;
            }

            skip += limit;
            page++;

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`[Search] Loaded ${allFetchedProducts.length} products via pagination`);
        return allFetchedProducts;

    } catch (error) {
        console.error('[Search] Pagination error:', error);
        return allFetchedProducts;
    }
}

// Get mock products for fallback - enhanced to generate more products
function getMockProducts(count = 100) {
    const categories = ['smartphones', 'laptops', 'audio', 'footwear', 'clothing', 'accessories', 'home', 'beauty'];
    const brands = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'LG', 'Dell', 'HP', 'Lenovo', 'Google'];
    const products = [];

    for (let i = 1; i <= count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const price = Math.floor(Math.random() * 1000) + 50;
        const rating = (Math.random() * 2) + 3; // 3-5 stars

        products.push({
            id: i,
            title: `${brand} Product ${i}`,
            description: `This is a high-quality ${category} product from ${brand}. Perfect for your daily needs.`,
            price: price,
            discountPercentage: Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 5 : 0,
            rating: parseFloat(rating.toFixed(1)),
            stock: Math.floor(Math.random() * 100) + 10,
            brand: brand,
            category: category,
            thumbnail: `https://via.placeholder.com/300?text=Product+${i}`,
            images: [`https://via.placeholder.com/500?text=Product+${i}`]
        });
    }

    return products;
}

// Perform search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    console.log('[Search] Searching for:', searchTerm);

    if (!searchTerm) {
        displayEmptySearch();
        return;
    }

    // Update URL without reloading
    const url = new URL(window.location);
    url.searchParams.set('q', searchTerm);
    window.history.pushState({}, '', url);

    // Ensure we have products
    if (!allProducts || allProducts.length === 0) {
        // Show loading and load products
        const searchResultsContainer = document.getElementById('searchResults');
        if (searchResultsContainer) {
            searchResultsContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h4>Loading products...</h4>
                    <p class="text-muted">Please wait while we search through 10,000 products</p>
                </div>
            `;
        }

        loadAllProducts().then(() => {
            performSearchNow(searchTerm);
        });
        return;
    }

    performSearchNow(searchTerm);
}

// Actual search function - optimized for large dataset
function performSearchNow(searchTerm) {
    const products = Array.isArray(allProducts) ? allProducts : [];

    console.log(`[Search] Searching in ${products.length} products`);

    // Show searching indicator
    const searchResultsContainer = document.getElementById('searchResults');
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Searching...</span>
                </div>
                <h4>Searching ${products.length} products...</h4>
            </div>
        `;
    }

    // Use setTimeout to prevent UI freezing with large dataset
    setTimeout(() => {
        // Search in products (optimized)
        searchResults = products.filter(product => {
            if (!product) return false;

            const title = product.title ? product.title.toLowerCase() : '';
            const description = product.description ? product.description.toLowerCase() : '';
            const category = product.category ? product.category.toLowerCase() : '';

            return (
                title.includes(searchTerm) ||
                description.includes(searchTerm) ||
                category.includes(searchTerm)
            );
        });

        console.log(`[Search] Found ${searchResults.length} results`);

        // Update page title
        const searchTitle = document.getElementById('searchTitle');
        if (searchTitle) {
            searchTitle.textContent = `Search Results for "${searchTerm}"`;
        }

        // Update query display
        const searchQuery = document.getElementById('searchQuery');
        if (searchQuery) {
            searchQuery.textContent = `Found ${searchResults.length} product${searchResults.length !== 1 ? 's' : ''} out of ${products.length} products`;
        }

        // Display results
        displaySearchResults(searchResults);
    }, 100);
}

// Display search results (rest of the functions remain the same)
function displaySearchResults(results) {
    const searchResultsContainer = document.getElementById('searchResults');
    if (!searchResultsContainer) {
        console.error('[Search] Results container not found');
        return;
    }

    const safeResults = results || [];
    console.log('[Search] Displaying', safeResults.length, 'results');

    if (safeResults.length === 0) {
        searchResultsContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>No products found</h4>
                <p class="text-muted">Try searching with different keywords</p>
                <div class="mt-4">
                    <h6 class="mb-3">Suggestions:</h6>
                    <div class="d-flex justify-content-center gap-2 flex-wrap">
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('laptop')">laptop</span>
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('phone')">phone</span>
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('headphones')">headphones</span>
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('shoes')">shoes</span>
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('watch')">watch</span>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    let html = '<div class="row g-4">';

    safeResults.forEach(product => {
        const price = product.price || 0;
        const rating = product.rating || 0;
        const image = product.thumbnail || product.image || 'https://via.placeholder.com/300';
        const title = product.title || 'Product';
        const category = product.category || 'General';
        const description = product.description ?
            (product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description)
            : 'No description available';
        const discountPercentage = product.discountPercentage || 0;

        // Calculate original price if discount exists
        let originalPrice = null;
        if (discountPercentage > 0) {
            originalPrice = price / (1 - discountPercentage / 100);
        }

        html += `
            <div class="col-xl-3 col-lg-3 col-md-4 col-sm-6 col-xs-6 mb-4">
                <div class="card product-card h-100 border-0 shadow-sm">
                    <div class="position-relative product-image-container">
                        <img src="${image}" 
                             class="card-img-top product-img" 
                             alt="${title}"
                             style="height: 200px; object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/300'">
                        ${discountPercentage > 0 ? `
                            <span class="badge bg-danger position-absolute top-0 start-0 m-2">
                                -${Math.round(discountPercentage)}%
                            </span>
                        ` : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title fw-bold" title="${title}">${title}</h6>
                        <p class="card-text text-muted small flex-grow-1">${description}</p>
                        <div class="d-flex align-items-center mb-2">
                            <div class="text-warning small">
                                ${generateStarRating(rating)}
                            </div>
                            <small class="text-muted ms-1">(${rating.toFixed(1)})</small>
                        </div>
                        <div class="d-flex align-items-center gap-2 mt-auto mb-3 flex-wrap">
                            ${discountPercentage > 0 ? `
                                <span class="text-muted product-old-price">
                                    $${originalPrice.toFixed(2)}
                                </span>
                                <span class="text-primary fw-bold">$${price.toFixed(2)}</span>
                            ` : `
                                <span class="text-primary fw-bold">$${price.toFixed(2)}</span>
                            `}
                        </div>
                        <div class="d-flex gap-2 mt-2">
                            <button class="btn btn-sm btn-primary add-to-cart-btn flex-grow-1" 
                                    data-id="${product.id}"
                                    data-title="${title}"
                                    data-price="${price}"
                                    data-image="${image}">
                                <i class="fas fa-shopping-cart me-1"></i>Cart
                            </button>
                            <button class="btn btn-sm btn-outline-danger add-to-wishlist-btn flex-grow-1" 
                                    data-id="${product.id}"
                                    data-title="${title}"
                                    data-price="${price}"
                                    data-image="${image}"
                                    data-description="${product.description || ''}"
                                    data-rating="${rating}"
                                    data-discount="${discountPercentage}"
                                    data-category="${category}">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <a href="product-details.html?id=${product.id}" class="btn btn-outline-primary btn-sm w-100">
                            <i class="fas fa-eye me-1"></i>View Details
                        </a>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    searchResultsContainer.innerHTML = html;

    // Attach event listeners
    attachEventListeners();
}

// Generate star rating HTML
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

// Attach event listeners
function attachEventListeners() {
    // Cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.removeEventListener('click', handleAddToCart);
        button.addEventListener('click', handleAddToCart);
    });

    // Wishlist buttons
    document.querySelectorAll('.add-to-wishlist-btn').forEach(button => {
        button.removeEventListener('click', handleAddToWishlist);
        button.addEventListener('click', handleAddToWishlist);
    });

    // Update wishlist button states if function exists
    if (typeof window.updateWishlistButtons === 'function') {
        setTimeout(() => {
            window.updateWishlistButtons();
        }, 100);
    }
}

// Handle add to cart
function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const product = {
        id: parseInt(button.dataset.id),
        title: button.dataset.title,
        price: parseFloat(button.dataset.price),
        image: button.dataset.image,
        thumbnail: button.dataset.image
    };

    // Visual feedback
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;

    // Use addToCart from products.js if available
    if (typeof window.addToCart === 'function') {
        const result = window.addToCart(product, 1);
        if (result) {
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.disabled = false;
            }, 2000);
        } else {
            button.innerHTML = originalHtml;
            button.disabled = false;
        }
    } else {
        // Fallback
        console.log('Add to cart:', product);
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.disabled = false;
            }, 2000);
        }, 300);
    }
}

// Handle add to wishlist
function handleAddToWishlist(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const productId = parseInt(button.dataset.id);

    // Check if already in wishlist
    if (typeof window.isInWishlist === 'function' && window.isInWishlist(productId)) {
        // Remove from wishlist
        if (typeof window.removeFromWishlist === 'function') {
            window.removeFromWishlist(productId);
            button.classList.remove('in-wishlist');
            button.innerHTML = '<i class="far fa-heart"></i>';

            // Update wishlist count
            if (typeof window.updateWishlistCount === 'function') {
                window.updateWishlistCount();
            }
        }
    } else {
        // Add to wishlist
        const product = {
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

        if (typeof window.addToWishlist === 'function') {
            window.addToWishlist(product);
            button.classList.add('in-wishlist');
            button.innerHTML = '<i class="fas fa-heart"></i>';

            // Update wishlist count
            if (typeof window.updateWishlistCount === 'function') {
                window.updateWishlistCount();
            }
        }
    }
}

// Display empty search state
function displayEmptySearch() {
    const searchResultsContainer = document.getElementById('searchResults');
    if (searchResultsContainer) {
        const productCount = allProducts.length || 0;
        searchResultsContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>Search ${productCount > 0 ? productCount : '10,000'} products</h4>
                <p class="text-muted">Enter a search term above to find products</p>
                <div class="mt-4">
                    <h6 class="mb-3">Popular searches:</h6>
                    <div class="d-flex justify-content-center gap-2 flex-wrap">
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('laptop')">laptop</span>
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('phone')">phone</span>
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('headphones')">headphones</span>
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('shoes')">shoes</span>
                        <span class="badge bg-light text-dark p-2" onclick="quickSearch('watch')">watch</span>
                    </div>
                </div>
            </div>
        `;
    }

    const searchTitle = document.getElementById('searchTitle');
    if (searchTitle) {
        searchTitle.textContent = 'Search Results';
    }

    const searchQuery = document.getElementById('searchQuery');
    if (searchQuery) {
        searchQuery.textContent = '';
    }
}

// Quick search function
window.quickSearch = function (term) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = term;
        performSearch();
    }
};

// Make functions globally available
window.performSearch = performSearch;
window.displaySearchResults = displaySearchResults;