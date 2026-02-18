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
            console.log('[Wishlist] Wishlist updated from another tab');
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
        console.log('[Wishlist] Wishlist updated (custom event)');
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
        console.error('[Wishlist] Error loading wishlist:', e);
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
        console.error('[Wishlist] Error saving wishlist:', e);
        return false;
    }
}

function addToWishlist(product) {
    if (!product || !product.id) {
        console.error('[Wishlist] Invalid product');
        showNotification('Cannot add invalid product to wishlist', 'danger');
        return false;
    }

    console.log('[Wishlist] Adding product:', product.title);

    // Check if product already in wishlist
    const existingItem = wishlist.find(item => item.id === product.id);

    if (existingItem) {
        console.log('[Wishlist] Product already in wishlist:', product.title);
        showNotification(`${product.title} is already in your wishlist`, 'info');
        return false;
    }

    wishlist.push({
        id: product.id,
        title: product.title || 'Unknown Product',
        price: parseFloat(product.price) || 0,
        image: product.thumbnail || product.image || 'https://via.placeholder.com/200',
        category: product.category || 'General',
        rating: product.rating || 0,
        description: product.description || '',
        discountPercentage: product.discountPercentage || 0,
        addedDate: new Date().toISOString()
    });

    if (saveWishlist()) {
        showNotification(`<strong>${product.title}</strong> added to wishlist!`, 'success');
        updateWishlistButtons();
        return true;
    }

    return false;
}

function removeFromWishlist(productId) {
    const initialLength = wishlist.length;
    const product = wishlist.find(item => item.id === productId);
    wishlist = wishlist.filter(item => item.id !== productId);

    if (wishlist.length < initialLength) {
        saveWishlist();
        console.log('[Wishlist] Removed product:', productId);
        if (product) {
            showNotification(`${product.title} removed from wishlist`, 'info');
        }
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
        const originalText = button.innerHTML.includes('Wishlist') ? ' Wishlist' : '';
        if (isInWishlist(productId)) {
            button.classList.add('in-wishlist');
            button.innerHTML = '<i class="fas fa-heart"></i>' + originalText;
            button.title = 'Remove from wishlist';
        } else {
            button.classList.remove('in-wishlist');
            button.innerHTML = '<i class="far fa-heart"></i>' + originalText;
            button.title = 'Add to wishlist';
        }
    });
}

function clearWishlist() {
    wishlist = [];
    saveWishlist();
    console.log('[Wishlist] Wishlist cleared');
    return true;
}

// ===============================
// WISHLIST PAGE FUNCTIONS
// ===============================

function initializeWishlistPage() {
    console.log('[Wishlist] Initializing wishlist page');
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

    console.log('[v0] Wishlist contents:', wishlist);

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

        html += `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card h-100 border-0 shadow-sm">
                    <div class="position-relative product-image-container">
                        <img src="${item.image || 'https://via.placeholder.com/300'}" 
                             class="card-img-top product-img" 
                             alt="${item.title}"
                             style="height: 250px; object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/300'">
                        <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" 
                                onclick="removeFromWishlist(${item.id}); renderWishlist();"
                                title="Remove from wishlist">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title fw-bold mb-2" title="${item.title}">${item.title}</h6>
                        <p class="card-text text-muted small mb-2 flex-grow-1">${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}</p>
                        <div class="d-flex align-items-center mb-2">
                            <div class="text-warning small">
                                ${generateStarRating(rating)}
                            </div>
                            <small class="text-muted ms-1">(${rating.toFixed(1)})</small>
                        </div>
                        <div class="d-flex align-items-center gap-2 mt-auto mb-2 flex-wrap">
                            ${item.discountPercentage ? `
                                <span class="text-muted" style="text-decoration: line-through; font-size: 0.9rem;">
                                    ₹${(item.price / (1 - item.discountPercentage / 100) || 0).toFixed(2)}
                                </span>
                                <span class="text-primary fw-bold fs-5">₹${(item.price || 0).toFixed(2)}</span>
                                <span class="badge bg-danger">-${Math.round(item.discountPercentage)}%</span>
                            ` : `
                                <span class="text-primary fw-bold fs-5">₹${(item.price || 0).toFixed(2)}</span>
                            `}
                        </div>
                        <div class="d-flex gap-2 mt-2">
                            <button class="btn btn-sm btn-primary flex-grow-1" 
                                    onclick="addToCartFromWishlist(${item.id})"
                                    data-id="${item.id}"
                                    data-title="${item.title}"
                                    data-price="${item.price}"
                                    data-image="${item.image}">
                                <i class="fas fa-shopping-cart me-1"></i> Cart
                            </button>
                            <a href="product-details.html?id=${item.id}" class="btn btn-sm btn-outline-primary flex-grow-1">
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
                if (typeof window.showNotification === 'function') {
                    window.showNotification('Wishlist cleared', 'info');
                }
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

console.log('[Wishlist] Module loaded successfully');
