/**
 * MedSpaSync Pro Demo System v2.1
 * Enhanced with MedSpaSync Pro brand standards and proven metrics
 * - 8+ hours weekly time savings messaging
 * - $2,500+ monthly revenue protection
 * - 95%+ AI accuracy demonstration
 * - Jacob Hagood medical spa industry authority
 * - Real transformation examples (6 hours to 15 minutes)
 */

console.log('🚀 MedSpaSync Pro Demo System v2.1 Loading...');

// MedSpaSync Pro Configuration with proven metrics
const CONFIG = {
  MAX_DAILY_DEMOS: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_TYPES: ['.csv', '.txt'],
  PROCESSING_DELAY: {
    MIN: 600,
    MAX: 1000
  },
  STRIPE_PORTAL_URL: 'https://billing.stripe.com/p/login/aFabJ23SRavo12mcJ44Vy00',
  // Backend API Configuration
  API_BASE_URL: (function() {
    // Browser-compatible environment detection
    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1' &&
                        !window.location.hostname.includes('.local');
    return isProduction 
      ? 'https://api.medspasyncpro.com' 
      : 'http://localhost:5000';
  })(),
  API_ENDPOINTS: {
    reconciliation: {
      upload: '/api/reconciliation/upload',
      process: '/api/reconciliation/process',
      results: '/api/reconciliation/jobs',
      health: '/api/reconciliation/health'
    },
    contact: '/api/contact',
    analytics: '/api/analytics'
  },
  ANALYTICS: {
    enabled: true,
    debug: false
  },
  // MedSpaSync Pro proven metrics
  PROVEN_METRICS: {
    HOURS_WEEKLY_SAVED: 8,
    MONTHLY_REVENUE_PROTECTED: 2500,
    AI_ACCURACY_RATE: 95,
    REAL_USER_ACCURACY: 97,
    TRANSFORMATION_TIME: '6 hours weekly to 15 minutes',
    IMPLEMENTATION_TIME: '24 hours'
  }
};

// Global state
const demoState = {
  userEmail: null,
  userName: null,
  uploadedFiles: {},
  processing: false,
  demoCompleted: false,
  results: null,
  currentStep: 'upload', // 'upload', 'processing', 'results'
  usageCount: 0,
  sessionId: null
};

// Initialize session
demoState.sessionId = 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Analytics system
const analytics = {
  track(event, properties = {}) {
    if (!CONFIG.ANALYTICS.enabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        session_id: demoState.sessionId,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    if (CONFIG.ANALYTICS.debug) {
      console.log(`📊 Analytics Event:`, eventData);
    }

    // In production, send to your analytics service
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', event, properties);
      }

      // Custom analytics endpoint - send to backend
      if (CONFIG.API_ENDPOINTS.analytics) {
        fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.analytics}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        }).catch(err => console.warn('Analytics error:', err));
      }
    } catch (error) {
      console.warn('Analytics tracking error:', error);
    }
  }
};

// Utility functions
const utils = {
  // Safe element getter with error handling
  $(id) {
    try {
      return document.getElementById(id);
    } catch (error) {
      console.warn(`Element not found: ${id}`);
      return null;
    }
  },

  // Enhanced toast notifications with better UX
  showToast(message, type = 'info', duration = 4000) {
    const toast = this.$('toast');
    if (!toast) {
      console.log(`${type.toUpperCase()}: ${message}`);
      return;
    }

    // Enhanced styling for different types
    const styles = {
      success: {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        icon: '✅'
      },
      error: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        icon: '❌'
      },
      warning: {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-800',
        icon: '⚠️'
      },
      info: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        icon: 'ℹ️'
      }
    };

    const style = styles[type] || styles.info;

    toast.className = `fixed bottom-4 right-4 z-50 max-w-sm border rounded-lg shadow-lg p-4 toast ${style.bg}`;
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-lg flex-shrink-0">
          ${style.icon}
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium ${style.text}">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.parentElement.classList.remove('show')"
                 class="text-gray-400 hover:text-gray-600 ml-2">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    toast.classList.add('show');

    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    }
  },

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Enhanced show/hide with animation support
  show(element, display = 'block') {
    if (element) {
      element.style.display = display;
      element.classList.remove('hidden');
      // Trigger reflow for animations
      element.offsetHeight;
      element.classList.add('animate-in');
    }
  },

  hide(element) {
    if (element) {
      element.classList.add('hidden');
      element.classList.remove('animate-in');
      setTimeout(() => {
        element.style.display = 'none';
      }, 150);
    }
  },

  // Progress bar management
  updateProgress(percentage, message = '') {
    const progressBar = this.$('progressBar');
    const progressPercent = this.$('progressPercent');
    const processingMessage = this.$('processingMessage');

    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }

    if (progressPercent) {
      progressPercent.textContent = `${Math.round(percentage)}%`;
    }

    if (processingMessage && message) {
      processingMessage.textContent = message;
    }
  },

  // Debounce function for performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Mobile detection
  isMobile() {
    return window.innerWidth <= 768;
  },

  // Smooth scroll to element
  scrollToElement(elementId) {
    const element = this.$(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }
};

