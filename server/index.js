// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser'); // For specific raw body parsing
const config = require('../config'); // Import configuration
require('dotenv').config(); // Load environment variables from .env file
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('Backend API URL:', config.backend.baseUrl);

const app = express();

// --- Security Middleware ---
// Helmet helps secure Express apps by setting various HTTP headers.
app.use(helmet({
  // Configure Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Only allow resources from the same origin by default
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",     // Required for some inline scripts (e.g., React's __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED)
        "https://unpkg.com",   // For React/ReactDOM CDN
        "https://cdnjs.cloudflare.com", // If you use this for other libraries
        "https://js.stripe.com" // Essential for Stripe's JavaScript (e.g., Elements, Checkout)
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'"      // Required for inline styles or Tailwind JIT output
      ],
      connectSrc: [
        "'self'",
        process.env.API_BASE_URL || "https://api.medspasyncpro.com", // Your own API base URL
        "https://billing.stripe.com",  // Stripe billing portal
        "https://api.stripe.com",      // Stripe API calls
        "https://checkout.stripe.com", // Stripe Checkout pages
        "https://q.stripe.com"         // Stripe's telemetry/analytics domain
      ],
      fontSrc: ["'self'", "https:", "data:"], // Allow self-hosted fonts and potentially data URIs for fonts
      imgSrc: ["'self'", "data:", "https://status.medspasyncpro.com", "https://*.stripe.com"], // Allow images from self, data URIs, and status page/Stripe
      objectSrc: ["'none'"],       // Disallow <object>, <embed>, <applet> elements
      mediaSrc: ["'self'"],        // Allow media from same origin
      frameSrc: ["'none'", "https://checkout.stripe.com", "https://js.stripe.com"], // Allow Stripe iframes
    },
  },
  // Disable HSTS for localhost/development to avoid issues during local development
  hsts: process.env.NODE_ENV === 'development' ? false : true,
}));

// CORS configuration for cross-origin requests
app.use(cors({
  origin: [
    'http://localhost:3000', // Your local frontend dev server (if applicable)
    'http://localhost:5000', // Your local server itself
    'https://demo.medspasyncpro.com' // Your production demo domain
  ],
  credentials: true // Allow cookies/authorization headers if used by frontend
}));

// --- Health Check Endpoint (before other middleware for quick response) ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- Body Parsers ---
// Special handling for Stripe webhooks - raw body parser ONLY for webhook POST
// Stripe sends a raw body that needs to be verified with a signature.
app.use('/api/webhook', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') {
    bodyParser.raw({ type: 'application/json' })(req, res, next);
  } else {
    // For other /api/webhook GET/POST endpoints (like health checks or test emails), use JSON parser
    express.json()(req, res, next);
  }
});

// Normal JSON parser for all other routes (e.g., /api/lead, /api/checkout)
app.use(express.json({ limit: '2mb' })); // Limit JSON payload size to 2MB

// --- Serve Static Frontend Files ---
// // Serves files from the 'public' directory, and defaults to 'index.html' if a directory is requested.
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, '../public');
app.use(express.static(PUBLIC_DIR, { index: 'index.html' }));
app.use(express.static(path.join(__dirname, '../public'), { index: 'index.html' }));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/medspasync_db') // Added '_db' for clarity
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- API Routes ---
// Mount your API route modules here
try {
  app.use('/api', require('./routes/Lead'));        // Handles /api/lead (new lead capture)
  app.use('/api/checkout', require('./routes/checkout')); // Handles /api/checkout/create-checkout-session
  app.use('/api/webhook', require('./routes/webhook')); // Handles Stripe webhooks and internal health checks
  app.use('/api', require('./routes/training'));    // Handles /api/training/upload
  
  // Proxy reconciliation API calls to backend
  app.use('/api/reconciliation', async (req, res, next) => {
    try {
      const backendUrl = `${config.backend.baseUrl}${req.path}`;
      console.log(`🔄 Proxying to backend: ${backendUrl}`);
      
      // Forward the request to backend
      const response = await fetch(backendUrl, {
        method: req.method,
        headers: {
          'Content-Type': req.get('Content-Type') || 'application/json',
          ...req.headers
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Backend proxy error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Backend service unavailable',
        message: 'Please try again later or contact support.'
      });
    }
  });
  
} catch (error) {
  console.error('Error loading API routes:', error.message);
}

// --- Global Error Handler (Catch-all for unhandled errors) ---
// This middleware catches any errors that occur in route handlers or other middleware.
app.use((err, req, res, next) => {
  console.error('🔥 Global Error Handler Caught Error:', err.stack); // Log full stack trace for debugging
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected server error occurred.',
    // Only send detailed error message in development environment
    message: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✨ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Demo Frontend: http://localhost:${PORT}`);
});