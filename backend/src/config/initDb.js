const db = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const initDb = async () => {
    try {
        console.log('--- Inisialisasi Database ---');

        // 1. Tabel users
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NULL,
                address TEXT NULL,
                role VARCHAR(50) DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Tabel users siap');

        // 2. Tabel products
        await db.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(12, 2) NOT NULL,
                image_url TEXT NULL,
                description TEXT NULL,
                category VARCHAR(100) NULL,
                rating DECIMAL(3, 2) DEFAULT 5.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Tabel products siap');

        // 3. Tabel orders
        await db.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NULL,
                address TEXT NOT NULL,
                phone VARCHAR(50) NOT NULL,
                total_price DECIMAL(12, 2) NOT NULL,
                payment_method VARCHAR(50) NULL,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Migrate: pastikan kolom image_url cukup besar untuk menyimpan Base64
        await db.query(`ALTER TABLE products MODIFY COLUMN image_url MEDIUMTEXT NULL`);
        // Migrate existing tables that don't have payment_method yet
        await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NULL`);
        console.log('✓ Tabel orders siap');

        // 4. Tabel order_items
        await db.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(12, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Tabel order_items siap');

        // 5. Tabel settings
        await db.query(`
            CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value TEXT NULL
            )
        `);
        console.log('✓ Tabel settings siap');

        // --- Seeding Data ---

        // Seeding default admin jika belum ada
        const [admins] = await db.query('SELECT id FROM users WHERE role = "admin" OR email = "admin@admin.com"');
        if (admins.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.query(
                'INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
                ['Admin TOKO GENZ', 'admin@admin.com', hashedPassword, '081234567890', 'Kantor Pusat TOKO GENZ', 'admin']
            );
            console.log('🌱 Seeded default admin (admin@admin.com / admin123)');
        }

        // Seeding default customer jika belum ada
        const [customers] = await db.query('SELECT id FROM users WHERE email = "customer@test.com"');
        if (customers.length === 0) {
            const hashedPassword = await bcrypt.hash('user123', 10);
            await db.query(
                'INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
                ['Budi Santoso', 'customer@test.com', hashedPassword, '087706335584', 'Jl. Merdeka No. 123, Jakarta', 'customer']
            );
            console.log('🌱 Seeded default customer (customer@test.com / user123)');
        }

        // Seeding default settings jika belum ada
        const [currentSettings] = await db.query('SELECT setting_key FROM settings WHERE setting_key = "shop_name"');
        if (currentSettings.length === 0) {
            const defaultSettings = [
                ['shop_name', 'TOKO GENZ'],
                ['owner_phone', '6281234567890'],
                ['hero_title', 'Temukan Gadget Impian Anda'],
                ['hero_description', 'Dapatkan penawaran terbaik untuk produk teknologi terpopuler hari ini.']
            ];
            for (const [key, value] of defaultSettings) {
                await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
            }
            console.log('🌱 Seeded default settings');
        }

        // Seeding 24 produk jika tabel products kosong
        const [productsCount] = await db.query('SELECT COUNT(*) as count FROM products');
        if (productsCount[0].count === 0) {
            const seedPath = path.join(__dirname, '../data/products.seed.json');
            if (fs.existsSync(seedPath)) {
                const rawData = fs.readFileSync(seedPath, 'utf8');
                const seedProducts = JSON.parse(rawData);

                for (const p of seedProducts) {
                    await db.query(
                        'INSERT INTO products (name, price, image_url, description, category, rating) VALUES (?, ?, ?, ?, ?, ?)',
                        [p.name, p.price, p.image_url, p.description, p.category, 4.5 + Math.random() * 0.5]
                    );
                }
                console.log(`🌱 Seeded ${seedProducts.length} produk awal dari products.seed.json`);
            }
        }

        console.log('✓ Database siap digunakan.');
        console.log('----------------------------');
    } catch (err) {
        console.error('❌ Gagal melakukan inisialisasi database:', err);
        throw err;
    }
};

module.exports = initDb;
