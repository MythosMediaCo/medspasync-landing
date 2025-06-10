const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const DemoUsage = require('../models/DemoUsage');

router.post('/leads', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    await Lead.create({ email, name, source: 'demo' });
    res.json({ success: true });
  } catch (err) {
    console.error('Lead error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/demo/track', async (req, res) => {
  const email = req.body.email;
  const ip = req.ip || req.headers['x-forwarded-for'];

  if (!email || !ip) return res.status(400).json({ error: 'Missing email or IP' });

  let record = await DemoUsage.findOne({ email, ip });
  if (!record) {
    record = await DemoUsage.create({ email, ip, count: 1 });
    return res.json({ blocked: false, remaining: 6 });
  }

  if (record.count >= record.maxAllowed) {
    return res.json({ blocked: true });
  }

  record.count += 1;
  await record.save();
  res.json({ blocked: false, remaining: record.maxAllowed - record.count });
});

module.exports = router;
