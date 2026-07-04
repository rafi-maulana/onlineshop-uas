const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

if (process.env.MYSQL_URL) {
    console.log('Menghubungkan ke MySQL menggunakan MYSQL_URL...');
    pool = mysql.createPool(process.env.MYSQL_URL);
} else {
    console.log('Menghubungkan ke MySQL menggunakan parameter .env...');
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'onlineshop_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

module.exports = pool;