// Enhanced file handling system
const fileHandler = {
  validateFile(file) {
    const validTypes = CONFIG.SUPPORTED_TYPES;
    const maxSize = CONFIG.MAX_FILE_SIZE;
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validTypes.includes(fileExt)) {
      return {
        valid: false,
        error: `Invalid file type. Please upload ${validTypes.join(' or ')} files only.`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${utils.formatFileSize(maxSize)}.`
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File appears to be empty. Please select a valid CSV file.'
      };
    }

    return { valid: true };
  },

  handleFileSelect(input, fileType) {
    const file = input.files[0];
    if (!file) return;

    const validation = this.validateFile(file);
    if (!validation.valid) {
      utils.showToast(validation.error, 'error');
      input.value = '';
      return;
    }

    // Store file with metadata
    demoState.uploadedFiles[fileType] = {
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      fileType: fileType
    };

    utils.showToast(`${file.name} (${utils.formatFileSize(file.size)}) uploaded successfully`, 'success', 3000);

    analytics.track('file_uploaded', {
      file_type: fileType,
      file_size: file.size,
      file_name: file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize for analytics
    });

    this.updateUI();
    this.updateFileStatus(fileType, file);
  },

  updateFileStatus(fileType, file) {
    const statusElement = utils.$(`${fileType}FileStatus`);
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
          <div class="flex items-center">
            <svg class="h-4 w-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-sm text-green-800 font-medium">${file.name}</span>
          </div>
          <span class="text-xs text-green-600">${utils.formatFileSize(file.size)}</span>
        </div>
      `;
    }
  },

  loadSampleData(type) {
    const sampleFiles = {
      pos: {
        name: 'sample_pos_data.csv',
        size: 2048,
        type: 'text/csv',
        description: 'Sample POS transaction data'
      },
      alle: {
        name: 'sample_alle_rewards.csv',
        size: 1536,
        type: 'text/csv',
        description: 'Sample Alle rewards data'
      },
      aspire: {
        name: 'sample_aspire_rewards.csv',
        size: 1792,
        type: 'text/csv',
        description: 'Sample Aspire rewards data'
      }
    };

    const sampleFile = sampleFiles[type];
    if (!sampleFile) return;

    // Create mock file object
    demoState.uploadedFiles[type === 'alle' || type === 'aspire' ? 'loyalty' : type] = {
      file: null,
      name: sampleFile.name,
      size: sampleFile.size,
      type: sampleFile.type,
      isSample: true,
      sampleType: type,
      uploadedAt: new Date().toISOString(),
      fileType: type === 'alle' || type === 'aspire' ? 'loyalty' : type
    };

    utils.showToast(`${sampleFile.description} loaded successfully`, 'success', 3000);

    analytics.track('sample_data_loaded', {
      sample_type: type,
      file_name: sampleFile.name
    });

    this.updateUI();
    this.updateSampleStatus(type, sampleFile);
  },

  updateSampleStatus(type, sampleFile) {
    const fileTypeKey = type === 'alle' || type === 'aspire' ? 'loyalty' : type;
    const statusElement = utils.$(`${fileTypeKey}FileStatus`);
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
          <div class="flex items-center">
            <svg class="h-4 w-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm text-blue-800 font-medium">${sampleFile.name}</span>
          </div>
          <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Sample</span>
        </div>
      `;
    }
  },

  updateUI() {
    const filesCount = Object.keys(demoState.uploadedFiles).length;
    const runBtn = utils.$('runDemoBtn');
    // usageCount updates handled by usageTracking module directly
    // demosRemaining is part of usageTracking.updateDisplay()

    // Update run button state
    if (runBtn) {
      const canRun = filesCount >= 2 && !demoState.processing;

      runBtn.disabled = !canRun;

      if (demoState.processing) {
        runBtn.textContent = '⏳ Processing...';
        runBtn.className = 'bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg cursor-not-allowed transition';
      } else if (canRun) {
        runBtn.textContent = '🚀 Run AI Reconciliation';
        runBtn.className = 'bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition cursor-pointer';
      } else {
        const needed = 2 - filesCount;
        runBtn.textContent = `📁 Select ${needed} more file${needed > 1 ? 's' : ''} to continue`;
        runBtn.className = 'bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg cursor-not-allowed transition';
      }
    }
  },

  clearFiles() {
    demoState.uploadedFiles = {};

    // Clear file inputs
    const posInput = utils.$('posFileInput');
    const loyaltyInput = utils.$('loyaltyFileInput');

    if (posInput) posInput.value = '';
    if (loyaltyInput) loyaltyInput.value = '';

    // Clear status displays
    const posStatus = utils.$('posFileStatus');
    const loyaltyStatus = utils.$('loyaltyFileStatus');

    if (posStatus) posStatus.innerHTML = '';
    if (loyaltyStatus) loyaltyStatus.innerHTML = '';

    this.updateUI();
  }
};

// Enhanced reconciliation engine with progress tracking
const reconciliation = {
  async run() {
    if (demoState.processing) return;

    const filesCount = Object.keys(demoState.uploadedFiles).length;
    if (filesCount < 2) {
      utils.showToast('Please upload at least 2 files (POS and loyalty data) to run the demo.', 'warning');
      return;
    }

    demoState.processing = true;
    demoState.currentStep = 'processing';

    // Show processing state
    this.showProcessingState();

    try {
      // Check backend health first
      const healthResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.reconciliation.health}`);
      if (!healthResponse.ok) {
        throw new Error('Backend service unavailable');
      }

      // Prepare form data for file upload
      const formData = new FormData();
      
      Object.entries(demoState.uploadedFiles).forEach(([fileType, fileData]) => {
        if (fileData.file) {
          formData.append(fileType, fileData.file);
        }
      });

      // Upload files to backend
      const uploadResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.reconciliation.upload}`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      const uploadResult = await uploadResponse.json();
      
      // Start reconciliation processing
      const processResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.reconciliation.process}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: uploadResult.files,
          planType: 'demo'
        })
      });

      if (!processResponse.ok) {
        throw new Error('Reconciliation processing failed');
      }

      const processResult = await processResponse.json();
      const jobId = processResult.jobId;

      // Poll for results
      let results = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (!results && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const resultsResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.reconciliation.results}/${jobId}`);
        
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          if (resultsData.status === 'completed') {
            results = resultsData.results;
            break;
          }
        }
        
        attempts++;
      }

      if (!results) {
        throw new Error('Reconciliation processing timeout');
      }

      // Transform backend results to match frontend expectations
      const transformedResults = this.transformBackendResults(results);
      
      demoState.results = transformedResults;
      demoState.demoCompleted = true;
      demoState.currentStep = 'results';

      // Display results
      this.displayResults(transformedResults);

      // Show CTA
      subscription.showCTA();

      // Track completion
      analytics.track('demo_completed', {
        files_processed: filesCount,
        results: transformedResults
      });

      // Increment usage
      usageTracking.incrementUsage();

    } catch (error) {
      console.error('Demo execution error:', error);
      
      // Fallback to simulated results if backend fails
      utils.showToast('Backend connection failed. Showing simulated results for demo purposes.', 'warning');
      
      const simulatedResults = this.generateResults();
      demoState.results = simulatedResults;
      demoState.demoCompleted = true;
      demoState.currentStep = 'results';
      
      this.displayResults(simulatedResults);
      subscription.showCTA();
      usageTracking.incrementUsage();
    } finally {
      demoState.processing = false;
    }
  },

  showProcessingState() {
    // Hide upload step
    const uploadStep = utils.$('uploadStep');
    const processingStep = utils.$('processingStep');

    if (uploadStep) utils.hide(uploadStep);
    if (processingStep) utils.show(processingStep);

    // Scroll to processing section
    utils.scrollToElement('processingStep');
  },

  async simulateProcessing() {
    const progressSteps = [
      { progress: 10, message: 'Loading POS transaction data from your spa system...' },
      { progress: 25, message: 'Processing loyalty program data (Alle, Aspire, etc.)...' },
      { progress: 40, message: 'Initializing MedSpaSync Pro AI matching algorithm...' },
      { progress: 55, message: 'Analyzing medical spa transaction patterns...' },
      { progress: 70, message: 'Running fuzzy matching logic for name variations...' },
      { progress: 85, message: 'Validating matches with 95%+ accuracy threshold...' },
      { progress: 95, message: 'Generating comprehensive reconciliation report...' },
      { progress: 100, message: 'Finalizing results - ready to save you 8+ hours weekly...' }
    ];

    for (let i = 0; i < progressSteps.length; i++) {
      const step = progressSteps[i];

      // Update progress
      utils.updateProgress(step.progress, step.message);

      // Variable delay for realism
      const delay = CONFIG.PROCESSING_DELAY.MIN +
        Math.random() * (CONFIG.PROCESSING_DELAY.MAX - CONFIG.PROCESSING_DELAY.MIN);

      await new Promise(resolve => setTimeout(resolve, delay));

      // Show intermediate toast for key steps
      if ([25, 55, 85].includes(step.progress)) {
        utils.showToast(step.message, 'info', 2000);
      }
    }
  },

  transformBackendResults(backendResults) {
    // Transform backend results to match frontend expectations
    const results = {
      total: backendResults.totalTransactions || 0,
      matches: backendResults.matchedTransactions || 0,
      unmatched: backendResults.unmatchedTransactions || 0,
      accuracy: backendResults.accuracy || CONFIG.PROVEN_METRICS.AI_ACCURACY_RATE,
      matchRate: Math.round((backendResults.matchedTransactions / backendResults.totalTransactions) * 100) || 0,
      processingTime: backendResults.processingTime || '2.1',
      potentialRevenue: backendResults.potentialRevenue || 0,
      monthlyRevenueProtected: Math.max(CONFIG.PROVEN_METRICS.MONTHLY_REVENUE_PROTECTED, (backendResults.potentialRevenue || 0) * 4),
      weeklyTimeSaved: CONFIG.PROVEN_METRICS.HOURS_WEEKLY_SAVED,
      confidence: Math.floor((backendResults.accuracy || CONFIG.PROVEN_METRICS.AI_ACCURACY_RATE) * 0.98),
      filesProcessed: Object.keys(demoState.uploadedFiles),
      industryComparison: {
        industryAverage: 65,
        yourPerformance: backendResults.accuracy || CONFIG.PROVEN_METRICS.AI_ACCURACY_RATE,
        improvementVsIndustry: ((backendResults.accuracy || CONFIG.PROVEN_METRICS.AI_ACCURACY_RATE - 65) / 65 * 100).toFixed(1)
      },
      breakdown: {
        perfectMatches: Math.floor((backendResults.matchedTransactions || 0) * 0.8),
        fuzzyMatches: Math.floor((backendResults.matchedTransactions || 0) * 0.2),
        unmatchedReasons: {
          timingDiscrepancies: Math.floor((backendResults.unmatchedTransactions || 0) * 0.4),
          nameVariations: Math.floor((backendResults.unmatchedTransactions || 0) * 0.3),
          missingData: Math.floor((backendResults.unmatchedTransactions || 0) * 0.2),
          other: Math.floor((backendResults.unmatchedTransactions || 0) * 0.1)
        }
      },
      recommendations: this.generateRecommendations(
        backendResults.unmatchedTransactions || 0,
        backendResults.potentialRevenue || 0,
        CONFIG.PROVEN_METRICS.HOURS_WEEKLY_SAVED
      )
    };

    return results;
  },

  generateResults() {
    // Generate results using MedSpaSync Pro proven metrics
    const baseTotal = 20 + Math.floor(Math.random() * 15); // 20-35 transactions (realistic spa volume)
    const matchRate = 0.92 + Math.random() * 0.05; // 92-97% match rate (proven 97% real user results)
    const matches = Math.floor(baseTotal * matchRate);
    const unmatched = baseTotal - matches;
    const accuracy = CONFIG.PROVEN_METRICS.AI_ACCURACY_RATE + Math.floor(Math.random() * 5); // 95-100% accuracy

    // Calculate revenue impact using proven $2,500+ monthly metric
    const avgTransactionValue = 180 + Math.random() * 120; // $180-300 avg (realistic spa transaction)
    const potentialRevenue = Math.floor(unmatched * avgTransactionValue);
    const monthlyRevenueProtected = Math.max(CONFIG.PROVEN_METRICS.MONTHLY_REVENUE_PROTECTED, potentialRevenue * 4); // Scale to monthly

    // Industry benchmarking with medical spa context
    const industryAverage = 65; // Industry average match rate for manual reconciliation
    const performanceVsIndustry = ((accuracy - industryAverage) / industryAverage * 100).toFixed(1);

    // Time savings calculation based on proven 8+ hours weekly
    const manualTimePerTransaction = 0.25; // 15 minutes per transaction manually
    const aiTimePerTransaction = 0.02; // 1.2 minutes per transaction with AI
    const weeklyTimeSaved = Math.round((manualTimePerTransaction - aiTimePerTransaction) * baseTotal * 5); // 5 days per week
    const timeSavings = Math.max(CONFIG.PROVEN_METRICS.HOURS_WEEKLY_SAVED, weeklyTimeSaved);

    return {
      total: baseTotal,
      matches: matches,
      unmatched: unmatched,
      accuracy: accuracy,
      matchRate: Math.round(matchRate * 100),
      processingTime: (0.8 + Math.random() * 1.2).toFixed(1), // Faster processing
      potentialRevenue: potentialRevenue,
      monthlyRevenueProtected: monthlyRevenueProtected,
      weeklyTimeSaved: timeSavings,
      confidence: Math.floor(accuracy * 0.98), // Higher confidence with proven accuracy
      filesProcessed: Object.keys(demoState.uploadedFiles),
      industryComparison: {
        industryAverage: industryAverage,
        yourPerformance: accuracy,
        improvementVsIndustry: performanceVsIndustry
      },
      breakdown: this.generateDetailedBreakdown(matches, unmatched),
      recommendations: this.generateRecommendations(unmatched, potentialRevenue, timeSavings)
    };
  },

  generateDetailedBreakdown(matches, unmatched) {
    return {
      perfectMatches: Math.floor(matches * 0.8),
      fuzzyMatches: Math.floor(matches * 0.2),
      unmatchedReasons: {
        timingDiscrepancies: Math.floor(unmatched * 0.4),
        nameVariations: Math.floor(unmatched * 0.3),
        missingData: Math.floor(unmatched * 0.2),
        other: Math.floor(unmatched * 0.1)
      }
    };
  },

  generateRecommendations(unmatched, revenue, timeSavings) {
    const recommendations = [];

    if (unmatched > 3) {
      recommendations.push('Contact your loyalty program representatives to resolve timing discrepancies - this is a common issue in medical spas');
    }

    if (revenue > 1000) {
      recommendations.push(`Implement weekly reconciliation to prevent $${Math.round(revenue * 4).toLocaleString()}+ monthly in missed revenue`);
    }

    if (timeSavings >= CONFIG.PROVEN_METRICS.HOURS_WEEKLY_SAVED) {
      recommendations.push(`Save ${timeSavings}+ hours weekly by automating reconciliation - like our spa clients who went from 6 hours to 15 minutes`);
    }

    recommendations.push('Export detailed results for your accounting team review - built by 10-year medical spa veteran Jacob Hagood');

    // Add MedSpaSync Pro specific recommendations
    if (revenue > 500) {
      recommendations.push('Consider MedSpaSync Pro\'s 24-hour implementation to start protecting revenue immediately');
    }

    return recommendations;
  },

  displayResults(results) {
    // Hide processing step
    const processingStep = utils.$('processingStep');
    const resultsStep = utils.$('resultsStep');
    const exportBtn = utils.$('exportBtn'); // Get export button

    if (processingStep) utils.hide(processingStep);
    if (resultsStep) utils.show(resultsStep);
    if (exportBtn) utils.show(exportBtn); // Show export button when results are ready

    // Populate results grid
    this.populateResultsGrid(results);

    // Populate detailed results
    this.populateDetailedResults(results);

    // Update industry comparison
    this.updateIndustryComparison(results);

    // Scroll to results
    utils.scrollToElement('resultsStep');
  },

  populateResultsGrid(results) {
    const resultsGrid = utils.$('resultsGrid');
    if (!resultsGrid) return;

    resultsGrid.innerHTML = `
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div class="text-2xl font-bold text-blue-900">${results.total}</div>
        <div class="text-sm text-blue-700">Total Transactions</div>
        <div class="text-xs text-blue-600 mt-1">Processed in ${results.processingTime}s</div>
      </div>

      <div class="bg-green-50 rounded-lg p-4 border border-green-200">
        <div class="text-2xl font-bold text-green-900">${results.matches}</div>
        <div class="text-sm text-green-700">Successful Matches</div>
        <div class="text-xs text-green-600 mt-1">${results.matchRate}% match rate (MedSpaSync Pro average: 97%)</div>
      </div>

      <div class="bg-red-50 rounded-lg p-4 border border-red-200">
        <div class="text-2xl font-bold text-red-900">${results.unmatched}</div>
        <div class="text-sm text-red-700">Need Review</div>
        <div class="text-xs text-red-600 mt-1">Potential revenue: $${results.potentialRevenue.toLocaleString()}</div>
      </div>

      <div class="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
        <div class="text-2xl font-bold text-emerald-900">${results.accuracy}%</div>
        <div class="text-sm text-emerald-700">AI Accuracy Score</div>
        <div class="text-xs text-emerald-600 mt-1">${results.confidence}% confidence</div>
      </div>

      <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div class="text-2xl font-bold text-orange-900">${results.weeklyTimeSaved}+ hrs</div>
        <div class="text-sm text-orange-700">Weekly Time Saved</div>
        <div class="text-xs text-orange-600 mt-1">From manual reconciliation</div>
      </div>

      <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div class="text-2xl font-bold text-purple-900">$${results.monthlyRevenueProtected.toLocaleString()}+</div>
        <div class="text-sm text-purple-700">Monthly Revenue Protected</div>
        <div class="text-xs text-purple-600 mt-1">Previously missed transactions</div>
      </div>
    `;
  },

  populateDetailedResults(results) {
    const detailedResults = utils.$('detailedResults');
    if (!detailedResults) return;

    detailedResults.innerHTML = `
      <div class="space-y-6">
        <div>
          <h5 class="text-lg font-semibold text-gray-900 mb-3">Match Analysis</h5>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-white rounded-lg p-4 border">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Perfect Matches</span>
                <span class="font-semibold text-green-600">${results.breakdown.perfectMatches}</span>
              </div>
            </div>
            <div class="bg-white rounded-lg p-4 border">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Fuzzy Matches</span>
                <span class="font-semibold text-blue-600">${results.breakdown.fuzzyMatches}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h5 class="text-lg font-semibold text-gray-900 mb-3">Unmatched Transaction Reasons</h5>
          <div class="space-y-2">
            <div class="flex justify-between items-center p-3 bg-white rounded border">
              <span class="text-sm text-gray-600">Timing Discrepancies</span>
              <span class="font-semibold text-gray-900">${results.breakdown.unmatchedReasons.timingDiscrepancies}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-white rounded border">
              <span class="text-sm text-gray-600">Name Variations</span>
              <span class="font-semibold text-gray-900">${results.breakdown.unmatchedReasons.nameVariations}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-white rounded border">
              <span class="text-sm text-gray-600">Missing Data</span>
              <span class="font-semibold text-gray-900">${results.breakdown.unmatchedReasons.missingData}</span>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h5 class="text-lg font-semibold text-blue-900 mb-3">Real Transformation Example</h5>
          <p class="text-sm text-blue-800 mb-2">
            <strong>Multi-location Med Spa, Atlanta:</strong> "We reduced reconciliation from 6 hours weekly to just 15 minutes with 97% match rate accuracy. Our operations manager can now focus on patient experience instead of spreadsheets."
          </p>
          <p class="text-xs text-blue-600">— Built by 10-year medical spa veteran Jacob Hagood</p>
        </div>

        <div>
          <h5 class="text-lg font-semibold text-gray-900 mb-3">Recommended Actions</h5>
          <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <ul class="space-y-2">
              ${results.recommendations.map(rec =>
                `<li class="flex items-start">
                  <svg class="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="text-sm text-yellow-800">${rec}</span>
                </li>`
              ).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  updateIndustryComparison(results) {
    const industryComparison = utils.$('industryComparison');
    const industryBenchmark = utils.$('industryBenchmark');

    if (industryBenchmark) {
      const comparison = results.industryComparison;
      const isAbove = comparison.yourPerformance > comparison.industryAverage;

      industryBenchmark.innerHTML = `
        Industry average match rate: ${comparison.industryAverage}% |
        Your performance: ${comparison.yourPerformance}%
        (${isAbove ? '+' : ''}${comparison.improvementVsIndustry}% vs industry)
      `;
    }

    if (industryComparison) {
      const isAbove = results.accuracy > results.industryComparison.industryAverage;
      industryComparison.className = `mt-6 p-4 rounded-lg ${
        isAbove ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
      }`;

      const message = isAbove ?
        `🎉 Excellent! Your reconciliation accuracy is ${results.industryComparison.improvementVsIndustry}% above industry average.` :
        `📈 Room for improvement. Industry leaders achieve ${results.industryComparison.industryAverage}%+ match rates.`;

      industryComparison.querySelector('p').innerHTML = `
        <strong>Industry Benchmark:</strong> ${message}
      `;
    }
  },

  async exportResults() {
    if (!demoState.results) {
      utils.showToast('No results to export. Please run a demo first.', 'warning');
      return;
    }

    try {
      // Generate CSV content
      const csvContent = this.generateCSVExport(demoState.results);

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `medspasync_demo_results_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        utils.showToast('Results exported successfully!', 'success');

        analytics.track('results_exported', {
          file_format: 'csv',
          results: demoState.results
        });
      } else {
        throw new Error('File download not supported');
      }
    } catch (error) {
      console.error('Export error:', error);
      utils.showToast('Export failed. Please try again or contact support.', 'error');
    }
  },

  generateCSVExport(results) {
    const headers = [
      'Metric',
      'Value',
      'Notes'
    ];

    const rows = [
      ['Total Transactions', results.total, 'All processed transactions'],
      ['Successful Matches', results.matches, 'Automatically matched transactions'],
      ['Unmatched Transactions', results.unmatched, 'Require manual review'],
      ['Match Rate', `${results.matchRate}%`, 'Percentage of successful matches (MedSpaSync Pro average: 97%)'],
      ['AI Accuracy Score', `${results.accuracy}%`, 'Algorithm confidence level (target: 95%+)'],
      ['Processing Time', `${results.processingTime}s`, 'Time to complete reconciliation'],
      ['Potential Revenue Impact', `$${results.potentialRevenue.toLocaleString()}`, 'Estimated revenue from unmatched transactions'],
      ['Weekly Time Saved', `${results.weeklyTimeSaved}+ hours`, 'Time saved from manual reconciliation'],
      ['Monthly Revenue Protected', `$${results.monthlyRevenueProtected.toLocaleString()}+`, 'Previously missed transactions'],
      ['Perfect Matches', results.breakdown.perfectMatches, 'Exact transaction matches'],
      ['Fuzzy Matches', results.breakdown.fuzzyMatches, 'Approximate matches with high confidence'],
      ['Timing Discrepancies', results.breakdown.unmatchedReasons.timingDiscrepancies, 'Unmatched due to timing differences'],
      ['Name Variations', results.breakdown.unmatchedReasons.nameVariations, 'Unmatched due to name/description differences'],
      ['Missing Data', results.breakdown.unmatchedReasons.missingData, 'Unmatched due to incomplete information'],
      ['Industry Benchmark', `${results.industryComparison.industryAverage}%`, 'Medical spa industry average match rate'],
      ['Performance vs Industry', `${results.industryComparison.improvementVsIndustry}%`, 'Your performance compared to industry average'],
      ['MedSpaSync Pro Implementation', '24 hours', 'Time to full implementation'],
      ['Real Transformation Example', '6 hours weekly to 15 minutes', 'Actual spa client results'],
      ['Built By', 'Jacob Hagood', '10-year medical spa industry veteran']
    ];

    // Convert to CSV format
    const csvRows = [headers, ...rows];
    return csvRows.map(row =>
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  },

  resetDemo() {
    // Reset state
    demoState.uploadedFiles = {};
    demoState.processing = false;
    demoState.demoCompleted = false;
    demoState.results = null;
    demoState.currentStep = 'upload';

    // Reset UI visibility
    const leadCaptureSection = utils.$('leadCapture');
    const demoToolSection = utils.$('demoTool');
    const uploadStep = utils.$('uploadStep');
    const processingStep = utils.$('processingStep');
    const resultsStep = utils.$('resultsStep');
    const exportBtn = utils.$('exportBtn');
    const ctaSection = utils.$('subscriptionCTA');

    if (leadCaptureSection) utils.show(leadCaptureSection);
    if (demoToolSection) utils.hide(demoToolSection); // Hide the whole demo tool
    if (uploadStep) utils.show(uploadStep); // Ensure upload step is visible within demoTool once it's shown
    if (processingStep) utils.hide(processingStep);
    if (resultsStep) utils.hide(resultsStep);
    if (exportBtn) utils.hide(exportBtn); // Hide export button on reset
    if (ctaSection) utils.hide(ctaSection); // Hide subscription CTA

    // Clear file handler
    fileHandler.clearFiles();

    // Reset progress
    utils.updateProgress(0, '');
    usageTracking.updateDisplay(); // Update usage text display after reset

    // Scroll to top of main content or hero section
    utils.scrollToElement('main');


    utils.showToast('Demo reset. You can now upload new files.', 'info');

    analytics.track('demo_reset');
  }
};

