const express = require('express');
const router = express.Router();
const offerController = require('../controller/offer.controller');

router.get('/', offerController.getAllOffers);
router.post('/', offerController.createOffer);
router.put('/:id', offerController.updateOffer);
router.delete('/:id', offerController.deleteOffer);

module.exports = router; 