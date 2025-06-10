const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const DemoUsage = require('../models/DemoUsage');

// ✅ Lead capture with upsert
router.post('/leads', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    await Lead.updateOne(
      { email },
      { $setOnInsert: { name, source: 'demo' } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Lead error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Demo abuse prevention
router.post('/demo/track', async (req, res) => {
  try {
    const email = req.body.email;
    const ip = req.ip || req.headers['x-forwarded-for'];

    if (!email || !ip) {
      return res.status(400).json({ error: 'Missing email or IP' });
    }

    let record = await DemoUsage.findOne({ email, ip });

    if (!record) {
      await DemoUsage.create({ email, ip });
      return res.json({ blocked: false, remaining: 6 });
    }

    if (record.count >= record.maxAllowed) {
      return res.json({ blocked: true });
    }

    record.count += 1;
    await record.save();
    res.json({ blocked: false, remaining: record.maxAllowed - record.count });

  } catch (err) {
    console.error('Demo tracking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
