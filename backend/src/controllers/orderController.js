const db = require('../config/db');
require('dotenv').config();

// POST /api/checkout (Checkout + Generate WhatsApp URL)
exports.checkout = async (req, res) => {
    const { customer_name, customer_email, address, phone, total_price, payment_method, cart_items } = req.body;

    if (!customer_name || !address || !phone || !cart_items || cart_items.length === 0) {
        return res.status(400).json({ error: 'Data checkout tidak lengkap' });
    }

    const validPaymentMethods = ['cash', 'bank_transfer', 'dana', 'gopay', 'ovo', 'shopeepay'];
    const method = validPaymentMethods.includes(payment_method) ? payment_method : 'cash';

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [orderResult] = await connection.query(
                'INSERT INTO orders (customer_name, customer_email, address, phone, total_price, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [customer_name, customer_email || null, address, phone, total_price, method, 'pending']
            );
            const orderId = orderResult.insertId;

            for (const item of cart_items) {
                await connection.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [orderId, item.id, item.quantity, item.price]
                );
            }

            await connection.commit();
            connection.release();

            // --- Pembuatan WhatsApp URL (Server-Side Integration) ---
            // Ambil nomor WA Owner dari .env, fallback ke settings DB
            let ownerWa = process.env.OWNER_WA_NUMBER;
            if (!ownerWa) {
                const [settings] = await db.query('SELECT setting_value FROM settings WHERE setting_key = "owner_phone"');
                if (settings.length > 0) {
                    ownerWa = settings[0].setting_value;
                }
            }

            let whatsappUrl = null;
            if (ownerWa) {
                // Bersihkan karakter selain angka
                ownerWa = ownerWa.replace(/\D/g, '');
                if (ownerWa.startsWith('0')) {
                    ownerWa = '62' + ownerWa.slice(1);
                }

                const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
                
                // Ambil info nama produk dari DB untuk menyusun detail belanja
                const productIds = cart_items.map(item => item.id);
                const [productDetails] = await db.query(
                    'SELECT id, name FROM products WHERE id IN (?)',
                    [productIds]
                );
                
                const productMap = {};
                productDetails.forEach(p => {
                    productMap[p.id] = p.name;
                });
                
                const itemsText = cart_items.map(item => {
                    const productName = productMap[item.id] || 'Produk';
                    return `- ${productName} (${item.quantity}x) : ${formatter.format(item.price * item.quantity)}`;
                }).join('\n');
                
                const paymentLabels = {
                    cash: 'Tunai (Cash)',
                    bank_transfer: 'Transfer Bank',
                    dana: 'Dana',
                    gopay: 'GoPay',
                    ovo: 'OVO',
                    shopeepay: 'ShopeePay'
                };

                const textMessage = `Halo Admin, saya ingin mengonfirmasi pesanan saya:\n\n*ID Pesanan*: #${orderId}\n*Nama*: ${customer_name}\n*No. Telp*: ${phone}\n*Alamat*: ${address}\n*Metode Pembayaran*: ${paymentLabels[method] || method}\n\n*Detail Belanja*:\n${itemsText}\n\n*Total Bayar*: *${formatter.format(total_price)}*\n\nMohon segera diproses ya. Terima kasih!`;
                
                whatsappUrl = `https://wa.me/${ownerWa}?text=${encodeURIComponent(textMessage)}`;
            }

            res.status(201).json({ 
                message: 'Checkout berhasil', 
                order_id: orderId,
                whatsappUrl
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan saat checkout' });
    }
};

// GET /api/orders (Admin: Semua Orders, Customer: Hanya Orders Miliknya)
exports.getAllOrders = async (req, res) => {
    try {
        let query = 'SELECT * FROM orders';
        const queryParams = [];

        // Jika bukan admin, saring berdasarkan email dari JWT token
        if (req.user.role !== 'admin') {
            query += ' WHERE customer_email = ?';
            queryParams.push(req.user.email);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, queryParams);

        // Ambil item produk untuk masing-masing order
        for (const order of rows) {
            const [items] = await db.query(`
                SELECT oi.*, p.name as product_name, p.image_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id]);
            order.items = items;
        }

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

        const order = rows[0];

        // Validasi kepemilikan (hanya admin atau pemilik order yang boleh melihat)
        if (req.user.role !== 'admin' && req.user.email !== order.customer_email) {
            return res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang melihat pesanan ini.' });
        }

        const [items] = await db.query(`
            SELECT oi.*, p.name as product_name, p.image_url
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [order.id]);
        order.items = items;

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

// PUT /api/orders/:id/status (Admin Only)
exports.updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    if (!['pending', 'processing', 'shipped', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Status tidak valid' });
    }
    try {
        const [existing] = await db.query('SELECT id FROM orders WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Status pesanan berhasil diperbarui' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};
