// ========================================
// SEARCH MODULE - ENHANCED VERSION
// ========================================

const API_BASE_URL = 'https://dummyjson.com';
let allProducts = [];
let searchResults = [];

// Initialize search page
document.addEventListener('DOMContentLoaded', () => {
    console.log('[v0] Search page initialized');

    // Update cart count on page load
    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
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
        const response = await fetch(`${API_BASE_URL}/products?limit=100`);
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
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="card product-card h-100">
                    <img src="${image}" class="card-img-top" alt="${product.title}" style="height: 120px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/200'">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title product-title">${product.title}</h5>
                        <p class="text-muted small mb-2">${product.category || 'General'}</p>
                        <div class="product-rating mb-2">
                            <i class="fas fa-star text-warning"></i>
                            <span>${rating.toFixed(1)}</span>
                        </div>
                        <p class="product-price">₹${price.toFixed(2)}</p>
                        <p class="product-description small text-secondary flex-grow-1">${product.description || ''}</p>
                        <div class="mt-auto d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-grow-1 add-to-cart-search-btn" 
                                    data-id="${product.id}" 
                                    data-title="${product.title}" 
                                    data-price="${price}" 
                                    data-image="${image}" 
                                    data-category="${product.category || 'General'}">
                                <i class="fas fa-shopping-cart me-1"></i>Add to Cart
                            </button>
                            <a href="product-details.html?id=${product.id}" class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-eye"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    searchResultsContainer.innerHTML = html;

    // Attach event listeners to add to cart buttons
    attachSearchCartEventListeners();
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
