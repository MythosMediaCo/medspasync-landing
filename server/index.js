const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://demo.medspasyncpro.com'],
  credentials: false
}));

// Body parsing + static files
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/medspasync', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// API routes
app.use('/api', require('./routes/demo'));
app.use('/api', require('./routes/training'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Unexpected server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
