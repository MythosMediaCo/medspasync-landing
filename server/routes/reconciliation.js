const express = require('express');
const router = express.Router();

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  return lines.map(line => {
    const values = line.split(',');
    return headers.reduce((obj, h, i) => {
      obj[h.trim()] = (values[i] || '').trim();
      return obj;
    }, {});
  });
}

router.post('/reconciliation/demo', async (req, res) => {
  try {
    const { pos, rewards, email } = req.body || {};
    if (!pos || !rewards) {
      return res.status(400).json({ error: 'Missing CSV data' });
    }
    // parse to validate
    const posRecords = parseCSV(pos);
    const rewardRecords = parseCSV(rewards);
    res.json({ received: true });
  } catch (err) {
    console.error('Reconciliation endpoint error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
