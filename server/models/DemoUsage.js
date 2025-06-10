const mongoose = require('mongoose');

const DemoUsageSchema = new mongoose.Schema({
  email: { type: String, required: true },
  ip: { type: String, required: true },
  count: { type: Number, default: 1 },
  maxAllowed: { type: Number, default: 7 },
  createdAt: { type: Date, default: Date.now }
});

DemoUsageSchema.index({ email: 1, ip: 1 }, { unique: true });

module.exports = mongoose.model('DemoUsage', DemoUsageSchema);
