// ===============================
// WISHLIST MANAGEMENT MODULE
// ===============================

const WISHLIST_STORAGE_KEY = 'wishlist';

// Global wishlist array
let wishlist = [];

// ===============================
// INITIALIZATION
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Wishlist] Initializing wishlist module');
    loadWishlist();
    updateWishlistCount();

    // Initialize wishlist page if we're on it
    const wishlistContainer = document.getElementById('wishlistItems');
    if (wishlistContainer) {
        initializeWishlistPage();
    }

    // Listen for wishlist changes from other tabs/windows
    window.addEventListener('storage', (event) => {
        if (event.key === WISHLIST_STORAGE_KEY) {
            loadWishlist();
            updateWishlistCount();
            updateWishlistButtons();
            if (wishlistContainer) {
                renderWishlist();
            }
        }
    });

    // Listen for custom wishlist update events from same tab
    window.addEventListener('wishlistUpdated', () => {
        loadWishlist();
        updateWishlistCount();
        updateWishlistButtons();
        if (wishlistContainer) {
            renderWishlist();
        }
    });
});

// ===============================
// WISHLIST FUNCTIONS
// ===============================

function loadWishlist() {
    try {
        const wishlistData = localStorage.getItem(WISHLIST_STORAGE_KEY);
        wishlist = wishlistData ? JSON.parse(wishlistData) : [];
        if (!Array.isArray(wishlist)) {
            wishlist = [];
        }
    } catch (e) {
        wishlist = [];
    }
    return wishlist;
}

function saveWishlist() {
    try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
        updateWishlistCount();

        // Notify other tabs/windows of wishlist update
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { wishlist: wishlist } }));

        return true;
    } catch (e) {
        return false;
    }
}

function addToWishlist(product) {
    if (!product || !product.id) {
        return false;
    }

    // Check if product already in wishlist
    const existingItem = wishlist.find(item => item.id === product.id);

    if (existingItem) {
        return false;
    }

    wishlist.push({
        id: product.id,
        title: product.title || 'Unknown Product',
        price: parseFloat(product.price) || 0,
        image: product.image || product.thumbnail || 'https://via.placeholder.com/200',
        thumbnail: product.thumbnail || product.image || 'https://via.placeholder.com/200',
        category: product.category || 'General',
        rating: parseFloat(product.rating) || 0,
        description: product.description || '',
        discountPercentage: parseFloat(product.discountPercentage) || 0,
        addedDate: new Date().toISOString()
    });

    if (saveWishlist()) {
        updateWishlistButtons();
        return true;
    }

    return false;
}

function removeFromWishlist(productId) {
    const initialLength = wishlist.length;
    wishlist = wishlist.filter(item => item.id !== productId);

    if (wishlist.length < initialLength) {
        saveWishlist();
        updateWishlistButtons();
        return true;
    }

    return false;
}

function isInWishlist(productId) {
    return wishlist.some(item => item.id === productId);
}

function wishlistGetCount() {
    return wishlist.length;
}

