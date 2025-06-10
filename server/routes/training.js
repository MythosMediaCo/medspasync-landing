const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post('/training/upload', async (req, res) => {
  try {
    const { type, records } = req.body;
    if (!type || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const filename = path.join(__dirname, `../training_data/${type}-${Date.now()}.json`);
    fs.writeFileSync(filename, JSON.stringify(records, null, 2));
    res.json({ saved: true });
  } catch (err) {
    console.error('Training upload failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
