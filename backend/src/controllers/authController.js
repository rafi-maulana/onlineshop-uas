const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
exports.register = async (req, res) => {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nama, email, dan kata sandi wajib diisi' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Kata sandi minimal 6 karakter' });
    }
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone || null, address || null, 'customer']
        );

        const token = jwt.sign(
            { id: result.insertId, name, email, role: 'customer' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registrasi berhasil',
            token,
            user: { id: result.insertId, name, email, phone: phone || null, address: address || null, role: 'customer' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email dan kata sandi wajib diisi' });
    }
    try {
        // Cek hardcoded admin
        if ((email === 'admin@admin.com' || email === 'admin') && password === 'admin123') {
            const token = jwt.sign(
                { id: 0, name: 'Admin TOKO GENZ', email: 'admin@admin.com', role: 'admin' },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            return res.json({
                message: 'Login berhasil',
                token,
                user: { id: 0, name: 'Admin TOKO GENZ', email: 'admin@admin.com', role: 'admin' }
            });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Email atau kata sandi salah' });
        }

        const user = rows[0];

        let isPasswordValid = false;
        if (user.password && user.password.startsWith('$2')) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            isPasswordValid = (password === user.password);
            if (isPasswordValid) {
                // Upgrade plaintext ke hash bcrypt secara otomatis
                const hashed = await bcrypt.hash(password, 10);
                await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email atau kata sandi salah' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login berhasil',
            token,
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

// GET /api/auth/me
exports.me = async (req, res) => {
    try {
        if (req.user.id === 0) {
            return res.json({ id: 0, name: 'Admin TOKO GENZ', email: req.user.email, role: 'admin' });
        }
        const [rows] = await db.query('SELECT id, name, email, phone, address, role FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};
