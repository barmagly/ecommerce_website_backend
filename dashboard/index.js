const express = require('express');
const router = express.Router();
const dashboardController = require('./controller');

// GET /dashboard (mirroring Dashboard.jsx) –– wired to dashboardController.getDashboard
router.get('/', dashboardController.getDashboard);

// GET, POST, PUT, DELETE /dashboard/products (mirroring Products.jsx) –– wired to dashboardController
router.get('/products', dashboardController.getProducts);
router.post('/products', dashboardController.postProducts);
router.put('/products/:id', dashboardController.putProducts);
router.delete('/products/:id', dashboardController.deleteProducts);

// GET, POST, PUT, DELETE /dashboard/categories (mirroring Categories.jsx) –– wired to dashboardController
router.get('/categories', dashboardController.getCategories);
router.post('/categories', dashboardController.postCategories);
router.put('/categories/:id', dashboardController.putCategories);
router.delete('/categories/:id', dashboardController.deleteCategories);

// GET, POST, PUT, DELETE /dashboard/users (mirroring Users.jsx) –– wired to dashboardController
router.get('/users', dashboardController.getUsers);
router.post('/users', dashboardController.postUsers);
router.put('/users/:id', dashboardController.putUsers);
router.delete('/users/:id', dashboardController.deleteUsers);

// GET, POST, PUT, DELETE /dashboard/orders (mirroring Orders.jsx) –– wired to dashboardController
router.get('/orders', dashboardController.getOrders);
router.post('/orders', dashboardController.postOrders);
router.put('/orders/:id', dashboardController.putOrders);
router.delete('/orders/:id', dashboardController.deleteOrders);

// GET, PUT /dashboard/profile (mirroring Profile.jsx) –– wired to dashboardController
router.get('/profile/:id', dashboardController.getProfile);
router.put('/profile/:id', dashboardController.putProfile);

module.exports = router; 