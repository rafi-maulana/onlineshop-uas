import { fetchProducts, fetchSettings, getImageUrl } from './api.js';
import { DUMMY_PRODUCTS } from './src/data/products.fallback.js';

let products = [];
let cart = [];
try {
    const parsedCart = JSON.parse(localStorage.getItem('cart'));
    if (Array.isArray(parsedCart)) {
        cart = parsedCart;
    }
} catch (e) {
    console.error('Error parsing cart:', e);
}

let wishlist = [];
try {
    const parsedWishlist = JSON.parse(localStorage.getItem('wishlist'));
    if (Array.isArray(parsedWishlist)) {
        wishlist = parsedWishlist;
    }
} catch (e) {
    console.error('Error parsing wishlist:', e);
}

const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const searchInputMobile = document.getElementById('searchInputMobile');
const categoryFilter = document.getElementById('categoryFilter');
const categoryFilterMobile = document.getElementById('categoryFilterMobile');
const cartCount = document.getElementById('cartCount');
const wishlistCount = document.getElementById('wishlistCount');
const authLink = document.getElementById('authLink');
const myOrdersLink = document.getElementById('myOrdersLink');
const resultCount = document.getElementById('resultCount');

// Dummy data produk fallback diimpor dari src/data/products.fallback.js

// =============================================
// TEMA GELAP/TERANG (DARK & LIGHT MODE - UTS BONUS)
// =============================================
const themeLightBtn = document.getElementById('themeLightBtn');
const themeDarkBtn = document.getElementById('themeDarkBtn');

const ACTIVE_THEME_CLASSES = ['bg-violet-600', 'text-white', 'theme-active', 'shadow-sm'];
const INACTIVE_THEME_CLASSES = ['text-slate-400', 'hover:text-slate-200'];

function updateThemeButtons(theme) {
    if (!themeLightBtn || !themeDarkBtn) return;
    if (theme === 'light') {
        themeLightBtn.classList.add(...ACTIVE_THEME_CLASSES);
        themeLightBtn.classList.remove(...INACTIVE_THEME_CLASSES);
        themeDarkBtn.classList.remove(...ACTIVE_THEME_CLASSES);
        themeDarkBtn.classList.add(...INACTIVE_THEME_CLASSES);
    } else {
        themeDarkBtn.classList.add(...ACTIVE_THEME_CLASSES);
        themeDarkBtn.classList.remove(...INACTIVE_THEME_CLASSES);
        themeLightBtn.classList.remove(...ACTIVE_THEME_CLASSES);
        themeLightBtn.classList.add(...INACTIVE_THEME_CLASSES);
    }
}

function setTheme(theme) {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (theme === currentTheme) return; // don't switch if already selected

    if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        showToast('Mode Terang Aktif');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        showToast('Mode Gelap Aktif');
    }
    updateThemeButtons(theme);
}

function initTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
    updateThemeButtons(currentTheme);
}

themeLightBtn?.addEventListener('click', () => setTheme('light'));
themeDarkBtn?.addEventListener('click', () => setTheme('dark'));

// =============================================
// LOGIN & SESSION CHECK
// =============================================
function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        if (user.role === 'admin') {
            authLink.textContent = 'Dashboard Admin';
            authLink.href = 'admin.html';
            authLink.className = 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35';
            if (myOrdersLink) myOrdersLink.classList.add('hidden');
        } else {
            authLink.textContent = `Keluar (${user.name.split(' ')[0]})`;
            authLink.href = '#';
            authLink.className = 'border border-red-500/30 text-red-400 hover:bg-red-500/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all';
            authLink.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('user');
                window.location.reload();
            };
            if (myOrdersLink) myOrdersLink.classList.remove('hidden');
        }
    } else {
        authLink.textContent = 'Masuk';
        authLink.href = 'login.html';
        authLink.className = 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35';
        authLink.onclick = null;
        if (myOrdersLink) myOrdersLink.classList.add('hidden');
    }
}