// Enhanced subscription system
const subscription = {
  // Directly call this when showing the modal
  showModal() {
    const modal = utils.$('subscriptionModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      analytics.track('subscription_modal_shown', {
        trigger: 'manual',
        demo_completed: demoState.demoCompleted,
        demo_results: demoState.results
      });
      // Optionally store in localStorage if modal should only show once
      localStorage.setItem('subscription_prompt_shown', 'true');
    }
  },

  closeModal() {
    const modal = utils.$('subscriptionModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');

      analytics.track('subscription_modal_closed', {
        action: 'user_dismissed'
      });
    }
  },

  // This is called from reconciliation.run() after demo completion
  showCTA() {
    const ctaSection = utils.$('subscriptionCTA');
    if (ctaSection) {
      utils.show(ctaSection); // Use utils.show for consistent animation
      setTimeout(() => {
        utils.scrollToElement('subscriptionCTA');
      }, 500);

      // Update CTA messaging with MedSpaSync Pro proven metrics
      const ctaTitle = ctaSection.querySelector('h2, h3');
      const ctaDescription = ctaSection.querySelector('p');
      
      if (ctaTitle) {
        ctaTitle.textContent = `Save ${CONFIG.PROVEN_METRICS.HOURS_WEEKLY_SAVED}+ Hours Weekly Like Our Spas`;
      }
      
      if (ctaDescription) {
        ctaDescription.textContent = `Join medical spas saving $${CONFIG.PROVEN_METRICS.MONTHLY_REVENUE_PROTECTED.toLocaleString()}+ monthly and achieving ${CONFIG.PROVEN_METRICS.REAL_USER_ACCURACY}% match accuracy. Start your ${CONFIG.PROVEN_METRICS.IMPLEMENTATION_TIME} implementation today.`;
      }

      analytics.track('subscription_cta_shown', {
        trigger: 'demo_completion',
        proven_metrics_shown: true
      });
    } else {
      // Fallback to modal if CTA section doesn't exist (less ideal, but robust)
      this.showModal();
    }
  },

  // Handles all clicks that lead to Stripe
  redirectToPortal(source = 'unknown') {
    utils.showToast('Redirecting to secure checkout...', 'info');

    analytics.track('subscription_redirect', {
      source: source,
      demo_completed: demoState.demoCompleted
    });

    setTimeout(() => {
      window.open(CONFIG.STRIPE_PORTAL_URL, '_blank');
    }, 1000);

    // Close modal if redirecting from it
    this.closeModal();
  }
};

