// server/routes/webhook.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const emailService = require('../services/emailService'); // Import email service

// Main webhook route
// This endpoint receives events from Stripe. The body is raw for signature verification.
router.post('/', async (req, res) => { // Made async to allow await for email service
  const sig = req.headers['stripe-signature'];
  let event;

  // 1. Verify Stripe Webhook Signature (CRITICAL SECURITY STEP)
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Raw body is required here
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // Your webhook secret from Stripe dashboard
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    // Respond with 400 to Stripe immediately if verification fails
    return res.status(400).send(`Webhook Error: Signature verification failed (${err.message})`);
  }

  // 2. Handle the Event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object; // Contains details about the completed checkout session
        console.log('Stripe Webhook: Checkout session completed:', session.id);

        // --- Fulfillment Logic ---
        // This is where you would:
        // 1. Provision the customer's access/subscription in your database.
        //    (e.g., Create a new user, update an existing user's subscription status)
        // 2. Grant access to paid features.
        // 3. Send confirmation emails.

        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name;
        const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : 'N/A'; // Convert cents to dollars
        const invoiceId = session.invoice || 'N/A'; // Invoice ID if applicable

        console.log(`Webhook: Processing subscription fulfillment for ${customerEmail}. Amount: $${amountTotal}`);

        // Example: Send welcome/payment confirmation email
        if (customerEmail && emailService.isConfigured) {
          try {
            await emailService.sendWelcomeEmail(customerEmail, customerName);
            console.log(`Webhook: Welcome email sent to ${customerEmail}`);
          } catch (emailErr) {
            console.error(`Webhook: Failed to send welcome email to ${customerEmail}:`, emailErr.message);
          }

          try {
            await emailService.sendPaymentNotification(customerEmail, {
              amount: amountTotal,
              status: 'success',
              invoiceId: invoiceId
            });
            console.log(`Webhook: Payment notification sent to ${customerEmail}`);
          } catch (emailErr) {
            console.error(`Webhook: Failed to send payment notification to ${customerEmail}:`, emailErr.message);
          }
        } else {
            console.warn(`Webhook: No email sent for session ${session.id}. Email service not configured or customer email missing.`);
        }
        break;

      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object;
        console.log('Stripe Webhook: Subscription canceled:', subscriptionDeleted.id);
        // Handle subscription cancellation in your database/system
        break;

      case 'invoice.payment_failed':
        const invoiceFailed = event.data.object;
        console.log('Stripe Webhook: Invoice payment failed:', invoiceFailed.id);
        // Handle failed payments (e.g., notify user, retry logic)
        break;

      // Add other event types as needed based on your Stripe integration
      default:
        console.log(`Stripe Webhook: Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing Stripe event ${event.type}:`, error);
    // Respond with 500 to Stripe so it retries the webhook
    return res.status(500).json({ error: 'Webhook handler failed during event processing.' });
  }

  // Respond to Stripe to acknowledge receipt of the event
  res.json({ received: true });
});

// --- Internal/Debugging Endpoints (MUST BE SECURED IN PRODUCTION) ---

// Placeholder middleware for authenticating internal health check/test endpoints
const authenticateInternal = (req, res, next) => {
  // In a real production environment:
  // 1. Use an API key: `req.headers['x-internal-api-key'] === process.env.INTERNAL_API_KEY`
  // 2. Or JWT verification: `jwt.verify(req.headers.authorization, process.env.JWT_SECRET)`
  // 3. Or IP Whitelisting: `req.ip` must be in an allowed list
  if (process.env.NODE_ENV === 'production') {
    if (!req.headers['x-internal-api-key'] || req.headers['x-internal-api-key'] !== process.env.INTERNAL_API_KEY) {
      console.warn('Unauthorized access attempt to internal webhook endpoint.');
      return res.status(401).json({ error: 'Unauthorized: Internal API key missing or invalid.' });
    }
  }
  next(); // Allow request to proceed
};

// GET /api/webhook/health - Health check endpoint for webhook service
router.get('/health', authenticateInternal, (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'webhook_receiver',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    stripe: {
      configured: !!process.env.STRIPE_SECRET_KEY, // Check if secret key is loaded
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET // Check if webhook secret is loaded
    }
  });
});

// GET /api/webhook/email-health - Check connection to email service
router.get('/email-health', authenticateInternal, async (req, res) => {
  try {
    const connectionTest = await emailService.testConnection(); // Test SMTP connection

    res.json({
      emailService: connectionTest.success ? 'healthy' : 'error',
      connectionTest, // Include details from the connection test
      configuration: { // Show non-sensitive config details
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER ? '✓ configured' : '✗ missing',
        pass: process.env.EMAIL_PASS ? '✓ configured' : '✗ missing',
        from: process.env.EMAIL_FROM
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during email health check:', error);
    res.status(500).json({
      success: false,
      error: `Failed to perform email health check: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/webhook/test-email - Send a test email (for internal debugging)
router.post('/test-email', authenticateInternal, async (req, res) => {
  try {
    const { email } = req.body; // Expect an email address in the request body

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address required for test.' });
    }

    const result = await emailService.sendTestEmail(email); // Send a test email via the service

    res.json(result); // Return the result of the email send operation
  } catch (error) {
    console.error('❌ Test email endpoint error:', error);
    res.status(500).json({ success: false, error: `Failed to send test email: ${error.message}` });
  }
});

module.exports = router;