// =============================================
// CART
// =============================================
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${product.name} ditambahkan ke keranjang!`);
}

// =============================================
// WISHLIST (UTS BONUS)
// =============================================
const wishlistModal = document.getElementById('wishlistModal');
const wishlistToggleBtn = document.getElementById('wishlistToggleBtn');
const closeWishlistBtn = document.getElementById('closeWishlistBtn');
const closeWishlistBtn2 = document.getElementById('closeWishlistBtn2');
const clearWishlistBtn = document.getElementById('clearWishlistBtn');
const wishlistItemsContainer = document.getElementById('wishlistItems');

function updateWishlistUI() {
    wishlistCount.textContent = wishlist.length;
}

function toggleWishlist(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const index = wishlist.findIndex(item => item.id === id);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast(`${product.name} dihapus dari wishlist`, 'red');
    } else {
        wishlist.push(product);
        showToast(`${product.name} ditambahkan ke wishlist`);
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    
    // Rerender catalog to update heart icon colors
    filterProducts();
}

function renderWishlistItems() {
    wishlistItemsContainer.innerHTML = '';
    const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    if (wishlist.length === 0) {
        wishlistItemsContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="text-slate-400 font-semibold">Wishlist Anda kosong.</p>
                <p class="text-slate-500 text-xs mt-1">Sukai beberapa produk di toko untuk menambahkannya ke sini.</p>
            </div>
        `;
        return;
    }

    wishlist.forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between gap-4 p-3 bg-slate-900/60 border border-white/5 rounded-2xl';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${getImageUrl(item.image_url)}" class="w-12 h-12 rounded-xl object-cover">
                <div>
                    <h4 class="text-sm font-bold text-white truncate w-40">${item.name}</h4>
                    <p class="text-xs text-violet-400 font-semibold">${formatter.format(item.price)}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button class="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-2 rounded-xl font-bold transition wishlist-add-cart-btn" data-id="${item.id}">+ Cart</button>
                <button class="text-slate-500 hover:text-red-400 p-2 transition wishlist-remove-btn" data-id="${item.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `;
        wishlistItemsContainer.appendChild(div);
    });

    // Attach button events
    document.querySelectorAll('.wishlist-add-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            addToCart(parseInt(e.target.dataset.id));
        });
    });

    document.querySelectorAll('.wishlist-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleWishlist(parseInt(e.target.closest('button').dataset.id));
            renderWishlistItems();
        });
    });
}

wishlistToggleBtn.addEventListener('click', () => {
    renderWishlistItems();
    wishlistModal.classList.remove('hidden');
});

const closeWishlist = () => wishlistModal.classList.add('hidden');
closeWishlistBtn.addEventListener('click', closeWishlist);
closeWishlistBtn2.addEventListener('click', closeWishlist);
wishlistModal.addEventListener('click', (e) => {
    if (e.target === wishlistModal) closeWishlist();
});

clearWishlistBtn.addEventListener('click', () => {
    wishlist = [];
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    renderWishlistItems();
    filterProducts();
    showToast('Wishlist berhasil dibersihkan', 'red');
});

// =============================================
// RENDER CATALOG PRODUCTS
// =============================================
function renderProducts(productsToRender) {
    if (!productGrid) return;
    productGrid.innerHTML = '';
    
    // Safely check length
    const list = Array.isArray(productsToRender) ? productsToRender.filter(p => p !== null && typeof p === 'object') : [];

    if (resultCount) {
        resultCount.textContent = `Menampilkan ${list.length} produk`;
    }

    if (list.length === 0) {
        productGrid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-20 font-medium">Tidak ada produk yang cocok dengan pencarianmu.</div>';
        return;
    }

    list.forEach(product => {
        try {
            const card = document.createElement('div');
            card.className = 'glass-card rounded-3xl overflow-hidden relative group border border-white/5 flex flex-col justify-between';
            
            const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

            const categoryLabels = {
                'Electronics': 'Elektronik',
                'Accessories': 'Aksesori',
                'Fashion': 'Fashion',
                'Photography': 'Fotografi',
            };
            const categoryLabel = categoryLabels[product.category] || product.category || 'Lainnya';
            
            // Rating calculation
            const productRating = parseFloat(product.rating) || 4.5;
            
            // Is liked in wishlist?
            const isLiked = Array.isArray(wishlist) && wishlist.some(item => item && item.id === product.id);

            card.innerHTML = `
                <div>
                    <!-- Image Container -->
                    <div class="relative overflow-hidden aspect-video sm:aspect-square">
                        <img src="${getImageUrl(product.image_url)}" alt="${product.name || 'Produk'}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent opacity-60"></div>
                        <span class="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-violet-400 text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-wider">
                            ${categoryLabel}
                        </span>
                        <!-- Heart Wishlist Toggle Button (UTS Bonus) -->
                        <button class="wishlist-btn absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md rounded-full border border-white/10 transition duration-300 cursor-pointer" data-id="${product.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-white'}" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    </div>
                    <!-- Content -->
                    <div class="p-6">
                        <!-- Rating Star UI (UTS Bonus) -->
                        <div class="flex items-center gap-1 mb-2 text-amber-400 text-xs">
                            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            <span class="font-bold text-slate-300">${productRating.toFixed(1)}</span>
                        </div>
                        <h3 class="text-lg font-bold text-white leading-snug group-hover:text-violet-400 transition-colors duration-300">${product.name || 'Nama Produk'}</h3>
                        <p class="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">${product.description || 'Tidak ada deskripsi.'}</p>
                    </div>
                </div>
                <!-- Footer -->
                <div class="px-6 pb-6 pt-2 flex items-center justify-between border-t border-white/5">
                    <span class="text-lg font-extrabold text-white">${formatter.format(product.price || 0)}</span>
                    <button class="add-to-cart-btn bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-600/10 hover:shadow-violet-600/30" data-id="${product.id}">
                        + Keranjang
                    </button>
                </div>
            `;
            productGrid.appendChild(card);
        } catch (err) {
            console.error('Error rendering product card:', err, product);
        }
    });

    // Attach Add to Cart Button Events
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            addToCart(parseInt(e.target.dataset.id));
        });
    });

    // Attach Wishlist Button Events
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            toggleWishlist(parseInt(button.dataset.id));
        });
    });
}