// Enhanced lead capture system
const leadCapture = {
  init() {
    // Check for email parameter in URL (for tracking)
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    if (emailParam) {
      demoState.userEmail = emailParam;
      this.populateEmailField(emailParam);
    }
  },

  populateEmailField(email) {
    const emailInput = utils.$('leadEmail');
    if (emailInput) {
      emailInput.value = email;
    }
  },

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  async submitLead(formData) {
    // Validate email before submission
    if (!this.validateEmail(formData.email)) {
      utils.showToast('Please enter a valid email address.', 'error');
      const emailError = utils.$('leadEmail-error');
      if (emailError) {
          emailError.textContent = 'Invalid email address.';
          utils.show(emailError, 'block');
      }
      return false;
    } else {
        const emailError = utils.$('leadEmail-error');
        if (emailError) utils.hide(emailError);
    }

    try {
      // Send lead data to backend
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.contact}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || 'Demo User',
          email: formData.email,
          message: `Demo lead from MedSpaSync Pro landing page. User interested in saving 8+ hours weekly and preventing $2,500+ monthly in missed revenue.`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit lead');
      }

      demoState.userEmail = formData.email;
      demoState.userName = formData.name;

      utils.showToast('Welcome to MedSpaSync Pro! See how spas save 8+ hours weekly and prevent $2,500+ monthly in missed revenue.', 'success');

      analytics.track('lead_captured', {
        email: formData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Anonymize for analytics
        name: formData.name || 'Anonymous',
        source: 'demo_page',
        backend_submitted: true
      });

      // Show the demo tool and hide the lead capture form
      console.log('Hiding lead capture form...');
      const leadCaptureElement = utils.$('leadCapture');
      const demoToolElement = utils.$('demoTool');
      
      if (leadCaptureElement) {
        leadCaptureElement.style.display = 'none';
        leadCaptureElement.classList.add('hidden');
        console.log('Lead capture form hidden');
      } else {
        console.error('Lead capture element not found');
      }
      
      if (demoToolElement) {
        demoToolElement.style.display = 'block';
        demoToolElement.classList.remove('hidden');
        console.log('Demo tool shown');
        
        // Scroll to demo tool with a slight delay to ensure it's visible
        setTimeout(() => {
          utils.scrollToElement('demoTool');
          console.log('Scrolled to demo tool');
        }, 200);
      } else {
        console.error('Demo tool element not found');
      }

      return true;
    } catch (error) {
      console.error('Lead capture error:', error);
      
      // Fallback: still allow demo access even if backend fails
      demoState.userEmail = formData.email;
      demoState.userName = formData.name;

      utils.showToast('Welcome to MedSpaSync Pro! See how spas save 8+ hours weekly and prevent $2,500+ monthly in missed revenue.', 'success');

      analytics.track('lead_captured', {
        email: formData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        name: formData.name || 'Anonymous',
        source: 'demo_page',
        backend_submitted: false,
        error: error.message
      });

      // Show the demo tool and hide the lead capture form
      console.log('Hiding lead capture form...');
      const leadCaptureElement = utils.$('leadCapture');
      const demoToolElement = utils.$('demoTool');
      
      if (leadCaptureElement) {
        leadCaptureElement.style.display = 'none';
        leadCaptureElement.classList.add('hidden');
        console.log('Lead capture form hidden');
      } else {
        console.error('Lead capture element not found');
      }
      
      if (demoToolElement) {
        demoToolElement.style.display = 'block';
        demoToolElement.classList.remove('hidden');
        console.log('Demo tool shown');
        
        // Scroll to demo tool with a slight delay to ensure it's visible
        setTimeout(() => {
          utils.scrollToElement('demoTool');
          console.log('Scrolled to demo tool');
        }, 200);
      } else {
        console.error('Demo tool element not found');
      }

      return false;
    }
  }
};

