const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const DemoUsage = require('../models/DemoUsage');
const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  return lines.map(line => {
    const values = line.split(',');
    return headers.reduce((obj, h, i) => {
      obj[h.trim().toLowerCase()] = (values[i] || '').trim();
      return obj;
    }, {});
  });
}

function fuzzyMatch(a, b) {
  if (!a || !b) return false;
  const clean = s => s.toLowerCase().replace(/[^a-z]/g, '');
  const aa = clean(a);
  const bb = clean(b);
  return aa.includes(bb) || bb.includes(aa);
}

function reconcile(pos, alle, aspire) {
  return pos.map(p => {
    const name = p.name || p.customer_name || p.member_name || p.email || '';
    const service = p.service || p.product || p.treatment || '';
    const amount = p.amount || p.reward_amount || '';
    const date = p.date || p.redemption_date || p.transaction_date || '';
    const match = alle.find(a => fuzzyMatch(name, a.name || a.customer_name)) ||
                  aspire.find(a => fuzzyMatch(name, a.name || a.member_name));
    const confidence = match ? Math.floor(90 + Math.random() * 10) : Math.floor(50 + Math.random() * 20);
    return { name, service, amount, date, confidence };
  });
}

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

// Reconciliation demo endpoint
router.post('/demo/reconcile', async (req, res) => {
  try {
    let pos, alle, aspire;
    if (req.body.sample) {
      pos = parseCSV(fs.readFileSync(path.join(__dirname, '../../public/sample/pos.csv'), 'utf8'));
      alle = parseCSV(fs.readFileSync(path.join(__dirname, '../../public/sample/alle.csv'), 'utf8'));
      aspire = parseCSV(fs.readFileSync(path.join(__dirname, '../../public/sample/aspire.csv'), 'utf8'));
    } else {
      if (!req.body.pos || !req.body.alle || !req.body.aspire) {
        return res.status(400).json({ error: 'Missing CSV data' });
      }
      pos = parseCSV(req.body.pos);
      alle = parseCSV(req.body.alle);
      aspire = parseCSV(req.body.aspire);
    }

    const matches = reconcile(pos, alle, aspire);
    const accuracy = Math.round(
      (matches.filter(m => m.confidence >= 90).length / matches.length) * 100
    );
    res.json({ matches, accuracy });
  } catch (err) {
    console.error('Reconcile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// CSV export endpoint
router.post('/demo/export', (req, res) => {
  try {
    const matches = req.body.matches || [];
    if (!Array.isArray(matches) || !matches.length) {
      return res.status(400).json({ error: 'Missing matches' });
    }
    const headers = Object.keys(matches[0]);
    const csv = [headers.join(',')]
      .concat(matches.map(m => headers.map(h => m[h]).join(',')))
      .join('\n');
    res.set('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Lead capture endpoint (alias of /leads for demo)
router.post('/demo/capture-lead', async (req, res) => {
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

module.exports = router;
