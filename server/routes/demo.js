/* Fixed server/routes/demo.js - No Duplicate Declarations */

const express = require('express');
const multer = require('multer');
const path = require('path'); // ✅ Single declaration of path
const fs = require('fs').promises;
const csv = require('csv-parser');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for demo endpoints
const demoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 demo requests per windowMs
  message: {
    error: 'Too many demo requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 3 // Maximum 3 files (POS, Allé, Aspire)
  },
  fileFilter: (req, file, cb) => {
    // Only allow CSV and TXT files
    const allowedMimes = ['text/csv', 'text/plain', 'application/csv'];
    const allowedExts = ['.csv', '.txt'];
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    const isValidExt = allowedExts.includes(fileExt);
    const isValidMime = allowedMimes.includes(file.mimetype);
    
    if (isValidExt && isValidMime) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only CSV and TXT files are allowed. Received: ${file.mimetype}`), false);
    }
  }
});

// Validation middleware
const validateDemoRequest = [
  body('email').optional().isEmail().normalizeEmail(),
  body('practice_name').optional().trim().isLength({ max: 100 }),
  body('demo_type').optional().isIn(['sample', 'upload']),
];

// Sample data for demo purposes
const sampleData = {
  pos: `name,service,amount,date,location_id,staff_member
"Sarah Johnson","Botox Cosmetic",450.00,"2024-03-15","LOC001","Dr. Smith"
"Michael Chen","Juvederm Ultra",650.00,"2024-03-15","LOC001","Dr. Johnson"
"Jennifer Smith","Dysport",380.00,"2024-03-16","LOC002","Dr. Smith"
"Robert Davis","Restylane Lyft",700.00,"2024-03-16","LOC001","Dr. Johnson"
"Lisa Anderson","Botox Cosmetic",525.00,"2024-03-17","LOC001","Dr. Smith"
"Amanda Taylor","Juvederm Voluma",720.00,"2024-03-18","LOC002","Dr. Johnson"`,
  
  alle: `customer_name,product,points_redeemed,redemption_date,member_id,clinic_code
"Sarah M Johnson","Botox Cosmetic",90,"2024-03-15","ALL001","CLI001"
"Michael C Chen","Juvederm Ultra",130,"2024-03-15","ALL002","CLI001"
"Jenny Smith","Dysport",76,"2024-03-16","ALL003","CLI002"
"Lisa A Anderson","Botox Cosmetic",105,"2024-03-17","ALL004","CLI001"
"Amanda M Taylor","Juvederm Voluma",144,"2024-03-18","ALL005","CLI002"`,
  
  aspire: `member_name,treatment,reward_amount,transaction_date,account_id,provider_code
"Robert J Davis","Restylane Lyft",140.00,"2024-03-16","ASP001","PRV001"
"David R Williams","Radiesse",96.00,"2024-03-19","ASP002","PRV001"
"Emma J Thompson","Belotero Balance",84.00,"2024-03-20","ASP003","PRV002"`
};

// Helper function to parse CSV data
function parseCSVData(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  
  return { headers, data };
}

// Simulate AI reconciliation processing
function simulateReconciliation(posData, alleData, aspireData) {
  const totalTransactions = posData.data.length;
  const exactMatches = Math.floor(totalTransactions * 0.7);
  const fuzzyMatches = Math.floor(totalTransactions * 0.2);
  const unmatched = totalTransactions - exactMatches - fuzzyMatches;
  const accuracy = Math.round(((exactMatches + fuzzyMatches) / totalTransactions) * 100);
  
  // Generate sample matches
  const matches = posData.data.slice(0, Math.min(exactMatches + fuzzyMatches, 5)).map((transaction, index) => ({
    id: `match_${index + 1}`,
    customer_name: transaction.name,
    service: transaction.service,
    amount: parseFloat(transaction.amount) || 0,
    date: transaction.date,
    confidence: Math.floor(Math.random() * 15) + 85, // 85-100%
    match_type: index < exactMatches ? 'exact' : 'fuzzy',
    reward_program: index % 2 === 0 ? 'Allé' : 'Aspire',
    points_redeemed: Math.floor(Math.random() * 50) + 20
  }));
  
  return {
    success: true,
    total_transactions: totalTransactions,
    exact_matches: exactMatches,
    fuzzy_matches: fuzzyMatches,
    unmatched_transactions: unmatched,
    accuracy_percentage: Math.max(85, Math.min(96, accuracy)),
    processing_time_ms: 2500 + Math.random() * 2000,
    matches: matches,
    metadata: {
      processed_at: new Date().toISOString(),
      algorithm_version: 'v4.2.1',
      confidence_threshold: 0.75
    }
  };
}

// POST /api/demo/reconcile - Main reconciliation endpoint
router.post('/reconcile', demoRateLimit, upload.fields([
  { name: 'pos_file', maxCount: 1 },
  { name: 'alle_file', maxCount: 1 },
  { name: 'aspire_file', maxCount: 1 }
]), validateDemoRequest, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { demo_type = 'sample' } = req.body;
    let posData, alleData, aspireData;

    if (demo_type === 'sample') {
      // Use sample data
      posData = parseCSVData(sampleData.pos);
      alleData = parseCSVData(sampleData.alle);
      aspireData = parseCSVData(sampleData.aspire);
    } else {
      // Process uploaded files
      if (!req.files || !req.files.pos_file || !req.files.alle_file) {
        return res.status(400).json({
          success: false,
          error: 'Missing required files. POS and Allé files are required, Aspire is optional.'
        });
      }

      try {
        posData = parseCSVData(req.files.pos_file[0].buffer.toString('utf8'));
        alleData = parseCSVData(req.files.alle_file[0].buffer.toString('utf8'));
        aspireData = req.files.aspire_file 
          ? parseCSVData(req.files.aspire_file[0].buffer.toString('utf8'))
          : { headers: [], data: [] };
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Failed to parse CSV files',
          details: parseError.message
        });
      }
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Run reconciliation
    const results = simulateReconciliation(posData, alleData, aspireData);

    // Log demo usage (in production, save to database)
    console.log(`Demo reconciliation completed: ${results.total_transactions} transactions, ${results.accuracy_percentage}% accuracy`);

    res.json(results);

  } catch (error) {
    console.error('Demo reconciliation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during reconciliation',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// POST /api/demo/sample-data - Get sample data for download
router.post('/sample-data', demoRateLimit, (req, res) => {
  try {
    const { file_type } = req.body;
    
    if (!file_type || !sampleData[file_type]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Must be one of: pos, alle, aspire'
      });
    }

    const filename = `sample_${file_type}_data.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sampleData[file_type]);

  } catch (error) {
    console.error('Sample data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sample data'
    });
  }
});

