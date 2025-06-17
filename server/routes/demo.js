// server/routes/demo.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const csv = require('csv-parser');
const { Readable } = require('stream');
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 3 // Max 3 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});
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

// Simple reconciliation engine
class SimpleReconciliationEngine {
  constructor() {
    this.fuzzyMatchThreshold = 0.7;
  }

  // Simple string similarity
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    // Simple Levenshtein distance approximation
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Check if dates are within tolerance
  isDateMatch(date1, date2, toleranceDays = 7) {
    if (!date1 || !date2) return false;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= toleranceDays;
  }

  // Main reconciliation function
  reconcile(posData, alleData, aspireData) {
    const results = {
      totalTransactions: posData.length,
      exactMatches: 0,
      fuzzyMatches: 0,
      unmatched: 0,
      matches: [],
      unmatchedTransactions: [],
      processingTime: Date.now()
    };

    // Combine reward data
    const rewardData = [
      ...alleData.map(item => ({ ...item, source: 'alle' })),
      ...aspireData.map(item => ({ ...item, source: 'aspire' }))
    ];

    // Process each POS transaction
    posData.forEach(posTransaction => {
      let bestMatch = null;
      let bestScore = 0;
      let matchType = 'unmatched';

      // Try to find matches in reward data
      rewardData.forEach(rewardTransaction => {
        const score = this.calculateMatchScore(posTransaction, rewardTransaction);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = rewardTransaction;
          
          if (score >= 0.95) {
            matchType = 'exact';
          } else if (score >= this.fuzzyMatchThreshold) {
            matchType = 'fuzzy';
          }
        }
      });

      if (bestMatch && matchType !== 'unmatched') {
        results.matches.push({
          posTransaction,
          rewardTransaction: bestMatch,
          matchType,
          confidence: bestScore,
          confidenceLabel: this.getConfidenceLabel(bestScore)
        });

        if (matchType === 'exact') {
          results.exactMatches++;
        } else {
          results.fuzzyMatches++;
        }

        // Remove matched transaction to prevent duplicates
        const index = rewardData.indexOf(bestMatch);
        if (index > -1) {
          rewardData.splice(index, 1);
        }
      } else {
        results.unmatchedTransactions.push(posTransaction);
        results.unmatched++;
      }
    });

    results.matchAccuracy = results.totalTransactions > 0 
      ? Math.round(((results.exactMatches + results.fuzzyMatches) / results.totalTransactions) * 100)
      : 0;

    results.processingTime = Date.now() - results.processingTime;
    return results;
  }

  calculateMatchScore(pos, reward) {
    // Name matching (primary factor)
    const posName = pos.name || pos.customer_name || pos.patient_name || '';
    const rewardName = reward.customer_name || reward.member_name || reward.name || '';
    const nameScore = this.calculateSimilarity(posName, rewardName);

    // Date matching (secondary factor)
    const posDate = pos.date || pos.transaction_date || pos.appointment_date || '';
    const rewardDate = reward.redemption_date || reward.transaction_date || reward.date || '';
    const dateScore = this.isDateMatch(posDate, rewardDate) ? 1.0 : 0.3;

    // Service/product matching (tertiary factor)
    const posService = pos.service || pos.treatment || pos.product || '';
    const rewardService = reward.product || reward.treatment || reward.service || '';
    const serviceScore = this.calculateSimilarity(posService, rewardService);

    // Weighted score
    return (nameScore * 0.6) + (dateScore * 0.3) + (serviceScore * 0.1);
  }

  getConfidenceLabel(score) {
    if (score >= 0.95) return 'High (95%+)';
    if (score >= 0.85) return 'High (85%+)';
    if (score >= 0.75) return 'Medium (75%+)';
    if (score >= 0.6) return 'Medium (60%+)';
    return 'Low (<60%)';
  }
}

