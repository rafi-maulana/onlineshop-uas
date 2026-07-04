import {
    fetchProducts, createProduct, updateProduct, deleteProduct,
    fetchOrders, fetchSettings, updateSettings, updateOrderStatus,
    fetchUsers, updateUser, deleteUser, fetchAdminStats, getImageUrl
} from './api.js';
import { DUMMY_PRODUCTS } from './src/data/products.fallback.js';

// Pemeriksaan Autentikasi
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

let products = [];
let orders = [];
let users = [];

const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

// =============================================
// NAVIGASI TAB
// =============================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = {
    products: document.getElementById('tab-products'),
    orders: document.getElementById('tab-orders'),
    users: document.getElementById('tab-users'),
    settings: document.getElementById('tab-settings'),
};

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
            b.classList.remove('active-tab');
            b.classList.add('text-slate-400');
            b.classList.remove('text-white');
        });
        btn.classList.add('active-tab');
        btn.classList.remove('text-slate-400');
        btn.classList.add('text-white');

        Object.values(tabContents).forEach(c => c.classList.add('hidden'));
        const targetId = btn.dataset.tab;
        if (tabContents[targetId]) tabContents[targetId].classList.remove('hidden');
    });
});

// =============================================
// STATISTIK
// =============================================
async function updateStats() {
    const statTotal = document.getElementById('statTotalProducts');
    const statOrders = document.getElementById('statTotalOrders');
    const statUsers = document.getElementById('statTotalUsers');
    const statRev = document.getElementById('statRevenue');

    try {
        // Coba ambil statistik terhitung dari server-side (Requirement UAS)
        const stats = await fetchAdminStats();
        if (statTotal) statTotal.textContent = stats.totalProducts;
        if (statOrders) statOrders.textContent = stats.totalOrders;
        if (statUsers) statUsers.textContent = stats.totalUsers;
        if (statRev) statRev.textContent = formatter.format(stats.totalRevenue);
    } catch (e) {
        // Fallback hitung client-side jika offline / API gagal (Mode UTS)
        console.log("Menggunakan statistik client-side fallback.");
        if (statTotal) statTotal.textContent = products.length;
        if (statOrders) statOrders.textContent = orders.length;
        if (statUsers) statUsers.textContent = users.length;
        if (statRev) {
            const totalRev = orders
                .filter(o => o.status === 'completed')
                .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
            statRev.textContent = formatter.format(totalRev);
        }
    }
}

// =============================================
// PRODUK
// =============================================
const modal = document.getElementById('productModal');
const form = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const productsTableBody = document.getElementById('productsTableBody');

document.getElementById('addProductBtn').addEventListener('click', () => {
    form.reset();
    document.getElementById('productId').value = '';
    modalTitle.textContent = 'Tambah Produk';
    pImagePreview.src = '';
    pImagePreview.classList.add('hidden');
    modal.classList.remove('hidden');
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
    modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
});

