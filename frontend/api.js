const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
const API_ROOT = BASE_URL.replace(/\/api\/?$/, '');
const PLACEHOLDER_IMAGE = 'https://placehold.co/48x48/1e1b4b/a78bfa?text=IMG';

// =============================================
// --- Helper: Resolves product image URL ---
// =============================================

export const getImageUrl = (image_url) => {
    if (!image_url) return PLACEHOLDER_IMAGE;
    // Base64 data URLs langsung dikembalikan apa adanya
    if (image_url.startsWith('data:')) return image_url;
    if (/^https?:\/\//i.test(image_url) || /^\/\//.test(image_url)) return image_url;
    const separator = image_url.startsWith('/') ? '' : '/';
    return `${API_ROOT}${separator}${image_url}`;
};

// =============================================
// --- Helper: Ambil Token dari LocalStorage ---
// =============================================

const getToken = () => localStorage.getItem('token');

/**
 * Helper request dengan Authorization header otomatis
 * Jika response 401 DAN ada token (expired), paksa logout
 * Jika tidak ada token, lempar error biasa → caller bisa fallback ke localStorage
 */
const authFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = {
        ...(options.headers || {}),
    };

    // Jangan set Content-Type untuk FormData agar browser menambahkan boundary sendiri
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    // Jika token expired / tidak valid, paksa logout HANYA jika sebelumnya ada token
    if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({}));
        if (token && !window.location.pathname.includes('login')) {
            // Token ada tapi ditolak → artinya expired → paksa logout
            localStorage.clear();
            window.location.href = 'login.html';
        }
        // Kalau tidak ada token, lempar error saja (jangan redirect)
        // agar caller bisa fallback ke localStorage
        throw new Error(data.error || 'Akses ditolak');
    }

    return response;
};

// =============================================
// --- Produk (Products) ---
// =============================================

export const fetchProducts = async () => {
    const response = await fetch(`${BASE_URL}/products`);
    if (!response.ok) throw new Error('Gagal mengambil data produk');
    return response.json();
};

export const fetchProductById = async (id) => {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Produk tidak ditemukan');
    return response.json();
};

export const createProduct = async (product) => {
    const isFormData = product instanceof FormData;
    const response = await authFetch(`${BASE_URL}/products`, {
        method: 'POST',
        body: isFormData ? product : JSON.stringify(product)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal membuat produk baru');
    }
    return response.json();
};

export const updateProduct = async (id, product) => {
    const isFormData = product instanceof FormData;
    const response = await authFetch(`${BASE_URL}/products/${id}`, {
        method: 'PUT',
        body: isFormData ? product : JSON.stringify(product)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal memperbarui data produk');
    }
    return response.json();
};

export const deleteProduct = async (id) => {
    const response = await authFetch(`${BASE_URL}/products/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal menghapus produk');
    }
    return response.json();
};

// =============================================
// --- Checkout ---
// =============================================

export const checkout = async (checkoutData) => {
    const response = await authFetch(`${BASE_URL}/checkout`, {
        method: 'POST',
        body: JSON.stringify(checkoutData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal melakukan checkout');
    }
    return response.json();
};

// =============================================
// --- Pesanan (Orders) ---
// =============================================

export const fetchOrders = async () => {
    const response = await authFetch(`${BASE_URL}/orders`);
    if (!response.ok) throw new Error('Gagal mengambil data pesanan');
    return response.json();
};

export const fetchOrdersByEmail = fetchOrders;

export const updateOrderStatus = async (id, status) => {
    const response = await authFetch(`${BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal memperbarui status pesanan');
    }
    return response.json();
};

// =============================================
// --- Pengaturan (Settings) ---
// =============================================

export const fetchSettings = async () => {
    const response = await fetch(`${BASE_URL}/settings`);
    if (!response.ok) throw new Error('Gagal mengambil data pengaturan toko');
    return response.json();
};

export const updateSettings = async (settings) => {
    const response = await authFetch(`${BASE_URL}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal memperbarui pengaturan toko');
    }
    return response.json();
};

// =============================================
// --- Pengguna (Users - Khusus Admin) ---
// =============================================

export const fetchUsers = async () => {
    const response = await authFetch(`${BASE_URL}/admin/users`);
    if (!response.ok) throw new Error('Gagal mengambil data daftar pengguna');
    return response.json();
};

export const updateUser = async (id, userData) => {
    const response = await authFetch(`${BASE_URL}/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal memperbarui data pengguna');
    }
    return response.json();
};

export const deleteUser = async (id) => {
    const response = await authFetch(`${BASE_URL}/admin/users/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal menghapus pengguna');
    }
    return response.json();
};

// =============================================
// --- Admin Stats ---
// =============================================

export const fetchAdminStats = async () => {
    const response = await authFetch(`${BASE_URL}/admin/stats`);
    if (!response.ok) throw new Error('Gagal mengambil statistik');
    return response.json();
};

// =============================================
// --- Autentikasi (Auth) ---
// =============================================

export const registerUser = async (userData) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal melakukan pendaftaran');
    }
    const data = await response.json();
    // Simpan token & user ke localStorage
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
    }
    return data;
};

export const loginUser = async (credentials) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Email atau kata sandi salah');
    }
    const data = await response.json();
    // Simpan token & user ke localStorage
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
    }
    return data;
};

export const getCurrentUser = async () => {
    const response = await authFetch(`${BASE_URL}/auth/me`);
    if (!response.ok) throw new Error('Gagal mengambil data pengguna');
    return response.json();
};
