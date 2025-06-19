// server/routes/training.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');

// Middleware for authentication (placeholder for production)
const authenticate = (req, res, next) => {
  // In a real production application, this middleware would:
  // 1. Verify an API key (e.g., from header: req.headers['x-api-key'])
  // 2. Verify a JWT token (e.g., from header: req.headers.authorization)
  // 3. Implement IP whitelisting
  // If NOT authenticated, return res.status(401).json({ error: 'Unauthorized' });

  // For development, we allow access:
  if (process.env.NODE_ENV === 'production' && !req.headers.authorization && !req.headers['x-internal-api-key']) {
    console.warn('Unauthorized access attempt to training endpoint. Authentication bypass in development.');
    return res.status(401).json({ error: 'Unauthorized: Training data upload requires authentication in production.' });
  }
  next(); // Continue to the route handler
};

// POST /api/training/upload - Endpoint to upload training data
router.post('/upload', authenticate, [ // Apply authentication middleware
  body('type').trim().notEmpty().withMessage('Type is required.')
    .isLength({ max: 50 }).withMessage('Type cannot exceed 50 characters.')
    .custom(value => {
      // Basic sanitization: allow only alphanumeric, underscore, hyphen for 'type'
      const safeValue = value.replace(/[^a-zA-Z0-9_-]/g, '');
      if (safeValue !== value) {
        throw new Error('Type contains invalid characters. Only alphanumeric, underscore, and hyphen are allowed.');
      }
      return true;
    }),
  body('records').isArray({ min: 1 }).withMessage('Records must be a non-empty array.'),
  body('records.*').isObject().withMessage('Each record within the array must be an object.') // Validate each item in the array
], async (req, res) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  try {
    const { type, records } = req.body;

    const trainingDir = path.join(__dirname, '../training_data');
    // Ensure the training_data directory exists. recursive: true creates parent directories if needed.
    // fs.mkdirSync is blocking, but is generally safe here as it typically runs once or rarely fails.
    fs.mkdirSync(trainingDir, { recursive: true });

    // Sanitize filename to prevent path traversal (e.g., ../../secrets.json)
    const safeTypeForFilename = type.replace(/[^a-zA-Z0-9_-]/g, ''); // Re-sanitize just in case, or rely solely on custom validation above
    const filename = path.join(trainingDir, `${safeTypeForFilename}-${Date.now()}.json`);

    // Write the records to a JSON file
    await fs.promises.writeFile(filename, JSON.stringify(records, null, 2));

    res.json({ success: true, message: 'Training data saved.', filename: safeTypeForFilename, recordsCount: records.length });
  } catch (err) {
    console.error('Training upload failed:', err);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred during training data upload.',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
  }
});

module.exports = router;