const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const plan = req.body.plan === 'professional' ? 'professional' : 'core';
    const priceId = plan === 'professional'
      ? process.env.STRIPE_PRODUCT_PRO
      : process.env.STRIPE_PRODUCT_CORE;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://billing.medspasyncpro.com/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://billing.medspasyncpro.com/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Stripe error' });
  }
});

module.exports = router;
