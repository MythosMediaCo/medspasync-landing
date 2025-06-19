const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Main webhook route
router.post('/', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    console.log('Checkout completed:', event.data.object.id);
  } else {
    console.log(`Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'webhook',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    stripe: {
      configured: !!process.env.STRIPE_SECRET_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
    }
  });
});

// Email health check with real connection test
router.get('/email-health', async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    const connectionTest = await emailService.testConnection();
    
    res.json({
      emailService: connectionTest.success ? 'healthy' : 'error',
      connectionTest,
      configuration: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER ? '✓ configured' : '✗ missing',
        pass: process.env.EMAIL_PASS ? '✓ configured' : '✗ missing',
        from: process.env.EMAIL_FROM
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Send REAL test email via Mailgun
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const emailService = require('../services/emailService');
    const result = await emailService.sendTestEmail(email);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
