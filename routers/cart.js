const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/userauth');
const {
   clearCart,addTOCart,getCurrentUserCart,
} = require('../controller/cart');



// All cart operations require authentication
router.use(isAuthenticated);

/**
 * @swagger
 * /cart/showMyCart:
 *   get:
 *     summary: Get current user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's current cart
 *       401:
 *         description: Unauthorized
 */
router.get('/showMyCart',getCurrentUserCart)

/**
 * @swagger
 * /cart/cartOP:
 *   patch:
 *     summary: Add to cart or update cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product to add/update
 *               quantity:
 *                 type: integer
 *                 description: Quantity to add/update
 *     responses:
 *       200:
 *         description: Cart updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch('/cartOP',addTOCart)

/**
 * @swagger
 * /cart/{id}:
 *   delete:
 *     summary: Clear cart or remove a cart item
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cart or cart item to remove
 *     responses:
 *       200:
 *         description: Cart cleared or item removed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
router.delete('/:id',clearCart)

module.exports = router;
