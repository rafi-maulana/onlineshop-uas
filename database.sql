CREATE DATABASE IF NOT EXISTS onlineshop_db;
USE onlineshop_db;

-- Users table (for real auth)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NULL,
    status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value TEXT
);

-- Insert seed products (only if table is empty)
INSERT INTO products (name, price, image_url, description, category)
SELECT * FROM (SELECT
    'Premium Wireless Headphones' as name, 1500000 as price,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' as image_url,
    'High-quality wireless headphones with noise cancellation and 30h battery life.' as description,
    'Electronics' as category) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

INSERT INTO products (name, price, image_url, description, category)
SELECT * FROM (SELECT
    'Mechanical Gaming Keyboard' as name, 850000 as price,
    'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80' as image_url,
    'RGB mechanical keyboard with tactile blue switches for precision gaming.' as description,
    'Electronics' as category) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Mechanical Gaming Keyboard');

INSERT INTO products (name, price, image_url, description, category)
SELECT * FROM (SELECT
    'Smart Fitness Watch' as name, 1200000 as price,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80' as image_url,
    'Track your fitness, heart rate, sleep and get smart notifications.' as description,
    'Accessories' as category) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Smart Fitness Watch');

INSERT INTO products (name, price, image_url, description, category)
SELECT * FROM (SELECT
    'Classic Aviator Sunglasses' as name, 350000 as price,
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80' as image_url,
    'Stylish UV-protected aviator sunglasses for everyday use.' as description,
    'Accessories' as category) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Classic Aviator Sunglasses');

INSERT INTO products (name, price, image_url, description, category)
SELECT * FROM (SELECT
    'Minimalist Leather Wallet' as name, 250000 as price,
    'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80' as image_url,
    'Genuine leather slim wallet with RFID blocking protection.' as description,
    'Fashion' as category) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Minimalist Leather Wallet');

INSERT INTO products (name, price, image_url, description, category)
SELECT * FROM (SELECT
    'Professional Camera Lens 50mm' as name, 3500000 as price,
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80' as image_url,
    '50mm f/1.8 prime lens compatible with most DSLR and mirrorless cameras.' as description,
    'Photography' as category) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Professional Camera Lens 50mm');

-- Default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('shop_name', 'TOKO GENZ'),
('owner_phone', '6287706335584'),
('hero_title', 'Upgrade Your Digital Lifestyle'),
('hero_description', 'Discover handpicked premium tech gadgets, lifestyle accessories, and photography gear designed for tomorrow.')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Sample user
INSERT IGNORE INTO users (name, email, password, phone, role) VALUES
('Budi Santoso', 'customer@test.com', 'password123', '081234567890', 'customer');