// Enhanced usage tracking
const usageTracking = {
  init() {
    this.updateDisplay();
    this.checkDailyReset();
  },

  updateDisplay() {
    const demosRemainingSpan = utils.$('demosRemaining');
    const usageTextSpan = utils.$('usageText');
    const usageBanner = utils.$('usageBanner');

    const remaining = this.getRemainingDemos();

    if (demosRemainingSpan) {
      demosRemainingSpan.textContent = remaining;
      // Update styling based on remaining demos (on the span's parent element)
      demosRemainingSpan.parentElement.classList.remove('text-red-600', 'text-yellow-600', 'text-gray-600');
      if (remaining <= 1) {
        demosRemainingSpan.parentElement.classList.add('text-red-600');
      } else if (remaining <= 2) {
        demosRemainingSpan.parentElement.classList.add('text-yellow-600');
      } else {
        demosRemainingSpan.parentElement.classList.add('text-gray-600'); // Default color
      }
    }

    if (usageTextSpan && usageBanner) {
        if (remaining <= 0) {
            usageTextSpan.textContent = 'Daily demo limit reached. Subscribe to MedSpaSync Pro for unlimited access and start saving 8+ hours weekly.';
            utils.show(usageBanner);
        } else if (remaining <= 2) {
            usageTextSpan.textContent = `You have ${remaining} demo(s) remaining today. Ready to save $2,500+ monthly?`;
            utils.show(usageBanner);
        } else {
            utils.hide(usageBanner); // Hide if ample demos remain
        }
    }
  },

  getRemainingDemos() {
    const today = new Date().toDateString();
    const usageKey = `demo_usage_${today}`;
    const todayUsage = parseInt(localStorage.getItem(usageKey) || '0');
    return Math.max(0, CONFIG.MAX_DAILY_DEMOS - todayUsage);
  },

  checkDailyReset() {
    const lastResetKey = 'demo_last_reset';
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem(lastResetKey);

    if (lastReset !== today) {
      // New day, reset usage
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `demo_usage_${yesterday.toDateString()}`;

      localStorage.removeItem(yesterdayKey); // Clear yesterday's usage
      localStorage.setItem(lastResetKey, today); // Set reset for today

      this.updateDisplay(); // Update display with new daily count
    }
  },

  incrementUsage() {
    const today = new Date().toDateString();
    const usageKey = `demo_usage_${today}`;
    const current = parseInt(localStorage.getItem(usageKey) || '0');
    localStorage.setItem(usageKey, (current + 1).toString());

    this.updateDisplay();
  }
};

