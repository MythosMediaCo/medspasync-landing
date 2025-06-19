const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'"
      ],
      connectSrc: [
        "'self'",
        "https://api.medspasyncpro.com"
      ],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'https://demo.medspasyncpro.com'],
  credentials: false
}));

// Health check endpoint (before other middleware)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    port: process.env.PORT || 5000,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Special handling for Stripe webhooks - raw body parser ONLY for webhook POST
app.use('/api/webhook', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') {
    // Only use raw body for actual Stripe webhooks
    bodyParser.raw({ type: 'application/json' })(req, res, next);
  } else {
    // Use JSON parser for other webhook endpoints
    express.json()(req, res, next);
  }
});

// Normal JSON parser for everything else
app.use(express.json({ limit: '2mb' }));

// Serve static demo frontend
app.use(express.static(path.join(__dirname, '../public'), { index: 'demo.html' }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/medspasync')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// API routes
try {
  app.use('/api', require('./routes/demo'));
  app.use('/api', require('./routes/training'));
  app.use('/api/checkout', require('./routes/checkout'));
  app.use('/api/webhook', require('./routes/webhook'));
  app.use('/api', require('./routes/reconciliation'));
} catch (error) {
  console.error('Error loading routes:', error.message);
}

// Error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`�� Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Demo available at: http://localhost:${PORT}`);
});
