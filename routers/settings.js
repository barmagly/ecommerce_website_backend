const express = require('express');
const router = express.Router();
const { authorizeAdmin } = require('../middlewares/authrization');
const { isAuthenticated } = require('../middlewares/userauth');
const { getSettings, updateSettings, resetSettings } = require('../controllers/settings');

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get all settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Settings'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get('/', isAuthenticated, authorizeAdmin, getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Settings'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid settings data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.put('/', isAuthenticated, authorizeAdmin, updateSettings);

/**
 * @swagger
 * /api/settings/reset:
 *   post:
 *     summary: Reset settings to default
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post('/reset', isAuthenticated, authorizeAdmin, resetSettings);

module.exports = router; 