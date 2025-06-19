/* Updated server/routes/demo.js */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // Use promises version of fs
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for demo endpoints
const demoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 demo requests per windowMs
  message: {
    success: false,
    error: 'Too many demo requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Add `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
});

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory (suitable for small demo files)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 3 // Maximum 3 files total for the request (pos, alle, aspire)
  },
  fileFilter: (req, file, cb) => {
    // Only allow CSV and TXT files
    const allowedMimes = ['text/csv', 'application/csv', 'text/plain']; // application/csv is often used
    const allowedExts = ['.csv', '.txt'];

    const fileExt = path.extname(file.originalname).toLowerCase();
    const isValidExt = allowedExts.includes(fileExt);
    const isValidMime = allowedMimes.includes(file.mimetype);

    if (isValidExt && isValidMime) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error(`Invalid file type. Only CSV and TXT files are allowed. Received: ${file.mimetype}`), false);
    }
  }
});

// Validation middleware for /api/reconcile endpoint
const validateReconcileRequest = [
  // Validate demo_type
  body('demo_type').optional().isIn(['sample', 'upload']).withMessage('Invalid demo type specified. Must be "sample" or "upload".'),
  // Validate sample types if demo_type is 'sample'
  body('pos_sample_type').optional().isString().withMessage('POS sample type must be a string.'),
  body('loyalty_sample_type').optional().isString().withMessage('Loyalty sample type must be a string.'),
  // Validate user info if sent (for logging/usage tracking)
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email format.'),
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name too long.')
];

// Sample data for demo purposes (now explicitly in server/routes/demo.js)
const sampleData = {
  pos: `name,service,amount,date,location_id,staff_member
"Sarah Johnson","Botox Cosmetic",450.00,"2024-03-15","LOC001","Dr. Smith"
"Michael Chen","Juvederm Ultra",650.00,"2024-03-15","LOC001","Dr. Johnson"
"Jennifer Smith","Dysport",380.00,"2024-03-16","LOC002","Dr. Smith"
"Robert Davis","Restylane Lyft",700.00,"2024-03-16","LOC001","Dr. Johnson"
"Lisa Anderson","Botox Cosmetic",525.00,"2024-03-17","LOC001","Dr. Smith"
"Amanda Taylor","Juvederm Voluma",720.00,"2024-03-18","LOC002","Dr. Johnson"
"David Williams","Sculptra",800.00,"2024-03-19","LOC001","Dr. Smith"
"Jessica Brown","Kybella",950.00,"2024-03-20","LOC002","Dr. Johnson"
"Daniel Miller","Radiesse",750.00,"2024-03-21","LOC001","Dr. Smith"
"Olivia Wilson","Botox Cosmetic",480.00,"2024-03-22","LOC002","Dr. Johnson"
"James Moore","Juvederm Volbella",600.00,"2024-03-23","LOC001","Dr. Smith"
"Sophia Garcia","Dysport",420.00,"2024-03-24","LOC002","Dr. Johnson"
"Liam Rodriguez","Restylane Silk",620.00,"2024-03-25","LOC001","Dr. Smith"
"Emma Davis","Botox Cosmetic",490.00,"2024-03-26","LOC002","Dr. Johnson"
"Noah Martinez","Juvederm Ultra Plus",780.00,"2024-03-27","LOC001","Dr. Smith"`,

  alle: `customer_name,product,points_redeemed,redemption_date,member_id,clinic_code
"Sarah M Johnson","Botox Cosmetic",90,"2024-03-15","ALL001","CLI001"
"Michael C Chen","Juvederm Ultra",130,"2024-03-15","ALL002","CLI001"
"Jenny Smith","Dysport",76,"2024-03-16","ALL003","CLI002"
"Lisa A Anderson","Botox Cosmetic",105,"2024-03-17","ALL004","CLI001"
"Amanda M Taylor","Juvederm Voluma",144,"2024-03-18","ALL005","CLI002"
"David R Williams","Sculptra",160,"2024-03-19","ALL006","CLI001"
"Jessica L Brown","Kybella",190,"2024-03-20","ALL007","CLI002"
"Daniel J Miller","Radiesse",150,"2024-03-21","ALL008","CLI001"
"Olivia K Wilson","Botox Cosmetic",96,"2024-03-22","ALL009","CLI002"
"James P Moore","Juvederm Volbella",120,"2024-03-23","ALL010","CLI001"`,

  aspire: `member_name,treatment,reward_amount,transaction_date,account_id,provider_code
"Robert J Davis","Restylane Lyft",140.00,"2024-03-16","ASP001","PRV001"
"David R Williams","Radiesse",96.00,"2024-03-19","ASP002","PRV001"
"Emma J Thompson","Belotero Balance",84.00,"2024-03-20","ASP003","PRV002"
"Sophia Garcia","Botox",98.00,"2024-03-24","ASP004","PRV001"
"Liam Rodriguez","Restylane Silk",124.00,"2024-03-25","ASP005","PRV002"
"Emma Davis","Dysport",98.00,"2024-03-26","ASP006","PRV001"`
};


