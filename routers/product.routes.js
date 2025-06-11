const express = require('express');
const productController = require('../controller/product.controller');
const variantController = require('../controller/variant.controller');
const { verifyToken, isAdmin, isAuthenticated } = require('../middlewares/userauth');
const { authorizeAdmin } = require('../middlewares/authrization');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/products/new-arrivals:
 *   get:
 *     summary: Get 4 newest products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Successfully retrieved new arrivals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/new-arrivals', productController.getNewArrivals);

/**
 * @swagger
 * /api/products/best-sellers:
 *   get:
 *     summary: Get 4 best selling products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Successfully retrieved best sellers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/best-sellers', productController.getBestSellers);

/**
 * @swagger
 * /api/products/most-reviewed:
 *   get:
 *     summary: Get 4 most reviewed products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Successfully retrieved most reviewed products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/most-reviewed', productController.getMostReviewed);

/**
 * @swagger
 * components:
 *   schemas:
 *     Variant:
 *       type: object
 *       required:
 *         - sku
 *         - price
 *         - quantity
 *       properties:
 *         sku:
 *           type: string
 *           description: Unique SKU for the variant
 *         color:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             code:
 *               type: string
 *         size:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             code:
 *               type: string
 *         price:
 *           type: number
 *         quantity:
 *           type: number
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               alt:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - brand
 *         - category
 *         - price
 *         - imageCover
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         brand:
 *           type: string
 *         category:
 *           type: string
 *         price:
 *           type: number
 *         options:
 *           type: object
 *           properties:
 *             colors:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   code:
 *                     type: string
 *             sizes:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   code:
 *                     type: string
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Variant'
 */


/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: number
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/products/filter:
 *   get:
 *     summary: Filter products based on various criteria
 *     description: Filter products by price range, category, stock status, rating, and search text
 *     parameters:
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock status
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field(s), e.g., 'price,-createdAt'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Successfully filtered products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
*/
router.get('/filter', productController.filterProducts);
router.get('/category/:id',productController.getCategoryProducts)

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', productController.getProduct);


/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.post('/', isAuthenticated, authorizeAdmin, upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 5 }
]), productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router
    .route('/:id')
    .patch(
        isAuthenticated,
        authorizeAdmin,
        upload.fields([
            { name: 'imageCover', maxCount: 1 },
            { name: 'images', maxCount: 5 }
        ]),
        productController.updateProduct
    )
    .delete(isAuthenticated, authorizeAdmin, productController.deleteProduct);

/**
 * @swagger
 * /api/products/{productId}/variants:
 *   get:
 *     summary: Get all variants of a product
 *     tags: [Variants]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of variants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     variants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Variant'
 *   post:
 *     summary: Add a new variant to a product
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Variant'
 *     responses:
 *       201:
 *         description: Variant added successfully
 */
router.route('/:productId/variants')
    .post(
        isAuthenticated,
        authorizeAdmin,
        upload.fields([
            { name: 'images', maxCount: 5 }
        ]),
        variantController.addVariant
    );
router.route('/:productId/variants').get(variantController.getVariants);

/**
 * @swagger
 * /api/products/{productId}/variants/{variantId}:
 *   patch:
 *     summary: Update a variant
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Variant'
 *     responses:
 *       200:
 *         description: Variant updated successfully
 *   delete:
 *     summary: Delete a variant
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Variant deleted successfully
 */
router
    .route('/:productId/variants/:variantId')
    .patch(
        isAuthenticated,
        authorizeAdmin,
        upload.fields([
            { name: 'images', maxCount: 5 }
        ]),
        variantController.updateVariant
    )
    .delete(isAuthenticated, authorizeAdmin, variantController.deleteVariant);

/**
 * @swagger
 * /api/products/{productId}/variants/{variantId}/stock:
 *   patch:
 *     summary: Update variant stock quantity
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Invalid quantity
 */
router.patch('/:productId/variants/:variantId/stock', isAuthenticated, authorizeAdmin, variantController.updateStock);

module.exports = router;