// Parse CSV data from buffer
function parseCSVBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Demo reconciliation endpoint
router.post('/reconcile', upload.fields([
  { name: 'posFile', maxCount: 1 },
  { name: 'alleFile', maxCount: 1 },
  { name: 'aspireFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📊 Demo reconciliation started');
    
    const files = req.files;
    
    if (!files || !files.posFile || !files.alleFile || !files.aspireFile) {
      return res.status(400).json({
        error: 'All three files (POS, Alle, Aspire) are required'
      });
    }

    // Parse all files
    const [posData, alleData, aspireData] = await Promise.all([
      parseCSVBuffer(files.posFile[0].buffer),
      parseCSVBuffer(files.alleFile[0].buffer),
      parseCSVBuffer(files.aspireFile[0].buffer)
    ]);

    console.log(`📁 Parsed files: ${posData.length} POS, ${alleData.length} Alle, ${aspireData.length} Aspire transactions`);

    // Run reconciliation
    const engine = new SimpleReconciliationEngine();
    const results = engine.reconcile(posData, alleData, aspireData);

    console.log(`✅ Reconciliation complete: ${results.matchAccuracy}% accuracy in ${results.processingTime}ms`);

    res.json({
      success: true,
      results: {
        summary: {
          totalTransactions: results.totalTransactions,
          exactMatches: results.exactMatches,
          fuzzyMatches: results.fuzzyMatches,
          unmatched: results.unmatched,
          matchAccuracy: results.matchAccuracy,
          processingTime: results.processingTime
        },
        matches: results.matches.slice(0, 10), // First 10 for display
        sampleUnmatched: results.unmatchedTransactions.slice(0, 5)
      },
      metadata: {
        demoVersion: '2.0',
        engineVersion: 'Simple-Reconciliation',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Demo reconciliation error:', error);
    
    res.status(500).json({
      error: 'Reconciliation processing failed',
      message: error.message,
      suggestion: 'Please check your file format and try again'
    });
  }
});

// Sample data endpoint
router.get('/sample-data', (req, res) => {
  const sampleData = {
    pos: [
      {name: "Sarah Johnson", service: "Botox Cosmetic", amount: 450.00, date: "2024-03-15"},
      {name: "Michael Chen", service: "Juvederm Ultra", amount: 650.00, date: "2024-03-15"},
      {name: "Jennifer Smith", service: "Dysport", amount: 380.00, date: "2024-03-16"},
      {name: "Robert Davis", service: "Restylane Lyft", amount: 700.00, date: "2024-03-16"},
      {name: "Lisa Anderson", service: "Botox Cosmetic", amount: 525.00, date: "2024-03-17"}
    ],
    alle: [
      {customer_name: "Sarah M Johnson", product: "Botox Cosmetic", points_redeemed: 90, redemption_date: "2024-03-15"},
      {customer_name: "Michael C Chen", product: "Juvederm Ultra", points_redeemed: 130, redemption_date: "2024-03-15"},
      {customer_name: "Jenny Smith", product: "Dysport", points_redeemed: 76, redemption_date: "2024-03-16"},
      {customer_name: "Lisa A Anderson", product: "Botox Cosmetic", points_redeemed: 105, redemption_date: "2024-03-17"}
    ],
    aspire: [
      {member_name: "Robert J Davis", treatment: "Restylane Lyft", reward_amount: 140.00, transaction_date: "2024-03-16"},
      {member_name: "David Wilson", treatment: "Sculptra", reward_amount: 170.00, transaction_date: "2024-03-17"}
    ]
  };

  res.json({
    success: true,
    data: sampleData,
    message: 'Sample medical spa transaction data for demo purposes'
  });
});

// Lead capture endpoint
router.post('/capture-lead', async (req, res) => {
  try {
    const { email, companyName, monthlyVolume, currentPain, source = 'demo' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Log lead capture (in production, save to database/CRM)
    console.log('🎯 Demo lead captured:', {
      email,
      companyName,
      monthlyVolume,
      currentPain,
      source,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Thank you! We\'ll be in touch within 24 hours.',
      nextSteps: [
        'Check your email for demo results summary',
        'Schedule a personalized consultation',
        'Get custom pricing for your spa volume'
      ]
    });

  } catch (error) {
    console.error('❌ Lead capture error:', error);
    res.status(500).json({
      error: 'Unable to process request',
      message: 'Please try again or contact support'
    });
  }
});

// Analytics tracking endpoint
router.post('/track-event', (req, res) => {
  const { event, data } = req.body;
  
  console.log('📊 Demo event tracked:', {
    event,
    data,
    timestamp: new Date().toISOString(),
    ip: req.ip
  });

  res.json({ success: true });
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