function renderProducts() {
    productsTableBody.innerHTML = '';
    if (products.length === 0) {
        productsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-500 text-sm">Belum ada produk. Klik "Tambah Produk" untuk memulai.</td></tr>`;
        updateStats();
        return;
    }
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors duration-200';

        // Terjemahan kategori untuk tampilan
        const categoryLabels = {
            'Electronics': 'Elektronik',
            'Accessories': 'Aksesori',
            'Fashion': 'Fashion',
            'Photography': 'Fotografi',
        };
        const categoryLabel = categoryLabels[p.category] || p.category;

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap"><img src="${getImageUrl(p.image_url)}" class="h-12 w-12 rounded-xl object-cover border border-white/5 shadow-md" onerror="this.src='https://placehold.co/48x48/1e1b4b/a78bfa?text=IMG'"></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">${p.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                <span class="bg-violet-500/10 text-violet-400 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-violet-500/10 uppercase tracking-wider">${categoryLabel}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-300">${formatter.format(p.price)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button class="bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold transition edit-btn cursor-pointer" data-id="${p.id}">Ubah</button>
                <button class="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition delete-btn cursor-pointer" data-id="${p.id}">Hapus</button>
            </td>
        `;
        productsTableBody.appendChild(tr);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editProduct(e.target.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleDeleteProduct(e.target.dataset.id));
    });
    updateStats();
}

function editProduct(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;
    document.getElementById('productId').value = product.id;
    document.getElementById('pName').value = product.name;
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pCategory').value = product.category;
    document.getElementById('pImage').value = product.image_url || '';
    document.getElementById('pDesc').value = product.description;

    const preview = document.getElementById('pImagePreview');
    if (product.image_url) {
        preview.src = getImageUrl(product.image_url);
        preview.classList.remove('hidden');
    } else {
        preview.classList.add('hidden');
    }

    modalTitle.textContent = 'Ubah Produk';
    modal.classList.remove('hidden');
}

async function handleDeleteProduct(id) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        try {
            await deleteProduct(id);
            products = products.filter(p => p.id != id);
            localStorage.setItem('products', JSON.stringify(products));
            renderProducts();
            showToast('Produk berhasil dihapus!', 'red');
        } catch (error) {
            alert('Gagal menghapus produk.');
        }
    }
}

const pImageInput = document.getElementById('pImage');
const pImagePreview = document.getElementById('pImagePreview');

// Kompres & konversi file gambar ke Base64 (max 800px, 75% quality)
function compressImageToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('File harus berupa gambar (JPG, PNG, WEBP, GIF).'));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Ukuran file terlalu besar. Maksimal 5MB.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const MAX_SIZE = 800;
                let { width, height } = img;
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    } else {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                // Konversi ke JPEG untuk kompresi optimal
                const base64 = canvas.toDataURL('image/jpeg', 0.75);
                resolve(base64);
            };
            img.onerror = () => reject(new Error('Gagal membaca gambar.'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file.'));
        reader.readAsDataURL(file);
    });
}

// Preview saat file dipilih
pImageInput.addEventListener('change', async () => {
    const file = pImageInput.files[0];
    if (!file) return;
    try {
        const base64 = await compressImageToBase64(file);
        pImagePreview.src = base64;
        pImagePreview.classList.remove('hidden');
    } catch (err) {
        alert(err.message);
        pImageInput.value = '';
        pImagePreview.classList.add('hidden');
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const file = pImageInput.files[0];

    // Validasi: produk baru wajib ada gambar
    if (!id && !file) {
        alert('Foto produk wajib dipilih untuk produk baru.');
        return;
    }

    const productData = {
        name: document.getElementById('pName').value.trim(),
        price: parseFloat(document.getElementById('pPrice').value),
        category: document.getElementById('pCategory').value.trim(),
        description: document.getElementById('pDesc').value.trim(),
    };

    // Konversi gambar ke Base64 jika ada file baru dipilih
    if (file) {
        try {
            productData.image_url = await compressImageToBase64(file);
        } catch (err) {
            alert('Gagal memproses gambar: ' + err.message);
            return;
        }
    }

    try {
        if (id) {
            const result = await updateProduct(id, productData);
            const index = products.findIndex(p => p.id == id);
            if (index !== -1) {
                products[index] = {
                    ...products[index],
                    ...productData,
                    image_url: productData.image_url || products[index].image_url
                };
            }
            showToast('Produk berhasil diperbarui!', 'violet');
        } else {
            const newProduct = await createProduct(productData);
            products.unshift({ ...productData, id: newProduct.id, image_url: productData.image_url });
            showToast('Produk berhasil ditambahkan!', 'violet');
        }
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
        modal.classList.add('hidden');
        pImageInput.value = '';
        pImagePreview.classList.add('hidden');
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Gagal menyimpan produk: ' + (error.message || 'Terjadi kesalahan pada server'));
    }
});

// =============================================
// PESANAN
// =============================================
const paymentMethodLabels = {
    cash: 'Tunai (Cash)',
    bank_transfer: 'Transfer Bank',
    dana: 'Dana',
    gopay: 'GoPay',
    ovo: 'OVO',
    shopeepay: 'ShopeePay'
};

const statusConfig = {
    pending: { label: 'Menunggu', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    processing: { label: 'Diproses', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    shipped: { label: 'Dikirim', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    completed: { label: 'Selesai', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    cancelled: { label: 'Dibatalkan', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const ordersTableBody = document.getElementById('ordersTableBody');

function renderOrders() {
    ordersTableBody.innerHTML = '';
    if (orders.length === 0) {
        ordersTableBody.innerHTML = `<tr><td colspan="8" class="px-6 py-10 text-center text-slate-500 text-sm">Belum ada pesanan masuk.</td></tr>`;
        updateStats();
        return;
    }
    orders.forEach(o => {
        const cfg = statusConfig[o.status] || statusConfig.pending;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors duration-200';
        tr.innerHTML = `
            <td class="px-5 py-4 whitespace-nowrap text-sm font-bold text-violet-400">#${o.id}</td>
            <td class="px-5 py-4 whitespace-nowrap">
                <p class="text-sm font-bold text-white">${o.customer_name}</p>
                <p class="text-xs text-slate-500">${o.customer_email || '-'}</p>
            </td>
            <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-400">${o.phone}</td>
            <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-400">${paymentMethodLabels[o.payment_method] || o.payment_method || '-'}</td>
            <td class="px-5 py-4 whitespace-nowrap text-sm font-bold text-emerald-400">${formatter.format(o.total_price)}</td>
            <td class="px-5 py-4 whitespace-nowrap">
                <span class="text-xs font-bold px-2.5 py-1.5 rounded-full border ${cfg.class}">${cfg.label}</span>
            </td>
            <td class="px-5 py-4 whitespace-nowrap text-xs text-slate-500">${new Date(o.created_at).toLocaleDateString('id-ID')}</td>
            <td class="px-5 py-4 whitespace-nowrap">
                <select class="order-status-select bg-slate-950/70 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500 transition cursor-pointer" data-id="${o.id}">
                    ${['pending', 'processing', 'shipped', 'completed', 'cancelled'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${statusConfig[s].label}</option>`).join('')}
                </select>
            </td>
        `;
        ordersTableBody.appendChild(tr);

        // Detail barang yang dipesan
        const itemsTr = document.createElement('tr');
        const itemsHtml = (o.items && o.items.length > 0)
            ? o.items.map(item => `
                <div class="flex items-center gap-3 p-2 bg-slate-900/40 rounded-xl border border-white/5">
                    <img src="${getImageUrl(item.image_url)}" alt="${item.product_name || 'Produk'}" class="h-10 w-10 rounded-lg object-cover border border-white/5" onerror="this.src='https://placehold.co/40x40/1e1b4b/a78bfa?text=IMG'">
                    <div>
                        <p class="text-sm font-bold text-white">${item.product_name || 'Produk'}</p>
                        <p class="text-xs text-slate-400">${item.quantity}x • ${formatter.format(item.price)} = ${formatter.format(item.price * item.quantity)}</p>
                    </div>
                </div>
            `).join('')
            : '<p class="text-xs text-slate-500">Tidak ada detail produk untuk pesanan ini.</p>';
        itemsTr.innerHTML = `
            <td colspan="8" class="px-5 pb-5 pt-0">
                <div class="glass rounded-2xl p-4 border border-white/5">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Produk Dipesan</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        ${itemsHtml}
                    </div>
                </div>
            </td>
        `;
        ordersTableBody.appendChild(itemsTr);
    });

    function syncOrderStatusToLocal(orderId, newStatus) {
        try {
            const localOrders = JSON.parse(localStorage.getItem('orders')) || [];
            const idx = localOrders.findIndex(o => o.id == orderId);
            if (idx >= 0) {
                localOrders[idx].status = newStatus;
                localStorage.setItem('orders', JSON.stringify(localOrders));
            }
        } catch (e) {
            console.warn('Gagal sinkronkan status ke localStorage:', e);
        }
    }

    document.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.dataset.id;
            const newStatus = e.target.value;

            try {
                await updateOrderStatus(orderId, newStatus);
                const order = orders.find(o => o.id == orderId);
                if (order) order.status = newStatus;
                syncOrderStatusToLocal(orderId, newStatus);
                showToast(`Status Pesanan #${orderId} → ${statusConfig[newStatus].label}`, 'violet');
                updateStats();
                renderOrders();
            } catch (err) {
                // Fallback mode UTS: jika backend tidak tersedia, simpan perubahan di localStorage
                const order = orders.find(o => o.id == orderId);
                if (order) order.status = newStatus;
                syncOrderStatusToLocal(orderId, newStatus);
                showToast(`Status Pesanan #${orderId} → ${statusConfig[newStatus].label} (tersimpan lokal)`, 'amber');
                updateStats();
                renderOrders();
            }
        });
    });
    updateStats();
}