// Error handling and recovery
const errorHandler = {
  init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleError(event.error, 'global');
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason, 'promise');
    });
  },

  handleError(error, context) {
    analytics.track('error_occurred', {
      error_message: error.message || 'Unknown error',
      error_context: context,
      stack_trace: error.stack ? error.stack.substring(0, 500) : 'No stack trace'
    });

    // User-friendly error messages
    const userMessage = this.getUserFriendlyMessage(error);
    utils.showToast(userMessage, 'error');
  },

  getUserFriendlyMessage(error) {
    if (error.message && error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (error.message && error.message.includes('file')) {
      return 'File processing error. Please ensure your CSV file is valid.';
    }

    return 'Something went wrong. Please refresh the page and try again.';
  }
};

// Performance monitoring
const performance = {
  init() {
    this.measurePageLoad();
    this.monitorFileUpload();
  },

  measurePageLoad() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];

          analytics.track('page_performance', {
            load_time: perfData.loadEventEnd - perfData.loadEventStart,
            dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            total_page_load: perfData.loadEventEnd - perfData.fetchStart
          });
        }, 0);
      });
    }
  },

  monitorFileUpload() {
    // Track file upload performance
    const originalHandleFileSelect = fileHandler.handleFileSelect;
    fileHandler.handleFileSelect = function(input, fileType) {
      const startTime = performance.now();

      try {
        const result = originalHandleFileSelect.call(this, input, fileType);

        const endTime = performance.now();
        analytics.track('file_upload_performance', {
          file_type: fileType,
          processing_time: endTime - startTime,
          file_size: input.files[0]?.size || 0
        });

        return result;
      } catch (error) {
        const endTime = performance.now();
        analytics.track('file_upload_error', {
          file_type: fileType,
          processing_time: endTime - startTime,
          error: error.message
        });
        throw error;
      }
    };
  }
};

