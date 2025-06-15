const express = require('express');
const router = express.Router();
const dashboardController = require('./controller');

// Dashboard overview
router.get('/', dashboardController.getDashboard);

// Recent Orders and Top Products
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/top-products', dashboardController.getTopProducts);

// Products routes
router.get('/products', dashboardController.getProducts);
router.post('/products', dashboardController.postProducts);
router.patch('/products/:id', dashboardController.putProducts);
router.delete('/products/:id', dashboardController.deleteProducts);

// Categories routes
router.get('/categories', dashboardController.getCategories);
router.post('/categories', dashboardController.postCategories);
router.put('/categories/:id', dashboardController.putCategories);
router.delete('/categories/:id', dashboardController.deleteCategories);

// Users routes
router.get('/users', dashboardController.getUsers);
router.post('/users', dashboardController.postUsers);
router.put('/users/:id', dashboardController.putUsers);
router.delete('/users/:id', dashboardController.deleteUsers);

// Orders routes
router.get('/orders', dashboardController.getOrders);
router.post('/orders', dashboardController.postOrders);
router.put('/orders/:id', dashboardController.putOrders);
router.delete('/orders/:id', dashboardController.deleteOrders);

// Profile routes
router.get('/profile/:id', dashboardController.getProfile);
router.put('/profile/:id', dashboardController.putProfile);

module.exports = router; 