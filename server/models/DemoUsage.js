const mongoose = require('mongoose');

const DemoUsageSchema = new mongoose.Schema({
  email: { type: String, required: true },
  ip: { type: String, required: true },
  count: { type: Number, default: 1 },
  maxAllowed: { type: Number, default: 7 },

  // Optional: auto-expiry
  expiresAt: { type: Date, default: () => Date.now() + 30 * 24 * 60 * 60 * 1000 }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Prevent duplicate entries per email/IP combo
DemoUsageSchema.index({ email: 1, ip: 1 }, { unique: true });

// TTL index for cleanup (optional)
DemoUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('DemoUsage', DemoUsageSchema);