// Helper function to parse CSV data (shared with frontend, but re-implemented here to avoid dependency issues)
function parseCSVData(csvString) {
  const lines = csvString.trim().split(/\r?\n/);
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

/**
 * Simulates AI reconciliation processing.
 * This function generates mock reconciliation results based on input data length.
 * In a real application, this would involve a complex AI/ML model.
 * @param {object} posData - Parsed POS CSV data { headers, data }.
 * @param {object} alleData - Parsed Allé CSV data { headers, data }.
 * @param {object} aspireData - Parsed Aspire CSV data { headers, data }.
 * @returns {object} Mock reconciliation results.
 */
function simulateReconciliation(posData, alleData, aspireData) {
  const totalPosTransactions = posData.data.length;
  const totalLoyaltyTransactions = alleData.data.length + aspireData.data.length;
  const totalTransactions = Math.max(totalPosTransactions, totalLoyaltyTransactions, 20); // Ensure a reasonable total for demo

  // Realistic match rates
  const baseMatchRate = 0.78 + Math.random() * 0.17; // 78-95%
  const exactMatches = Math.floor(totalTransactions * baseMatchRate * 0.8); // 80% of matches are exact
  const fuzzyMatches = Math.floor(totalTransactions * baseMatchRate * 0.2); // 20% of matches are fuzzy
  const matchedTotal = exactMatches + fuzzyMatches;
  const unmatched = totalTransactions - matchedTotal;

  const accuracyPercentage = Math.max(85, Math.min(98, Math.round(baseMatchRate * 100))); // Cap accuracy for demo

  // Generate sample matches - these would be derived from real reconciliation results
  const matches = [];
  const allLoyaltyData = [...alleData.data, ...aspireData.data];

  for(let i = 0; i < Math.min(matchedTotal, totalPosTransactions, allLoyaltyData.length); i++) {
    const posRecord = posData.data[i];
    const loyaltyRecord = allLoyaltyData[i];
    matches.push({
      id: `match_${i + 1}`,
      customer_name: posRecord?.name || loyaltyRecord?.customer_name || `Customer ${i + 1}`,
      service: posRecord?.service || loyaltyRecord?.product || loyaltyRecord?.treatment || `Service ${i + 1}`,
      amount: parseFloat(posRecord?.amount) || parseFloat(loyaltyRecord?.amount) || (150 + Math.floor(Math.random() * 100)),
      date: posRecord?.date || loyaltyRecord?.redemption_date || loyaltyRecord?.transaction_date || `2024-0${Math.floor(Math.random() * 3) + 1}-15`,
      confidence: Math.floor(Math.random() * 15) + 85, // 85-100% confidence
      match_type: i < exactMatches ? 'exact' : 'fuzzy',
      reward_program: i % 2 === 0 ? 'Allé' : 'Aspire',
      points_redeemed: parseFloat(loyaltyRecord?.points_redeemed || loyaltyRecord?.reward_amount) || (Math.floor(Math.random() * 50) + 20)
    });
  }


  return {
    success: true, // Indicate successful operation
    total_transactions: totalTransactions,
    exact_matches: exactMatches,
    fuzzy_matches: fuzzyMatches,
    unmatched_transactions: unmatched,
    accuracy_percentage: accuracyPercentage,
    processing_time_ms: 2500 + Math.random() * 2000, // Simulated processing time
    matches: matches, // Detailed matches (for export)
    metadata: {
      processed_at: new Date().toISOString(),
      algorithm_version: 'v4.2.1', // Placeholder AI version
      confidence_threshold: 0.75   // Placeholder threshold
    }
  };
}


// POST /api/reconcile - Main reconciliation endpoint
// This endpoint now handles both file uploads and 'sample' type requests from the frontend.
router.post('/reconcile', demoRateLimit, upload.fields([
  { name: 'pos_file', maxCount: 1 },    // Actual POS file upload
  { name: 'loyalty_file', maxCount: 1 } // Actual Loyalty file upload (can be Alle or Aspire)
]), validateReconcileRequest, async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { demo_type = 'upload', email, name } = req.body; // Default demo_type to 'upload'

    let posData = { headers: [], data: [] };
    let alleData = { headers: [], data: [] };
    let aspireData = { headers: [], data: [] };

    if (demo_type === 'sample') {
      // Use server-side sample data based on frontend flags/content
      const { pos_sample_type, loyalty_sample_type, pos_content, loyalty_content } = req.body;

      if (pos_content) {
        posData = parseCSVData(pos_content);
      } else if (pos_sample_type === 'pos') { // Fallback if content wasn't sent but type was
        posData = parseCSVData(sampleData.pos);
      }

      if (loyalty_content) {
        // Frontend sends generic 'loyalty_content', so we distinguish via loyalty_sample_type
        if (loyalty_sample_type === 'alle') {
          alleData = parseCSVData(loyalty_content);
        } else if (loyalty_sample_type === 'aspire') {
          aspireData = parseCSVData(loyalty_content);
        } else {
            // Default to Alle if no specific loyalty type is identified but content is present
            alleData = parseCSVData(loyalty_content);
        }
      } else if (loyalty_sample_type === 'alle') { // Fallback if content wasn't sent but type was
        alleData = parseCSVData(sampleData.alle);
      } else if (loyalty_sample_type === 'aspire') {
        aspireData = parseCSVData(sampleData.aspire);
      }

      // Ensure we have at least data for reconciliation
      if (posData.data.length === 0 || (alleData.data.length === 0 && aspireData.data.length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'For sample demos, please ensure both POS and at least one Loyalty sample are provided (or files uploaded).'
        });
      }

    } else { // demo_type is 'upload' (actual file uploads)
      // Check for required file uploads
      if (!req.files || !req.files.pos_file || !req.files.loyalty_file) {
        return res.status(400).json({
          success: false,
          error: 'Missing required files for upload. Please provide POS and Loyalty (Allé/Aspire) files.'
        });
      }

      try {
        posData = parseCSVData(req.files.pos_file[0].buffer.toString('utf8'));
        // Determine if loyalty file is Alle or Aspire based on original name or heuristic
        const loyaltyFileName = req.files.loyalty_file[0].originalname.toLowerCase();
        if (loyaltyFileName.includes('alle')) {
            alleData = parseCSVData(req.files.loyalty_file[0].buffer.toString('utf8'));
        } else if (loyaltyFileName.includes('aspire')) {
            aspireData = parseCSVData(req.files.loyalty_file[0].buffer.toString('utf8'));
        } else {
            // Default to Alle if not explicitly named
            alleData = parseCSVData(req.files.loyalty_file[0].buffer.toString('utf8'));
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Failed to parse one or more uploaded CSV files.',
          details: parseError.message
        });
      }
    }

    // Simulate backend processing delay (for realism)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Base 2 seconds

    // Perform simulated reconciliation
    const results = simulateReconciliation(posData, alleData, aspireData);

    // Log demo usage and user info (for backend tracking / CRM integration)
    console.log(`Backend: Demo reconciliation completed for ${email || 'anonymous'}. ` +
                `Total: ${results.total_transactions}, Accuracy: ${results.accuracy_percentage}%. ` +
                `Demo Type: ${demo_type}.`);

    // In a real app, this is where you'd save a record of the demo usage to a database
    // (e.g., using the DemoUsage model from server/models/DemoUsage.js)
    // Example:
    // const DemoUsage = require('../models/DemoUsage'); // Import if not already
    // await DemoUsage.findOneAndUpdate(
    //   { email: email || 'anonymous@demo.com', ip: req.ip },
    //   { $inc: { count: 1 }, $set: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } }, // Reset expiry for 24h
    //   { upsert: true, new: true }
    // );


    res.json(results); // Send results back to frontend

  } catch (error) {
    console.error('Backend reconciliation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred during reconciliation.',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});


