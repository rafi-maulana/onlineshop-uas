const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_jwt_onlineshop_super_secret_2024';

/**
 * Middleware: Verifikasi JWT Token
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Akses ditolak. Token tidak disediakan.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Akses ditolak. Format token tidak valid.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Akses ditolak. Token kadaluarsa atau tidak valid.' });
    }
};

/**
 * Middleware: Hanya Admin yang Diizinkan
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak. Memerlukan peran Administrator.' });
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin,
    JWT_SECRET
};
