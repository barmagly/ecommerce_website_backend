const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/userauth');
const { authorizeAdmin } = require('../middlewares/authrization');
const {
    createOrder,
    createOrderWithCart,
    getAllOrders,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    cancelOrder,
    sendOrderConfirmationEmail
} = require('../controller/order');
const upload = require('../middlewares/uploadMiddleware');
const PDFDocument = require('pdfkit');

// Order routes with file upload support
// Create order with image upload
router.post('/upload', isAuthenticated, upload.single('image'), createOrder);
// Create order from cart   
router.post('/', isAuthenticated, createOrderWithCart);
router.get('/', isAuthenticated, getAllOrders);
router.get('/:id', isAuthenticated, getOrderById);
router.get('/user/:userId', isAuthenticated, getUserOrders);
router.patch('/status/:id', isAuthenticated, authorizeAdmin, updateOrderStatus);
router.delete('/:id', isAuthenticated, authorizeAdmin, cancelOrder);
router.patch('/:id', isAuthenticated, updateOrderStatus);
router.post('/:id/send-confirmation-email', isAuthenticated, sendOrderConfirmationEmail);

// PDF Invoice endpoint
router.get('/:id/invoice-pdf', isAuthenticated, async (req, res) => {
  try {
    const Order = require('../models/order.model');
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send('Order not found');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${order._id}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('فاتورة الطلب', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`رقم الطلب: ${order._id}`);
    doc.text(`تاريخ الطلب: ${order.createdAt ? order.createdAt.toLocaleDateString('ar-EG') : ''}`);
    doc.text(`اسم العميل: ${order.name || ''}`);
    doc.text(`البريد الإلكتروني: ${order.email || ''}`);
    doc.text(`رقم الهاتف: ${order.phone || ''}`);
    doc.text(`العنوان: ${order.address || ''}`);
    doc.text(`المدينة: ${order.city || ''}`);
    doc.moveDown();

    doc.fontSize(16).text('المنتجات:', { underline: true });
    (order.cartItems || []).forEach((item, idx) => {
      doc.fontSize(12).text(
        `${idx + 1}. ${item.name} - الكمية: ${item.quantity} - السعر: ${item.price} - الإجمالي: ${item.price * item.quantity}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`الإجمالي: ${order.total} جنيه`);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في توليد الفاتورة');
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - product
 *         - quantity
 *         - price
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID
 *         quantity:
 *           type: number
 *           description: Quantity of the product
 *         price:
 *           type: number
 *           description: Price per unit
 *     Order:
 *       type: object
 *       required:
 *         - user
 *         - items
 *         - shippingAddress
 *         - total
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         user:
 *           type: string
 *           description: User ID
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         shippingAddress:
 *           type: object
 *           properties:
 *             details:
 *               type: string
 *             city:
 *               type: string
 *             postalCode:
 *               type: string
 *         total:
 *           type: number
 *           description: Total order amount
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
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
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized as admin
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - details
 *                   - city
 *                   - postalCode
 *                 properties:
 *                   details:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /api/orders/me:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
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
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Order not found
 *   patch:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (User only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, cancelled]
 *                 description: New order status (only confirmed or cancelled allowed for users)
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "تم تحديث حالة الطلب إلى: confirmed"
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request - Invalid status or order cannot be modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "يمكن تعديل الطلبات في حالة 'قيد الانتظار' فقط"
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - Order does not belong to user
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Order not found
 *       400:
 *         description: Order cannot be cancelled
 */

router.use(isAuthenticated);

router.get('/', authorizeAdmin, getAllOrders);

router.get('/:id', getOrderById);
router.get('/user/:userId', getUserOrders);
router.post('/', createOrder);
router.patch('/:id/cancel', cancelOrder);

router.patch('/:id/status', authorizeAdmin, updateOrderStatus);

router.patch('/orders/:id/cancel', cancelOrder);

module.exports = router;