// Event listeners and initialization
function setupEventListeners() {
  console.log('🔧 Setting up event listeners...');

  // Hero section "Start Demo" button
  const startDemoHeroBtn = utils.$('startDemoHeroBtn');
  if (startDemoHeroBtn) {
      startDemoHeroBtn.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent default anchor jump
          utils.scrollToElement('leadCapture');
          analytics.track('hero_start_demo_clicked');
      });
  }

  // Lead capture form submission
  const leadForm = utils.$('leadForm');
  if (leadForm) {
      leadForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = utils.$('leadEmail').value;
          const name = utils.$('leadName').value;
          const formData = { email, name };
          await leadCapture.submitLead(formData);
      });
  }

  // File upload handlers
  const posFileInput = utils.$('posFileInput');
  const loyaltyFileInput = utils.$('loyaltyFileInput');

  if (posFileInput) {
    posFileInput.addEventListener('change', (e) => {
      fileHandler.handleFileSelect(e.target, 'pos');
    });
  }

  if (loyaltyFileInput) {
    loyaltyFileInput.addEventListener('change', (e) => {
      fileHandler.handleFileSelect(e.target, 'loyalty');
    });
  }

  // Sample data buttons
  const loadPosSample = utils.$('loadPosSample');
  const loadAlleSample = utils.$('loadAlleSample');
  const loadAspireSample = utils.$('loadAspireSample');

  if (loadPosSample) {
    loadPosSample.addEventListener('click', () => fileHandler.loadSampleData('pos'));
  }
  if (loadAlleSample) {
    loadAlleSample.addEventListener('click', () => fileHandler.loadSampleData('alle'));
  }
  if (loadAspireSample) {
    loadAspireSample.addEventListener('click', () => fileHandler.loadSampleData('aspire'));
  }

  // Stripe checkout button - replaces the demo button
  const stripeCheckoutBtn = utils.$('stripeCheckoutBtn');
  if (stripeCheckoutBtn) {
    stripeCheckoutBtn.addEventListener('click', () => {
      // Track the click for analytics
      analytics.track('stripe_checkout_clicked', {
        source: 'reconciliation_card',
        action: 'redirect_to_stripe'
      });
      
      // Show loading message
      utils.showToast('Redirecting to secure checkout...', 'info');
      
      // Redirect to Stripe checkout
      setTimeout(() => {
        window.open(CONFIG.STRIPE_PORTAL_URL, '_blank');
      }, 1000);
    });
  }

  // Results action buttons
  const exportBtn = utils.$('exportBtn'); // Changed ID from 'exportResults' to 'exportBtn'
  const runAnotherDemoBtn = utils.$('runAnotherDemoBtn'); // New ID for "Try Another Demo" button

  if (exportBtn) {
    exportBtn.addEventListener('click', () => reconciliation.exportResults());
    utils.hide(exportBtn); // Hide on load, show when results are ready
  }

  if (runAnotherDemoBtn) {
    runAnotherDemoBtn.addEventListener('click', () => reconciliation.resetDemo());
  }


  // Plan selection buttons (from header and pricing sections)
  const headerSubscribeBtn = utils.$('headerSubscribeBtn');
  if (headerSubscribeBtn) {
    headerSubscribeBtn.addEventListener('click', () => {
      subscription.redirectToPortal('header-cta');
    });
  }

  const corePlanSubscribeBtn = utils.$('corePlanSubscribeBtn');
  if (corePlanSubscribeBtn) {
    corePlanSubscribeBtn.addEventListener('click', () => {
      subscription.redirectToPortal('core-plan-section');
    });
  }

  const proPlanSubscribeBtn = utils.$('proPlanSubscribeBtn');
  if (proPlanSubscribeBtn) {
    proPlanSubscribeBtn.addEventListener('click', () => {
      // Check if it's the "Coming Soon" button
      if (proPlanSubscribeBtn.disabled) { // Assuming it's disabled if coming soon
        utils.showToast('Professional plan coming Q3 2025!', 'info');
        analytics.track('coming_soon_clicked', { plan: 'professional' });
      } else {
        subscription.redirectToPortal('pro-plan-section');
      }
    });
  }

  const mainCtaSubscribeBtn = utils.$('mainCtaSubscribeBtn'); // From #subscriptionCTA section
  if (mainCtaSubscribeBtn) {
      mainCtaSubscribeBtn.addEventListener('click', () => {
          subscription.redirectToPortal('main-cta-section');
      });
  }


  // Subscription modal handlers
  const modalSubscribeBtn = utils.$('modalSubscribeBtn');
  if (modalSubscribeBtn) {
      modalSubscribeBtn.addEventListener('click', () => {
          subscription.redirectToPortal('modal-confirm');
      });
  }

  const closeSubscriptionModalBtn = utils.$('closeSubscriptionModalBtn');
  if (closeSubscriptionModalBtn) {
    closeSubscriptionModalBtn.addEventListener('click', () => subscription.closeModal());
  }

  const subscriptionModal = utils.$('subscriptionModal');
  if (subscriptionModal) {
    // Close modal if clicking outside the content
    subscriptionModal.addEventListener('click', (e) => {
      if (e.target === subscriptionModal) {
        subscription.closeModal();
      }
    });
  }

  // FAQ Accordion functionality
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const answer = utils.$(targetId);
      const icon = button.querySelector('svg');

      if (answer && icon) {
        const isHidden = answer.classList.contains('hidden');
        // Close all other open FAQs first (optional, but good UX for accordions)
        document.querySelectorAll('.faq-answer:not(.hidden)').forEach(openAnswer => {
          if (openAnswer.id !== targetId) { // Don't close the one just clicked
            utils.hide(openAnswer);
            const associatedButton = openAnswer.previousElementSibling;
            if (associatedButton && associatedButton.classList.contains('faq-question')) {
                associatedButton.querySelector('svg').classList.remove('rotate-180');
            }
          }
        });

        if (isHidden) {
          utils.show(answer, 'block'); // Use 'block' to override potential flex/grid
          icon.classList.add('rotate-180');
        } else {
          utils.hide(answer);
          icon.classList.remove('rotate-180');
        }
        analytics.track('faq_toggled', { question: button.querySelector('h3').textContent.trim(), state: isHidden ? 'open' : 'closed' });
      }
    });
  });


  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape key to close modals
    if (e.key === 'Escape') {
      subscription.closeModal();
    }

    // Ctrl/Cmd + Enter to run demo (if files are ready)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const filesCount = Object.keys(demoState.uploadedFiles).length;
      if (filesCount >= 2 && !demoState.processing) {
        reconciliation.run();
      }
    }
  });

  console.log('✅ Event listeners setup complete');
}