function updateWishlistCount() {
    const wishlistCountEl = document.getElementById('wishlistCount');
    if (wishlistCountEl) {
        const count = wishlistGetCount();
        wishlistCountEl.textContent = count;
        wishlistCountEl.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function updateWishlistButtons() {
    // Update all wishlist buttons to reflect current wishlist state
    document.querySelectorAll('.add-to-wishlist-btn').forEach(button => {
        const productId = parseInt(button.dataset.id);
        if (isInWishlist(productId)) {
            button.classList.add('in-wishlist');
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.title = 'Remove from wishlist';
        } else {
            button.classList.remove('in-wishlist');
            button.innerHTML = '<i class="far fa-heart"></i>';
            button.title = 'Add to wishlist';
        }
    });
}

function clearWishlist() {
    wishlist = [];
    saveWishlist();
    return true;
}

// ===============================
// WISHLIST PAGE FUNCTIONS
// ===============================

function initializeWishlistPage() {
    renderWishlist();
    attachWishlistEventListeners();
}

function renderWishlist() {
    const wishlistContainer = document.getElementById('wishlistItems');
    const emptyWishlist = document.getElementById('emptyWishlist');
    const wishlistContent = document.getElementById('wishlistContent');

    if (!wishlistContainer) return;

    // Load fresh wishlist data
    loadWishlist();

    if (wishlist.length === 0) {
        if (wishlistContainer) wishlistContainer.innerHTML = '';
        if (emptyWishlist) emptyWishlist.classList.remove('d-none');
        if (wishlistContent) wishlistContent.classList.add('d-none');
        updateWishlistSummary();
        return;
    }

    if (emptyWishlist) emptyWishlist.classList.add('d-none');
    if (wishlistContent) wishlistContent.classList.remove('d-none');

    let html = '';

    wishlist.forEach((item) => {
        if (!item || !item.id) return;

        const rating = item.rating || 0;
        const description = item.description || 'No description available';
        const descriptionText = description.substring(0, 60) + (description.length > 60 ? '...' : '');

        html += `
            <div class="col-xl-3 col-lg-3 col-md-4 col-sm-6 col-xs-6 mb-4">
                <div class="card product-card h-100 border-0 shadow-sm transition-all">
                    <div class="product-image-container position-relative overflow-hidden" style="background: #f8f9fa; height: 250px;">
                        <img src="${item.image || item.thumbnail || 'https://via.placeholder.com/300'}" 
                             class="card-img-top product-img" 
                             alt="${item.title}"
                             onerror="this.src='https://via.placeholder.com/300'"
                             style="width: 100%; height: 100%; object-fit: cover;">
                        <div class="position-absolute top-0 end-0 p-2">
                            <button class="btn btn-sm btn-danger rounded-circle" 
                                    onclick="removeFromWishlist(${item.id}); renderWishlist();"
                                    title="Remove from wishlist">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title fw-bold text-truncate" title="${item.title}">${item.title}</h6>
                        <p class="card-text text-muted small flex-grow-1" style="line-height: 1.4;">${descriptionText}</p>
                        <div class="d-flex align-items-center mb-2">
                            <div class="text-warning small">
                                ${generateStarRating(parseFloat(rating))}
                            </div>
                            <small class="text-muted ms-1">(${parseFloat(rating).toFixed(1)})</small>
                        </div>
                        <div class="d-flex align-items-center gap-2 mt-auto mb-3 flex-wrap">
                            ${item.discountPercentage ? `
                                <span class="text-muted product-old-price" style="text-decoration: line-through;">
                                    ₹${((item.price / (1 - item.discountPercentage / 100)) || 0).toFixed(2)}
                                </span>
                                <span class="text-primary fw-bold fs-6">₹${(item.price || 0).toFixed(2)}</span>
                                <span class="badge bg-danger">-${Math.round(item.discountPercentage)}%</span>
                            ` : `
                                <span class="text-primary fw-bold fs-6">₹${(item.price || 0).toFixed(2)}</span>
                            `}
                        </div>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-sm btn-primary flex-grow-1" 
                                    onclick="addToCartFromWishlist(${item.id})"
                                    data-id="${item.id}"
                                    data-title="${item.title}"
                                    data-price="${item.price}"
                                    data-image="${item.image || item.thumbnail}">
                                <i class="fas fa-shopping-cart me-1"></i><span class="d-none d-sm-inline">Cart</span>
                            </button>
                            <a href="product-details.html?id=${item.id}" class="btn btn-sm btn-outline-primary" title="View product details">
                                <i class="fas fa-eye"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    wishlistContainer.innerHTML = html;
    updateWishlistSummary();
}

function updateWishlistSummary() {
    const count = wishlistGetCount();
    const countEl = document.getElementById('wishlistItemCount');

    if (countEl) countEl.textContent = count;

    // Update clear button state
    const clearBtn = document.getElementById('clearWishlistBtn');
    if (clearBtn) {
        clearBtn.disabled = wishlist.length === 0;
    }
}

function addToCartFromWishlist(productId) {
    const item = wishlist.find(i => i.id === productId);
    if (item && typeof window.addToCart === 'function') {
        window.addToCart(item);
    }
}

function attachWishlistEventListeners() {
    // Clear wishlist button
    const clearBtn = document.getElementById('clearWishlistBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your entire wishlist?')) {
                clearWishlist();
                renderWishlist();
            }
        });
    }
}

// ===============================
// HELPER FUNCTION (used in wishlist page)
// ===============================

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

// ===============================
// EXPORT FUNCTIONS
// ===============================

window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.isInWishlist = isInWishlist;
window.wishlistGetCount = wishlistGetCount;
window.updateWishlistCount = updateWishlistCount;
window.updateWishlistButtons = updateWishlistButtons;
window.clearWishlist = clearWishlist;
window.loadWishlist = loadWishlist;
window.saveWishlist = saveWishlist;
window.addToCartFromWishlist = addToCartFromWishlist;
window.renderWishlist = renderWishlist; // Export for use in categories.js