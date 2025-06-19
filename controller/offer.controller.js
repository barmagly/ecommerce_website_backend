const Offer = require('../models/offer.model');

exports.getAllOffers = async (req, res) => {
  const offers = await Offer.find();
  res.json({ offers });
};

exports.createOffer = async (req, res) => {
  const offer = await Offer.create(req.body);
  res.status(201).json({ offer });
};

exports.updateOffer = async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ offer });
};

exports.deleteOffer = async (req, res) => {
  await Offer.findByIdAndDelete(req.params.id);
  res.json({ message: 'Offer deleted' });
}; 