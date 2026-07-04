import { checkout, fetchSettings, getImageUrl } from './api.js';

let cart = [];
try {
    const parsedCart = JSON.parse(localStorage.getItem('cart'));
    if (Array.isArray(parsedCart)) {
        cart = parsedCart;
    }
} catch (e) {
    console.error('Error parsing cart:', e);
}
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutForm = document.getElementById('checkoutForm');
const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

// =============================================
// TEMA GELAP/TERANG (UTS COMPLIANCE)
// =============================================
function initTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p class="text-slate-400 font-semibold text-lg">Keranjang belanja Anda kosong.</p>
                <p class="text-slate-500 text-sm mt-1">Silakan kembali belanja untuk menambahkan produk.</p>
            </div>
        `;
        cartTotalEl.textContent = 'Rp 0';
        return;
    }

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-6 gap-4';
        itemEl.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${getImageUrl(item.image_url)}" class="w-20 h-20 object-cover rounded-2xl border border-white/5">
                <div>
                    <h4 class="font-bold text-white text-base leading-snug">${item.name}</h4>
                    <p class="text-sm text-slate-400 mt-1">${formatter.format(item.price)}</p>
                </div>
            </div>
            <div class="flex items-center justify-between w-full sm:w-auto gap-6 mt-2 sm:mt-0">
                <div class="flex items-center bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
                    <button class="px-3 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer" onclick="updateQty(${index}, -1)">&minus;</button>
                    <span class="px-4 font-bold text-white text-sm">${item.quantity}</span>
                    <button class="px-3 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer" onclick="updateQty(${index}, 1)">&plus;</button>
                </div>
                <button class="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition cursor-pointer" onclick="removeItem(${index})">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartTotalEl.textContent = formatter.format(total);
}

// Global functions for update and removal
window.updateQty = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

window.removeItem = (index) => {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

// Auto-fill customer details from logged in user
function autoFillDetails() {
    const loggedUser = JSON.parse(localStorage.getItem('user'));
    if (loggedUser) {
        if (document.getElementById('custName')) document.getElementById('custName').value = loggedUser.name || '';
        if (document.getElementById('custPhone')) document.getElementById('custPhone').value = loggedUser.phone || '';
        if (document.getElementById('custAddress')) document.getElementById('custAddress').value = loggedUser.address || '';
    }
}

const paymentMethodLabels = {
    cash: 'Tunai (Cash)',
    bank_transfer: 'Transfer Bank',
    dana: 'Dana',
    gopay: 'GoPay',
    ovo: 'OVO',
    shopeepay: 'ShopeePay'
};

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
        alert("Keranjang belanja Anda kosong!");
        return;
    }

    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const loggedUser = JSON.parse(localStorage.getItem('user'));

    // UTS: Generate ID transaksi secara lokal
    const localTxId = `TX-${Date.now()}`;

    const checkoutData = {
        customer_name: name,
        customer_email: loggedUser ? loggedUser.email : null,
        phone: phone,
        address: address,
        total_price: total,
        payment_method: paymentMethod,
        cart_items: cart.map(item => ({ id: item.id, quantity: item.quantity, price: item.price }))
    };

    let orderId = localTxId;

    try {
        let ownerPhone = "6287706335584";
        try {
            const settings = await fetchSettings();
            if (settings && settings.owner_phone) {
                ownerPhone = settings.owner_phone;
            }
        } catch (err) {
            console.log("Menggunakan nomor WA owner default.");
        }

        // Simpan ke database via backend (UAS)
        let whatsappUrlFromServer = null;
        try {
            const result = await checkout(checkoutData);
            orderId = result.order_id;
            whatsappUrlFromServer = result.whatsappUrl;
        } catch (apiErr) {
            console.log("Koneksi API gagal, pesanan hanya akan disimpan secara lokal di browser (Mode UTS).");
        }

        // UTS: Simpan transaksi ke LocalStorage
        const localOrders = JSON.parse(localStorage.getItem('orders')) || [];
        const newOrder = {
            id: orderId,
            customer_name: name,
            customer_email: loggedUser ? loggedUser.email : 'guest@guest.com',
            address: address,
            phone: phone,
            total_price: total,
            payment_method: paymentMethod,
            status: 'pending',
            items: cart.map(item => ({
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price,
                image_url: item.image_url
            })),
            created_at: new Date().toISOString()
        };
        localOrders.push(newOrder);
        localStorage.setItem('orders', JSON.stringify(localOrders));

        // Prepare WA Message (Fallback offline)
        let lines = [];
        lines.push(`🛒 *PESANAN BARU #${orderId}*`);
        lines.push(`━━━━━━━━━━━━━━━━━━━━`);
        lines.push(`👤 *Nama:* ${name}`);
        lines.push(`📱 *WhatsApp:* ${phone}`);
        lines.push(`📍 *Alamat:* ${address}`);
        lines.push(`💳 *Metode Pembayaran:* ${paymentMethodLabels[paymentMethod] || paymentMethod}`);
        lines.push(``);
        lines.push(`📦 *Detail Pesanan:*`);
        cart.forEach(item => {
            lines.push(`  • ${item.name}`);
            lines.push(`    ${item.quantity}x ${formatter.format(item.price)} = ${formatter.format(item.price * item.quantity)}`);
        });
        lines.push(``);
        lines.push(`━━━━━━━━━━━━━━━━━━━━`);
        lines.push(`💰 *TOTAL: ${formatter.format(total)}*`);
        lines.push(``);
        lines.push(`_Mohon konfirmasi pesanan ini. Terima kasih!_ 🙏`);

        const waMessage = encodeURIComponent(lines.join('\n'));

        // Clear cart
        localStorage.removeItem('cart');
        
        // Redirect ke WA
        if (whatsappUrlFromServer) {
            window.open(whatsappUrlFromServer, '_blank');
        } else {
            window.open(`https://wa.me/${ownerPhone}?text=${waMessage}`, '_blank');
        }
        window.location.href = 'orders.html';

    } catch (error) {
        alert("Checkout gagal. Silakan coba kembali.");
    }
});

async function loadSettings() {
    try {
        const settings = await fetchSettings();
        if (settings) {
            if (settings.shop_name) {
                document.title = `Keranjang Anda - ${settings.shop_name}`;
                const logo = document.querySelector('nav a');
                if (logo) logo.textContent = settings.shop_name;
            }
        }
    } catch (e) {
        console.log("API Settings offline.");
    }
}

initTheme();
loadSettings();
autoFillDetails();
renderCart();