// POST /api/export - Export reconciliation results as CSV
router.post('/export', demoRateLimit, [
  body('results').isObject().withMessage('Results object is required for export.'),
  body('results.matches').isArray().withMessage('Results must contain a "matches" array.'),
  body('format').optional().isIn(['csv', 'xlsx']).default('csv').withMessage('Invalid export format.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed for export request',
        details: errors.array()
      });
    }

    const { results, format } = req.body; // 'results' now contains the full backend results object

    if (format !== 'csv') { // Handle other formats if implemented later
        return res.status(400).json({ success: false, error: 'Only CSV export is supported at this time.' });
    }

    // Generate CSV content based on the 'matches' array from the results
    const headers = ['Customer Name', 'Service', 'Date', 'Amount', 'Match Type', 'Confidence (%)', 'Reward Program', 'Points Redeemed'];
    const csvRows = [
      ['MedSpaSync Pro Reconciliation Report'],
      [`Generated: ${new Date().toISOString()}`],
      [`Total Transactions: ${results.total_transactions || 'N/A'}`],
      [`Accuracy: ${results.accuracy_percentage || 'N/A'}%`],
      [''], // Empty row for separation
      headers
    ];

    // Add match data rows
    results.matches.forEach(match => {
      csvRows.push([
        match.customer_name || '',
        match.service || '',
        match.date || '',
        match.amount ? `$${parseFloat(match.amount).toFixed(2)}` : '', // Format amount as currency
        match.match_type ? match.match_type.charAt(0).toUpperCase() + match.match_type.slice(1) : '',
        match.confidence ? `${match.confidence}%` : '',
        match.reward_program || '',
        match.points_redeemed || ''
      ]);
    });

    // Convert rows to CSV string, handling commas and quotes within fields
    const csvContent = csvRows.map(row =>
      row.map(field =>
        // Enclose field in quotes if it contains comma, double quote, or newline
        typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
          ? `"${field.replace(/"/g, '""')}"` // Escape double quotes within field
          : field
      ).join(',')
    ).join('\n');

    const filename = `medspasync-reconciliation-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`); // Instruct browser to download
    res.send(csvContent); // Send the CSV content

  } catch (error) {
    console.error('Backend Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export results',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// GET /api/status - Health check for demo API
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'demo_api'
  });
});

// Error handling middleware specific to demo routes
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: `Too many files. Maximum is ${error.field ? 'one ' + error.field + ' file' : '3 files total'}.`
      });
    }
  }

  // Handle errors from fileFilter in multer
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  // Handle errors from parseCSVData
  if (error.message && error.message.includes('CSV must have at least')) {
    return res.status(400).json({
        success: false,
        error: `CSV Parsing Error: ${error.message}. Please check your CSV file format.`
    });
  }

  console.error('🔥 Demo route specific error:', error);
  res.status(500).json({
    success: false,
    error: 'An internal server error occurred in the demo API.',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
  });
});

module.exports = router;