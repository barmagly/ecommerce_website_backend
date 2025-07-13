const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/userauth');
const {
   clearCart,addTOCart,getCurrentUserCart,getAllCarts,getOneCart
} = require('../controller/cart');
const { authorizeAdmin } = require('../middlewares/authrization');

//
router.use(isAuthenticated);
//

router.get('/showMyCart', getCurrentUserCart);
router.patch('/cartOP', addTOCart);
router.get('/admin/all',authorizeAdmin, getAllCarts);
router.get('/:id',authorizeAdmin, getOneCart);
router.delete('/:id',authorizeAdmin, clearCart);

module.exports = router;