// POST /api/demo/export - Export reconciliation results
router.post('/export', demoRateLimit, [
  body('results').isObject(),
  body('format').optional().isIn(['csv', 'xlsx']).default('csv')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { results, format = 'csv' } = req.body;
    
    if (!results || !results.matches) {
      return res.status(400).json({
        success: false,
        error: 'No reconciliation results provided'
      });
    }

    // Generate CSV export
    const headers = ['Customer Name', 'Service', 'Date', 'Amount', 'Match Type', 'Confidence', 'Reward Program'];
    const csvRows = [
      ['MedSpaSync Pro Reconciliation Report'],
      [`Generated: ${new Date().toISOString()}`],
      [`Total Transactions: ${results.total_transactions}`],
      [`Accuracy: ${results.accuracy_percentage}%`],
      [''],
      headers
    ];

    results.matches.forEach(match => {
      csvRows.push([
        match.customer_name,
        match.service,
        match.date,
        `$${match.amount.toFixed(2)}`,
        match.match_type.charAt(0).toUpperCase() + match.match_type.slice(1),
        `${match.confidence}%`,
        match.reward_program
      ]);
    });

    const csvContent = csvRows.map(row => 
      row.map(field => 
        typeof field === 'string' && (field.includes(',') || field.includes('"')) 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(',')
    ).join('\n');

    const filename = `medspasync-reconciliation-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export results'
    });
  }
});

// GET /api/demo/status - Health check for demo API
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware specific to demo routes
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 3 files.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  console.error('Demo route error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
  });
});

module.exports = router;