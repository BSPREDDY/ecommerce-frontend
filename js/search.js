// ========================================
// SEARCH MODULE - ENHANCED VERSION
// ========================================

const API_BASE_URL = 'https://dummyjson.com';
let allProducts = [];
let searchResults = [];
let searchPageInitialized = false;

// Initialize search page - prevent multiple initializations
document.addEventListener('DOMContentLoaded', () => {
    if (searchPageInitialized) {
        console.log('[v0] Search page already initialized, skipping...');
        return;
    }
    searchPageInitialized = true;
    
    console.log('[v0] Search page initialized');

    // Update cart count on page load
    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
    }
    
    // Update wishlist count on page load
    if (typeof window.updateWishlistCount === 'function') {
        window.updateWishlistCount();
    }

    // Update auth button
    if (typeof window.updateAuthButton === 'function') {
        window.updateAuthButton();
    }

    loadAllProducts();
    setupSearchForm();

    // Check if there's a search query in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
        document.getElementById('searchInput').value = searchQuery;
        performSearch();
    }

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
});

// Setup search form listener
function setupSearchForm() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch();
        });
    }

    // Real-time search as user types
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (searchInput.value.trim().length > 0) {
                    performSearch();
                }
            }, 300);
        });
    }
}

// Load all products from API
async function loadAllProducts() {
    try {
        console.log('[v0] Loading all products for search...');
        const response = await fetch(`${API_BASE_URL}/products?limit=10000`);
        const data = await response.json();
        allProducts = data.products || [];
        console.log(`[v0] Loaded ${allProducts.length} products`);
    } catch (error) {
        console.error('[v0] Error loading products:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Error loading products. Please try again.', 'danger');
        }
    }
}

// Perform search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    console.log('[v0] Searching for:', searchTerm);

    if (!searchTerm) {
        displayEmptySearch();
        return;
    }

    // Search in products
    searchResults = allProducts.filter(product => {
        const title = product.title ? product.title.toLowerCase() : '';
        const description = product.description ? product.description.toLowerCase() : '';
        const category = product.category ? product.category.toLowerCase() : '';

        return (
            title.includes(searchTerm) ||
            description.includes(searchTerm) ||
            category.includes(searchTerm)
        );
    });

    console.log(`[v0] Found ${searchResults.length} results for "${searchTerm}"`);

    // Update page title
    const searchTitle = document.getElementById('searchTitle');
    if (searchTitle) {
        searchTitle.textContent = `Search Results for "${searchTerm}"`;
    }

    // Update query display
    const searchQuery = document.getElementById('searchQuery');
    if (searchQuery) {
        searchQuery.textContent = `Found ${searchResults.length} product${searchResults.length !== 1 ? 's' : ''} matching your search`;
    }

    // Display results
    displaySearchResults(searchResults);
}

