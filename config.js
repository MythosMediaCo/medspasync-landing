// MedSpaSync Pro Landing Page Configuration
const config = {
  // Backend API Configuration
  backend: {
    baseUrl: process.env.BACKEND_API_URL || 'http://localhost:5000',
    endpoints: {
      reconciliation: {
        upload: '/api/reconciliation/upload',
        process: '/api/reconciliation/process',
        results: '/api/reconciliation/jobs',
        health: '/api/reconciliation/health'
      },
      contact: '/api/contact',
      analytics: '/api/analytics'
    }
  },
  
  // Frontend Configuration
  frontend: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  },
  
  // MedSpaSync Pro Brand Configuration
  brand: {
    provenMetrics: {
      hoursWeeklySaved: 8,
      monthlyRevenueProtected: 2500,
      aiAccuracyRate: 95,
      realUserAccuracy: 97,
      transformationTime: '6 hours weekly to 15 minutes',
      implementationTime: '24 hours'
    }
  }
};

module.exports = config; 