// =============================================
// PENGGUNA (USERS)
// =============================================
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const usersTableBody = document.getElementById('usersTableBody');

document.getElementById('closeUserModalBtn').addEventListener('click', () => {
    userModal.classList.add('hidden');
});
userModal.addEventListener('click', (e) => {
    if (e.target === userModal) userModal.classList.add('hidden');
});

function renderUsers() {
    usersTableBody.innerHTML = '';
    if (users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-500 text-sm">Belum ada pengguna terdaftar.</td></tr>`;
        updateStats();
        return;
    }
    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors duration-200';
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500">#${u.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">${u.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">${u.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">${u.phone || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-xs font-bold px-2.5 py-1.5 rounded-full border ${u.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}">${u.role === 'admin' ? 'Admin' : 'Pelanggan'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500">${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
            <td class="px-6 py-4 whitespace-nowrap space-x-2">
                <button class="bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold transition edit-user-btn cursor-pointer" data-id="${u.id}">Ubah</button>
                <button class="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition delete-user-btn cursor-pointer" data-id="${u.id}">Hapus</button>
            </td>
        `;
        usersTableBody.appendChild(tr);
    });

    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editUser(e.target.dataset.id));
    });
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleDeleteUser(e.target.dataset.id));
    });
    updateStats();
}

function editUser(id) {
    const u = users.find(u => u.id == id);
    if (!u) return;
    document.getElementById('userId').value = u.id;
    document.getElementById('uName').value = u.name;
    document.getElementById('uEmail').value = u.email;
    document.getElementById('uPhone').value = u.phone || '';
    document.getElementById('uAddress').value = u.address || '';
    document.getElementById('uRole').value = u.role;
    userModal.classList.remove('hidden');
}

async function handleDeleteUser(id) {
    if (confirm('Hapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) {
        try {
            await deleteUser(id);
            users = users.filter(u => u.id != id);
            renderUsers();
            showToast('Pengguna dihapus.', 'red');
        } catch (err) {
            alert('Gagal menghapus pengguna.');
        }
    }
}

userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('userId').value;
    const userData = {
        name: document.getElementById('uName').value,
        email: document.getElementById('uEmail').value,
        phone: document.getElementById('uPhone').value,
        address: document.getElementById('uAddress').value,
        role: document.getElementById('uRole').value,
    };
    try {
        await updateUser(id, userData);
        const index = users.findIndex(u => u.id == id);
        users[index] = { ...users[index], ...userData };
        renderUsers();
        userModal.classList.add('hidden');
        showToast('Pengguna berhasil diperbarui!', 'violet');
    } catch (err) {
        alert('Gagal memperbarui data pengguna.');
    }
});

// =============================================
// PENGATURAN TOKO
// =============================================
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const settingsData = {
            shop_name: document.getElementById('setShopName').value,
            owner_phone: document.getElementById('setOwnerPhone').value,
            hero_title: document.getElementById('setHeroTitle').value,
            hero_description: document.getElementById('setHeroDesc').value
        };
        try {
            await updateSettings(settingsData);
            showToast('Pengaturan disimpan!', 'violet');
            const logo = document.getElementById('adminLogo');
            if (logo) logo.textContent = `${settingsData.shop_name} Panel Kontrol`;
        } catch (error) {
            alert('Gagal memperbarui pengaturan.');
        }
    });
}

// =============================================
// TOAST NOTIFIKASI
// =============================================
function showToast(message, color = 'violet') {
    const colors = {
        violet: 'border-violet-500/30 text-violet-300',
        red: 'border-red-500/30 text-red-300',
        green: 'border-emerald-500/30 text-emerald-300',
    };
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-[999] glass border ${colors[color] || colors.violet} px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform translate-y-10 opacity-0`;
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span class="text-sm font-semibold text-white">${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// =============================================
// INISIALISASI
// =============================================
async function init() {
    // Pakai allSettled agar produk tetap muat walau orders/users API gagal
    const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
        fetchProducts(),
        fetchOrders(),
        fetchUsers(),
    ]);

    if (productsRes.status === 'fulfilled') {
        products = productsRes.value;
        if (products.length > 0) {
            localStorage.setItem('products', JSON.stringify(products));
        } else {
            const cached = JSON.parse(localStorage.getItem('products')) || [];
            products = cached.length > 0 ? cached : DUMMY_PRODUCTS;
            localStorage.setItem('products', JSON.stringify(products));
        }
    } else {
        console.warn('Gagal ambil produk dari API, fallback localStorage:', productsRes.reason);
        const cached = JSON.parse(localStorage.getItem('products')) || [];
        products = cached.length > 0 ? cached : DUMMY_PRODUCTS;
        localStorage.setItem('products', JSON.stringify(products));
    }

    if (ordersRes.status === 'fulfilled') {
        orders = ordersRes.value;
    } else {
        console.warn('Gagal ambil pesanan dari API, fallback localStorage:', ordersRes.reason);
        orders = JSON.parse(localStorage.getItem('orders')) || [];
    }

    if (usersRes.status === 'fulfilled') {
        users = usersRes.value;
    } else {
        console.warn('Gagal ambil users dari API, fallback localStorage:', usersRes.reason);
        users = JSON.parse(localStorage.getItem('users')) || [];
    }

    renderProducts();
    renderOrders();
    renderUsers();

    // Muat Pengaturan
    try {
        const settings = await fetchSettings();
        if (settings) {
            if (document.getElementById('setShopName')) document.getElementById('setShopName').value = settings.shop_name || '';
            if (document.getElementById('setOwnerPhone')) document.getElementById('setOwnerPhone').value = settings.owner_phone || '';
            if (document.getElementById('setHeroTitle')) document.getElementById('setHeroTitle').value = settings.hero_title || '';
            if (document.getElementById('setHeroDesc')) document.getElementById('setHeroDesc').value = settings.hero_description || '';
            if (settings.shop_name) {
                const logo = document.getElementById('adminLogo');
                if (logo) logo.textContent = `${settings.shop_name} Panel Kontrol`;
            }
        }
    } catch (e) {
        console.warn('Gagal muat settings dari API, fallback localStorage');
        const settings = JSON.parse(localStorage.getItem('settings')) || {
            shop_name: 'TOKO GENZ',
            owner_phone: '6287706335584',
            hero_title: 'Temukan Gadget Impian Anda',
            hero_description: 'Dapatkan penawaran terbaik untuk produk teknologi terpopuler hari ini.'
        };
        if (document.getElementById('setShopName')) document.getElementById('setShopName').value = settings.shop_name || '';
        if (document.getElementById('setOwnerPhone')) document.getElementById('setOwnerPhone').value = settings.owner_phone || '';
        if (document.getElementById('setHeroTitle')) document.getElementById('setHeroTitle').value = settings.hero_title || '';
        if (document.getElementById('setHeroDesc')) document.getElementById('setHeroDesc').value = settings.hero_description || '';
        const logo = document.getElementById('adminLogo');
        if (logo) logo.textContent = `${settings.shop_name} Panel Kontrol`;
    }
}

init();
