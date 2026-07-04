const db = require('../config/db');

// GET /api/admin/stats (Admin Only)
exports.getStats = async (req, res) => {
    try {
        // Ambil total produk
        const [prodCount] = await db.query('SELECT COUNT(*) as total FROM products');
        
        // Ambil total orders
        const [ordCount] = await db.query('SELECT COUNT(*) as total FROM orders');
        
        // Ambil total users
        const [userCount] = await db.query('SELECT COUNT(*) as total FROM users');
        
        // Ambil total revenue (pendapatan dari order berstatus 'completed')
        const [revenue] = await db.query("SELECT SUM(total_price) as total FROM orders WHERE status = 'completed'");

        res.json({
            totalProducts: prodCount[0].total || 0,
            totalOrders: ordCount[0].total || 0,
            totalUsers: userCount[0].total || 0,
            totalRevenue: parseFloat(revenue[0].total || 0)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat menghitung statistik' });
    }
};

// GET /api/admin/users (Admin Only)
exports.getUsers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, phone, address, role, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat mengambil data pengguna' });
    }
};

// PUT /api/settings (Admin Only)
exports.updateSettings = async (req, res) => {
    const settings = req.body;
    try {
        const keys = Object.keys(settings);
        for (const key of keys) {
            await db.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, settings[key], settings[key]]
            );
        }
        res.json({ message: 'Pengaturan berhasil diperbarui' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat memperbarui pengaturan' });
    }
};

// GET /api/settings (Public)
exports.getSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat mengambil pengaturan' });
    }
};


// PUT /api/admin/users/:id (Admin Only)
exports.updateUser = async (req, res) => {
    const { name, email, phone, address, role } = req.body;
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }
        await db.query(
            'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, role = ? WHERE id = ?',
            [name, email, phone || null, address || null, role || 'customer', req.params.id]
        );
        res.json({ message: 'Data pengguna berhasil diperbarui' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat memperbarui data pengguna' });
    }
};

// DELETE /api/admin/users/:id (Admin Only)
exports.deleteUser = async (req, res) => {
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Pengguna berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat menghapus pengguna' });
    }
};

