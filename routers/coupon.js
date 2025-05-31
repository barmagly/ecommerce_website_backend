const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/userauth');
const { authorizeAdmin } = require('../middlewares/authrization');
const {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} = require('../controller/coupon');

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       required:
 *         - code
 *         - discount
 *         - validFrom
 *         - validUntil
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         code:
 *           type: string
 *           description: Coupon code
 *         description:
 *           type: string
 *           description: Coupon description
 *         discount:
 *           type: number
 *           description: Discount percentage
 *         validFrom:
 *           type: string
 *           format: date-time
 *           description: Start date of coupon validity
 *         validUntil:
 *           type: string
 *           format: date-time
 *           description: End date of coupon validity
 *         minPurchase:
 *           type: number
 *           description: Minimum purchase amount required
 *         maxDiscount:
 *           type: number
 *           description: Maximum discount amount
 *         usageLimit:
 *           type: number
 *           description: Maximum number of times coupon can be used
 *         usedCount:
 *           type: number
 *           description: Number of times coupon has been used
 *         active:
 *           type: boolean
 *           description: Whether the coupon is active
 */

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Get all coupons (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized as admin
 *   post:
 *     summary: Create a new coupon (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discount
 *               - validFrom
 *               - validUntil
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               discount:
 *                 type: number
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               minPurchase:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               usageLimit:
 *                 type: number
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized as admin
 */

/**
 * @swagger
 * /api/coupons/validate/{code}:
 *   get:
 *     summary: Validate a coupon code
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon code
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Cart amount to validate against
 *     responses:
 *       200:
 *         description: Coupon validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                     discount:
 *                       type: number
 *                     message:
 *                       type: string
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Coupon not found
 */

/**
 * @swagger
 * /api/coupons/{id}:
 *   get:
 *     summary: Get coupon by ID (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Coupon not found
 *   patch:
 *     summary: Update coupon (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               discount:
 *                 type: number
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               minPurchase:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               usageLimit:
 *                 type: number
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Coupon not found
 *   delete:
 *     summary: Delete coupon (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       204:
 *         description: Coupon deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Coupon not found
 */

// Public routes
router.post('/validate', validateCoupon);

// Admin routes (requires both authentication and admin role)
router.use(isAuthenticated, authorizeAdmin);

router.get('/', getAllCoupons);
router.get('/:id', getCouponById);
router.post('/', createCoupon);
router.patch('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

module.exports = router;
