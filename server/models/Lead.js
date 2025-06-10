const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  source: { type: String, default: 'demo' }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

LeadSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Lead', LeadSchema);
