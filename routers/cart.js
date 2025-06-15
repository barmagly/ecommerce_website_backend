const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/userauth');
const {
   clearCart,addTOCart,getCurrentUserCart,getAllCarts,getOneCart
} = require('../controller/cart');

// All cart operations require authentication
router.use(isAuthenticated);

// User routes
router.get('/showMyCart', getCurrentUserCart);
router.patch('/cartOP', addTOCart);

// Admin routes
router.get('/admin/all', getAllCarts);
router.get('/:id', getOneCart);
router.delete('/:id', clearCart);

module.exports = router;
