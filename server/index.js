const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load .env variables

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://demo.medspasyncpro.com'],
  credentials: false
}));

// Stripe requires raw body for webhook validation — mount BEFORE express.json()
app.use('/api/webhook', bodyParser.raw({ type: 'application/json' }));

// Normal JSON parser for everything else
app.use(express.json({ limit: '2mb' }));

// Serve static demo frontend
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/medspasync', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// API routes
app.use('/api', require('./routes/demo'));
app.use('/api', require('./routes/training'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api', require('./routes/reconciliation'));

// Catch unhandled errors
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({ error: 'Unexpected server error' });
});

// Launch server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
