const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const adminController = require('../controllers/adminController');

const { verifyToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', verifyToken, authController.me);

// --- Product Routes ---
router.get('/products', productController.getAllProducts);
router.get('/products/meta/categories', productController.getCategories);
router.get('/products/:id', productController.getProductById);
router.post('/products', verifyToken, isAdmin, upload.single('image'), productController.createProduct);
router.put('/products/:id', verifyToken, isAdmin, upload.single('image'), productController.updateProduct);
router.delete('/products/:id', verifyToken, isAdmin, productController.deleteProduct);

// --- Checkout & Orders Routes ---
router.post('/checkout', orderController.checkout);
router.get('/orders', verifyToken, orderController.getAllOrders);
router.get('/orders/:id', verifyToken, orderController.getOrderById);
router.put('/orders/:id/status', verifyToken, isAdmin, orderController.updateOrderStatus);

// --- Admin-only Routes ---
router.get('/admin/stats', verifyToken, isAdmin, adminController.getStats);
router.get('/admin/users', verifyToken, isAdmin, adminController.getUsers);
router.put('/admin/users/:id', verifyToken, isAdmin, adminController.updateUser);
router.delete('/admin/users/:id', verifyToken, isAdmin, adminController.deleteUser);
router.put('/settings', verifyToken, isAdmin, adminController.updateSettings);
router.get('/settings', adminController.getSettings);

module.exports = router;
