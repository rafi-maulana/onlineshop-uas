const db = require('../config/db');

// GET /api/products (List + Search + Filter + Sort)
exports.getAllProducts = async (req, res) => {
    const { search, category, sort, minPrice, maxPrice } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const queryParams = [];

    if (search) {
        query += ' AND (name LIKE ? OR description LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
        query += ' AND category = ?';
        queryParams.push(category);
    }

    if (minPrice) {
        query += ' AND price >= ?';
        queryParams.push(parseFloat(minPrice));
    }

    if (maxPrice) {
        query += ' AND price <= ?';
        queryParams.push(parseFloat(maxPrice));
    }

    if (sort) {
        if (sort === 'price_asc') {
            query += ' ORDER BY price ASC';
        } else if (sort === 'price_desc') {
            query += ' ORDER BY price DESC';
        } else if (sort === 'rating') {
            query += ' ORDER BY rating DESC';
        } else {
            query += ' ORDER BY created_at DESC';
        }
    } else {
        query += ' ORDER BY created_at DESC';
    }

    try {
        const [rows] = await db.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat mengambil data produk' });
    }
};

// GET /api/products/meta/categories
exports.getCategories = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ""');
        const categories = rows.map(row => row.category);
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat mengambil data kategori' });
    }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

// POST /api/products (Admin Only)
exports.createProduct = async (req, res) => {
    const { name, price, description, category } = req.body;
    let image_url = req.body.image_url;

    if (!name || !price) {
        return res.status(400).json({ error: 'Nama dan harga produk wajib diisi' });
    }

    // Support file upload (jika ada) atau URL langsung dari body
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    // Gunakan placeholder jika tidak ada gambar
    if (!image_url) {
        image_url = 'https://placehold.co/800x800/1e1b4b/a78bfa?text=Produk';
    }

    try {
        const [result] = await db.query(
            'INSERT INTO products (name, price, image_url, description, category) VALUES (?, ?, ?, ?, ?)',
            [name, price, image_url, description, category]
        );
        res.status(201).json({ id: result.insertId, name, price, image_url, description, category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

// PUT /api/products/:id (Admin Only)
exports.updateProduct = async (req, res) => {
    const { name, price, description, category } = req.body;
    let image_url = req.body.image_url;

    try {
        const [existingRows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }

        const existing = existingRows[0];

        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        } else if (!image_url) {
            image_url = existing.image_url;
        }

        await db.query(
            'UPDATE products SET name = ?, price = ?, image_url = ?, description = ?, category = ? WHERE id = ?',
            [name, price, image_url, description, category, req.params.id]
        );
        res.json({ message: 'Produk berhasil diperbarui', image_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

// DELETE /api/products/:id (Admin Only)
exports.deleteProduct = async (req, res) => {
    try {
        const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};
