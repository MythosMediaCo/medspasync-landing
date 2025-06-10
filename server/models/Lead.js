const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  source: { type: String, default: 'demo' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', LeadSchema);
