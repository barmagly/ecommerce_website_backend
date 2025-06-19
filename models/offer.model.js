const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  type: { type: String, enum: ['product', 'category'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'type' },
  discount: { type: Number, required: true },
  description: { type: String },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema); 