function showToast(message, color = 'violet') {
    const bgColors = {
        violet: 'border-violet-500/30 text-white',
        red: 'border-red-500/30 text-rose-300'
    };
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-50 glass border ${bgColors[color] || bgColors.violet} px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform translate-y-10 opacity-0`;
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${color === 'red' ? 'text-rose-400' : 'text-emerald-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm font-semibold">${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function filterProducts() {
    if (!searchInput) return;
    const searchVal = searchInput.value || (searchInputMobile ? searchInputMobile.value : '');
    const searchTerm = searchVal.toLowerCase();
    const category = (categoryFilter && categoryFilter.value) || (categoryFilterMobile ? categoryFilterMobile.value : '');

    const filtered = products.filter(p => {
        if (!p) return false;
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm) || (p.description || '').toLowerCase().includes(searchTerm);
        const matchesCategory = category === '' || p.category === category;
        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
}

async function init() {
    initTheme();
    updateAuthUI();
    updateCartCount();
    updateWishlistUI();

    try {
        const settings = await fetchSettings();
        if (settings) {
            if (settings.shop_name) {
                const logoText = document.getElementById('logoText');
                if (logoText) logoText.textContent = settings.shop_name;
                document.title = `${settings.shop_name} - Elektronik Premium`;
            }
            if (settings.hero_title) {
                const heroTitle = document.getElementById('heroTitle');
                if (heroTitle) heroTitle.innerHTML = settings.hero_title;
            }
            if (settings.hero_description) {
                const heroDescription = document.getElementById('heroDescription');
                if (heroDescription) heroDescription.textContent = settings.hero_description;
            }
        }
    } catch (e) {
        console.log('API Settings offline, menggunakan dummy header.');
    }

    try {
        products = await fetchProducts();
        // Gabungkan rating dummy untuk UTS compliance
        products = products.map((p, i) => ({ ...p, rating: parseFloat(p.rating) || (4.0 + (i % 10) * 0.1) }));
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts(products);
    } catch (error) {
        console.log('Koneksi backend API gagal. Mengaktifkan mode dummy UTS (LocalStorage fallback).');
        try {
            const cachedProducts = JSON.parse(localStorage.getItem('products'));
            products = Array.isArray(cachedProducts) ? cachedProducts.filter(p => p !== null) : [];
        } catch (e) {
            products = [];
        }
        if (!products || products.length === 0) {
            products = DUMMY_PRODUCTS;
        }
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts(products);
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (searchInputMobile) searchInputMobile.value = searchInput.value;
            filterProducts();
        });
    }
    if (searchInputMobile) {
        searchInputMobile.addEventListener('input', () => {
            if (searchInput) searchInput.value = searchInputMobile.value;
            filterProducts();
        });
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            if (categoryFilterMobile) categoryFilterMobile.value = categoryFilter.value;
            filterProducts();
        });
    }
    if (categoryFilterMobile) {
        categoryFilterMobile.addEventListener('change', () => {
            if (categoryFilter) categoryFilter.value = categoryFilterMobile.value;
            filterProducts();
        });
    }
}

init();
