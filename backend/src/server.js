const express = require('express');
const cors = require('cors');
const path = require('path');
const initDb = require('./config/initDb');
const router = require('./routes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));



// Main welcome route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Selamat datang di UTSmart Backend API (UAS Pemrograman Web 2)', 
        version: '3.0.0',
        author: 'Rafi Maulana'
    });
});

// Register API Routes
app.use('/api', router);

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Error server:', err);
    res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
});

// Jalankan database seeder / table initializer, baru start server
initDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`============================================`);
            console.log(`🚀 Server berjalan di http://localhost:${port}`);
            console.log(`============================================`);
        });
    })
    .catch((err) => {
        console.error('❌ Gagal menjalankan server karena kesalahan database:', err);
        process.exit(1);
    });