// Display search results
function displaySearchResults(results) {
    const searchResultsContainer = document.getElementById('searchResults');
    if (!searchResultsContainer) return;

    if (results.length === 0) {
        searchResultsContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>No products found</h4>
                <p class="text-muted">Try searching with different keywords</p>
            </div>
        `;
        return;
    }

    let html = '<div class="row">';

    results.forEach(product => {
        const price = product.price || 0;
        const rating = product.rating || 0;
        const image = product.thumbnail || product.images?.[0] || 'https://via.placeholder.com/200';

        html += `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card h-100">
                    <div class="position-relative product-image-container" style="overflow: hidden; background: #f8f9fa;">
                        <img src="${image}" class="card-img-top product-img" alt="${product.title}" style="height: 250px; object-fit: cover; width: 100%;"
                             onerror="this.src='https://via.placeholder.com/200'">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title product-title fw-bold mb-2" title="${product.title}">${product.title}</h5>
                        <p class="text-muted small mb-2">${product.category || 'General'}</p>
                        <div class="product-rating mb-2">
                            <i class="fas fa-star text-warning"></i>
                            <span>${rating.toFixed(1)}</span>
                        </div>
                        <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                            ${product.discountPercentage ? `
                                <span class="text-muted" style="text-decoration: line-through; font-size: 0.9rem;">
                                    ₹${(price / (1 - product.discountPercentage / 100)).toFixed(2)}
                                </span>
                                <p class="product-price text-primary fw-bold fs-5 mb-0">₹${price.toFixed(2)}</p>
                                <span class="badge bg-danger">-${Math.round(product.discountPercentage)}%</span>
                            ` : `
                                <p class="product-price text-primary fw-bold fs-5 mb-0">₹${price.toFixed(2)}</p>
                            `}
                        </div>
                        <p class="product-description small text-muted flex-grow-1">${product.description || ''}</p>
                        <div class="d-flex gap-2 mt-2">
                            <button class="btn btn-primary btn-sm flex-grow-1 add-to-cart-search-btn" 
                                    data-id="${product.id}" 
                                    data-title="${product.title}" 
                                    data-price="${price}" 
                                    data-image="${image}" 
                                    data-category="${product.category || 'General'}">
                                <i class="fas fa-shopping-cart me-1"></i>Cart
                            </button>
                            <button class="btn btn-outline-danger btn-sm flex-grow-1 add-to-wishlist-search-btn" 
                                    data-id="${product.id}" 
                                    data-title="${product.title}" 
                                    data-price="${price}" 
                                    data-image="${image}"
                                    title="Add to wishlist">
                                <i class="far fa-heart"></i>
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
    });

    html += '</div>';
    searchResultsContainer.innerHTML = html;

    // Attach event listeners to add to cart buttons
    attachSearchCartEventListeners();
    
    // Attach wishlist event listeners
    attachSearchWishlistEventListeners();
}

// Attach event listeners for search cart buttons
function attachSearchCartEventListeners() {
    document.querySelectorAll('.add-to-cart-search-btn').forEach(button => {
        button.removeEventListener('click', handleSearchAddToCart);
        button.addEventListener('click', handleSearchAddToCart);
    });
}

// Handle add to cart for search results
function handleSearchAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const product = {
        id: parseInt(button.dataset.id),
        title: button.dataset.title,
        price: parseFloat(button.dataset.price),
        image: button.dataset.image,
        category: button.dataset.category || 'General'
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
        console.log('Add to cart:', product);
        button.innerHTML = '<i class="fas fa-check"></i> Added!';
        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.disabled = false;
        }, 2000);
    }
}

// Attach event listeners for search wishlist buttons
function attachSearchWishlistEventListeners() {
    document.querySelectorAll('.add-to-wishlist-search-btn').forEach(button => {
        button.removeEventListener('click', handleSearchAddToWishlist);
        button.addEventListener('click', handleSearchAddToWishlist);
    });
    
    // Update wishlist button states
    if (typeof updateWishlistButtons === 'function') {
        updateWishlistButtons();
    }
}

// Handle add to wishlist for search results
function handleSearchAddToWishlist(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const product = {
        id: parseInt(button.dataset.id),
        title: button.dataset.title,
        price: parseFloat(button.dataset.price),
        image: button.dataset.image
    };

    // Check if already in wishlist
    if (typeof isInWishlist === 'function' && isInWishlist(product.id)) {
        if (typeof removeFromWishlist === 'function') {
            removeFromWishlist(product.id);
            button.classList.remove('in-wishlist');
            button.innerHTML = '<i class="far fa-heart"></i>';
            if (typeof updateWishlistCount === 'function') {
                updateWishlistCount();
            }
        }
    } else {
        if (typeof addToWishlist === 'function') {
            addToWishlist(product);
            button.classList.add('in-wishlist');
            button.innerHTML = '<i class="fas fa-heart"></i>';
            if (typeof updateWishlistCount === 'function') {
                updateWishlistCount();
            }
        }
    }
}

// Display empty search state
function displayEmptySearch() {
    const searchResultsContainer = document.getElementById('searchResults');
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>Search for products</h4>
                <p class="text-muted">Enter a search term above to find products</p>
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

// Make functions globally available
window.performSearch = performSearch;
window.displaySearchResults = displaySearchResults;
window.handleSearchAddToCart = handleSearchAddToCart;
window.handleSearchAddToWishlist = handleSearchAddToWishlist;
