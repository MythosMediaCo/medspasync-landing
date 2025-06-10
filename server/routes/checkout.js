const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/start', async (req, res) => {
  try {
    const tier = req.body.tier || 'core';
    const priceId = tier === 'professional'
      ? process.env.STRIPE_PRODUCT_PRO
      : process.env.STRIPE_PRODUCT_CORE;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}?checkout=success`,
      cancel_url: `${process.env.FRONTEND_URL}?checkout=cancel`
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Stripe error' });
  }
});

module.exports = router;