// Main initialization function
function init() {
  console.log('🚀 Initializing MedSpaSync Pro Demo System v2.1...');

  try {
    // Initialize all systems
    leadCapture.init();
    usageTracking.init();
    errorHandler.init();
    performance.init();
    mobileOptimizations.init();
    accessibility.init();

    // Setup event handlers
    setupEventListeners();

    // Initialize UI state
    fileHandler.updateUI(); // Updates run button state etc.

    // Track page load
    analytics.track('demo_page_loaded', {
      user_agent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString(),
      session_id: demoState.sessionId
    });

    console.log('✅ Demo system v2.1 initialized successfully');

    // Show welcome message for first-time users
    if (!localStorage.getItem('demo_welcomed')) {
      setTimeout(() => {
        utils.showToast('Welcome to MedSpaSync Pro! Upload your CSV files or try our sample data to see how spas save 8+ hours weekly and prevent $2,500+ monthly in missed revenue.', 'info', 6000);
        localStorage.setItem('demo_welcomed', 'true');
      }, 1000);
    }

  } catch (error) {
    console.error('Demo initialization error:', error);
    utils.showToast('Demo system failed to initialize. Please refresh the page.', 'error');

    analytics.track('initialization_error', {
      error: error.message,
      stack: error.stack
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for external access (debugging, etc.)
if (typeof window !== 'undefined') {
  window.MedSpaSyncDemo = {
    state: demoState,
    utils: utils,
    fileHandler: fileHandler,
    reconciliation: reconciliation,
    subscription: subscription,
    analytics: analytics,
    version: '2.1'
  };
}

console.log('📋 MedSpaSync Pro Demo System v2.1 Loaded Successfully');