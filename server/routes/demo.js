/**
 * MedSpaSync Pro Demo System v2.1
 * Enhanced with all improvements from assessment
 * - Progressive UI enhancements
 * - Industry benchmarking
 * - Visual progress indicators
 * - Mobile optimizations
 * - Performance improvements
 */

console.log('🚀 MedSpaSync Pro Demo System v2.1 Loading...');

// Configuration
const CONFIG = {
  MAX_DAILY_DEMOS: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_TYPES: ['.csv', '.txt'],
  PROCESSING_DELAY: {
    MIN: 600,
    MAX: 1000
  },
  // Update to call backend API for checkout session
  STRIPE_PORTAL_URL: 'https://billing.stripe.com/p/login/aFabJ23SRavo12mcJ44Vy00', // Used as fallback or direct link if create-checkout-session not preferred
  API_ENDPOINTS: {
    // Backend API endpoints
    reconcile: '/api/reconcile', // Main reconciliation API (from server/routes/demo.js)
    export: '/api/export',       // Export API (from server/routes/demo.js)
    lead: '/api/lead',           // Lead capture API (new server/routes/lead.js)
    checkoutSession: '/api/checkout/create-checkout-session', // Stripe checkout session creation
    analytics: '/api/analytics'  // Dedicated analytics endpoint (if implemented on backend)
  },
  ANALYTICS: {
    enabled: true,
    debug: false
  }
};

// Global state
const demoState = {
  userEmail: null,
  userName: null,
  uploadedFiles: {}, // Stores File objects (or null for samples) + metadata
  processing: false,
  demoCompleted: false,
  results: null,
  currentStep: 'upload', // 'upload', 'processing', 'results'
  usageCount: 0, // Managed by usageTracking module (client-side localStorage for demo)
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

      // Custom analytics endpoint
      if (CONFIG.API_ENDPOINTS.analytics) {
        fetch(CONFIG.API_ENDPOINTS.analytics, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        }).catch(err => console.warn('Analytics API error:', err));
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
      element.offsetHeight; // Force reflow
      element.classList.add('animate-in');
    }
  },

  hide(element) {
    if (element) {
      element.classList.add('hidden');
      element.classList.remove('animate-in');
      setTimeout(() => {
        element.style.display = 'none';
      }, 150); // Match CSS transition duration if any
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
      file: file, // Store the actual File object for FormData
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      fileType: fileType,
      isSample: false
    };

    utils.showToast(`${file.name} (${utils.formatFileSize(file.size)}) uploaded successfully`, 'success', 3000);

    analytics.track('file_uploaded', {
      file_type: fileType,
      file_size: file.size,
      file_name: file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize for analytics
    });

    this.updateUI();
    this.updateFileStatus(fileType, file);

    // Read file content for live preview (using FileReader and window.showPreview from preview.js)
    const reader = new FileReader();
    reader.onload = (e) => {
      if (window.showPreview) {
        window.showPreview(fileType, e.target.result);
      } else {
        console.warn('window.showPreview function not found. Is preview.js loaded correctly?');
      }
    };
    reader.readAsText(file); // Read the file as text for CSV parsing
  },

  updateFileStatus(fileType, file) {
    const statusElement = utils.$(`${fileType}FileStatus`);
    if (statusElement) {
      // Clear previous preview if it exists on the same spot
      const previewMountPoint = utils.$(`${fileType}Preview`);
      if (previewMountPoint) previewMountPoint.innerHTML = ''; // Clear existing React preview

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

  async loadSampleData(type) {
    const sampleFilesMeta = {
      pos: {
        name: 'sample_pos_data.csv',
        size: 2048,
        type: 'text/csv',
        description: 'Sample POS transaction data',
        // For a full backend integration, this content would be fetched from /api/sample-data
        content: `name,service,amount,date,location_id,staff_member\n"Sarah Johnson","Botox Cosmetic",450.00,"2024-03-15","LOC001","Dr. Smith"\n"Michael Chen","Juvederm Ultra",650.00,"2024-03-15","LOC001","Dr. Johnson"`
      },
      alle: {
        name: 'sample_alle_rewards.csv',
        size: 1536,
        type: 'text/csv',
        description: 'Sample Alle rewards data',
        content: `customer_name,product,points_redeemed,redemption_date,member_id,clinic_code\n"Sarah M Johnson","Botox Cosmetic",90,"2024-03-15","ALL001","CLI001"\n"Michael C Chen","Juvederm Ultra",130,"2024-03-15","ALL002","CLI001"`
      },
      aspire: {
        name: 'sample_aspire_rewards.csv',
        size: 1792,
        type: 'text/csv',
        description: 'Sample Aspire rewards data',
        content: `member_name,treatment,reward_amount,transaction_date,account_id,provider_code\n"Robert J Davis","Restylane Lyft",140.00,"2024-03-16","ASP001","PRV001"\n"David R Williams","Radiesse",96.00,"2024-03-19","ASP002","PRV001"`
      }
    };

    const sampleFileMeta = sampleFilesMeta[type];
    if (!sampleFileMeta) return;

    const fileTypeKey = type === 'alle' || type === 'aspire' ? 'loyalty' : type;

    try {
      // In a more robust setup, you might fetch sample data from your backend:
      // const response = await fetch('/api/sample-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_type: type }) });
      // const sampleContent = await response.text();
      // Using local content for immediate demo simplicity, but storing it for backend call.
      const sampleContent = sampleFileMeta.content;

      demoState.uploadedFiles[fileTypeKey] = {
        file: null, // Actual File object is null for samples
        name: sampleFileMeta.name,
        size: sampleFileMeta.size,
        type: sampleFileMeta.type,
        isSample: true,
        sampleType: type, // Store specific sample type (alle/aspire)
        uploadedAt: new Date().toISOString(),
        fileType: fileTypeKey,
        content: sampleContent // Store content to be sent to backend
      };

      utils.showToast(`${sampleFileMeta.description} loaded successfully`, 'success', 3000);

      analytics.track('sample_data_loaded', {
        sample_type: type,
        file_name: sampleFileMeta.name
      });

      this.updateUI();
      this.updateSampleStatus(type, sampleFileMeta);

      // Show live preview for sample data
      if (window.showPreview) {
        window.showPreview(fileTypeKey, sampleContent);
      } else {
        console.warn('window.showPreview function not found. Is preview.js loaded correctly?');
      }

    } catch (error) {
      console.error('Error loading sample data:', error);
      utils.showToast('Failed to load sample data.', 'error');
    }
  },

  updateSampleStatus(type, sampleFileMeta) {
    const fileTypeKey = type === 'alle' || type === 'aspire' ? 'loyalty' : type;
    const statusElement = utils.$(`${fileTypeKey}FileStatus`);
    if (statusElement) {
      // Clear previous preview if it exists
      const previewMountPoint = utils.$(`${fileTypeKey}Preview`);
      if (previewMountPoint) previewMountPoint.innerHTML = ''; // Clear existing React preview

      statusElement.innerHTML = `
        <div class="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
          <div class="flex items-center">
            <svg class="h-4 w-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm text-blue-800 font-medium">${sampleFileMeta.name}</span>
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

    // Clear status displays and previews
    const posFileStatus = utils.$('posFileStatus');
    const loyaltyFileStatus = utils.$('loyaltyFileStatus');
    const posPreview = utils.$('posPreview');
    const rewardPreview = utils.$('rewardPreview');

    if (posFileStatus) posFileStatus.innerHTML = '';
    if (loyaltyFileStatus) loyaltyFileStatus.innerHTML = '';
    if (posPreview) posPreview.innerHTML = ''; // Clear React preview component mount point
    if (rewardPreview) rewardPreview.innerHTML = ''; // Clear React preview component mount point

    this.updateUI();
  }
};

// Enhanced reconciliation engine with progress tracking
const reconciliation = {
  async run() {
    if (demoState.processing) return;

    const filesCount = Object.keys(demoState.uploadedFiles).length;
    if (filesCount < 2) {
      utils.showToast('Please select at least 2 files (POS and loyalty program data)', 'error');
      return;
    }

    // Check daily usage limit
    const today = new Date().toDateString();
    const usageKey = `demo_usage_${today}`;
    const todayUsage = parseInt(localStorage.getItem(usageKey) || '0');

    if (todayUsage >= CONFIG.MAX_DAILY_DEMOS) {
      utils.showToast('Daily demo limit reached. Please subscribe for unlimited access.', 'warning');
      setTimeout(() => subscription.showModal(), 1500);
      return;
    }

    // Start processing
    demoState.processing = true;
    demoState.currentStep = 'processing';

    // Update UI to show processing state
    this.showProcessingState();
    fileHandler.updateUI();
    usageTracking.incrementUsage(); // Increment usage count after initiating a run

    analytics.track('reconciliation_started', {
      files_count: filesCount,
      user_email: demoState.userEmail,
      files: Object.keys(demoState.uploadedFiles)
    });

    try {
      // --- INTEGRATION: Send files/data to backend for reconciliation ---
      const formData = new FormData(); // Use FormData for file uploads

      // Determine demo_type for backend (upload vs. sample)
      let isSampleDemo = true;
      for (const fileType in demoState.uploadedFiles) {
          if (!demoState.uploadedFiles[fileType].isSample) {
              isSampleDemo = false; // If any file is not a sample, it's an upload demo
              break;
          }
      }
      formData.append('demo_type', isSampleDemo ? 'sample' : 'upload');

      // Append files or sample content based on demo_type
      if (isSampleDemo) {
          // For sample demos, send flags or content
          if (demoState.uploadedFiles.pos) {
              formData.append('pos_sample_type', demoState.uploadedFiles.pos.sampleType || 'pos');
              formData.append('pos_content', demoState.uploadedFiles.pos.content);
          }
          if (demoState.uploadedFiles.loyalty) {
              formData.append('loyalty_sample_type', demoState.uploadedFiles.loyalty.sampleType || 'loyalty');
              formData.append('loyalty_content', demoState.uploadedFiles.loyalty.content);
          }
      } else {
          // For actual file uploads, append File objects
          if (demoState.uploadedFiles.pos && demoState.uploadedFiles.pos.file) {
              formData.append('pos_file', demoState.uploadedFiles.pos.file);
          }
          if (demoState.uploadedFiles.loyalty && demoState.uploadedFiles.loyalty.file) {
              formData.append('loyalty_file', demoState.uploadedFiles.loyalty.file);
          }
      }


      // Add user info if available (for backend logging/usage tracking)
      if (demoState.userEmail) formData.append('email', demoState.userEmail);
      if (demoState.userName) formData.append('name', demoState.userName);

      utils.updateProgress(5, 'Preparing data for secure transfer...');

      const response = await fetch(CONFIG.API_ENDPOINTS.reconcile, {
        method: 'POST',
        body: formData // FormData handles Content-Type: multipart/form-data automatically
      });

      if (!response.ok) {
        // Attempt to parse JSON error from backend if available
        const errorData = await response.json().catch(() => ({})); // Handle non-JSON responses
        throw new Error(errorData.error || `Server responded with status ${response.status}: ${response.statusText}`);
      }

      // Simulate client-side processing steps while waiting for backend response.
      // This is for visual progress. The actual calculation happens on the backend.
      await this.simulateProcessing();

      const results = await response.json(); // Get actual results from backend

      if (!results.success) { // Check for a 'success' flag from your backend response
        throw new Error(results.error || 'Reconciliation process failed on server with unknown error.');
      }

      // Store results received from the backend
      demoState.results = results;
      demoState.demoCompleted = true;
      demoState.currentStep = 'results';

      // Display results based on backend data
      this.displayResults(this.mapBackendResultsToFrontend(results)); // Map backend format to frontend display format

      utils.showToast('Reconciliation completed successfully!', 'success');

      analytics.track('reconciliation_completed', {
        results: demoState.results, // Send raw backend results for analytics
        processing_time: results.processing_time_ms / 1000,
        match_rate: results.accuracy_percentage
      });

      // Show subscription CTA after successful demo
      setTimeout(() => {
        subscription.showCTA();
      }, 2000);

    } catch (error) {
      console.error('Reconciliation API error:', error);
      utils.showToast(`Processing failed: ${error.message}. Please try again or contact support.`, 'error', 8000);

      analytics.track('reconciliation_error', {
        error: error.message,
        files_count: filesCount
      });
      // Reset UI to upload step on error
      reconciliation.resetDemo();
    } finally {
      demoState.processing = false;
      fileHandler.updateUI();
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
      { progress: 10, message: 'Uploading files securely...' },
      { progress: 25, message: 'Processing loyalty program data...' },
      { progress: 40, message: 'Initializing AI matching algorithm...' },
      { progress: 55, message: 'Analyzing transaction patterns...' },
      { progress: 70, message: 'Running fuzzy matching logic...' },
      { progress: 85, message: 'Validating matches and confidence scores...' },
      { progress: 95, message: 'Generating comprehensive results...' },
      { progress: 100, message: 'Finalizing reconciliation report...' }
    ];

    for (let i = 0; i < progressSteps.length; i++) {
      const step = progressSteps[i];

      // Update progress visuals
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

  /**
   * Maps the backend reconciliation results format to the frontend's display format.
   * @param {object} backendResults - The raw results object received from the backend API.
   * @returns {object} Formatted results for frontend display.
   */
  mapBackendResultsToFrontend(backendResults) {
    const industryAverage = 65; // This could also come from backend if available
    const performanceVsIndustry = ((backendResults.accuracy_percentage - industryAverage) / industryAverage * 100).toFixed(1);

    return {
      total: backendResults.total_transactions,
      matches: backendResults.exact_matches + backendResults.fuzzy_matches,
      unmatched: backendResults.unmatched_transactions,
      accuracy: backendResults.accuracy_percentage,
      matchRate: backendResults.accuracy_percentage, // Using accuracy as match rate for simplicity in display
      processingTime: (backendResults.processing_time_ms / 1000).toFixed(1),
      // Recalculate potential revenue client-side if backend doesn't provide it
      potentialRevenue: Math.floor(backendResults.unmatched_transactions * (150 + Math.random() * 100)),
      confidence: Math.floor(backendResults.accuracy_percentage * 0.95), // Client-side derived confidence
      filesProcessed: Object.keys(demoState.uploadedFiles),
      industryComparison: {
        industryAverage: industryAverage,
        yourPerformance: backendResults.accuracy_percentage,
        improvementVsIndustry: performanceVsIndustry
      },
      breakdown: {
        perfectMatches: backendResults.exact_matches,
        fuzzyMatches: backendResults.fuzzy_matches,
        // Unmatched reasons are client-side simulated as backend doesn't provide them
        unmatchedReasons: {
          timingDiscrepancies: Math.floor(backendResults.unmatched_transactions * 0.4),
          nameVariations: Math.floor(backendResults.unmatched_transactions * 0.3),
          missingData: Math.floor(backendResults.unmatched_transactions * 0.2),
          other: Math.floor(backendResults.unmatched_transactions * 0.1)
        }
      },
      // Recommendations are client-side simulated based on unmatched count and potential revenue
      recommendations: this.generateRecommendations(backendResults.unmatched_transactions, Math.floor(backendResults.unmatched_transactions * (150 + Math.random() * 100)))
    };
  },

  generateRecommendations(unmatched, revenue) {
    const recommendations = [];

    if (unmatched > 3) {
      recommendations.push('Contact loyalty program representatives to resolve timing discrepancies.');
    }

    if (revenue > 1000) {
      recommendations.push('Implement weekly reconciliation to minimize revenue loss.');
    }

    recommendations.push('Export detailed results for accounting team review.');
    recommendations.push('Consider upgrading to MedSpaSync Pro for automated reconciliation and advanced analytics.');


    return recommendations;
  },

  displayResults(results) {
    // Hide processing step
    const processingStep = utils.$('processingStep');
    const resultsStep = utils.$('resultsStep');
    const exportBtn = utils.$('exportBtn');

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
        <div class="text-xs text-green-600 mt-1">${results.matchRate}% match rate</div>
      </div>

      <div class="bg-red-50 rounded-lg p-4 border border-red-200">
        <div class="text-2xl font-bold text-red-900">${results.unmatched}</div>
        <div class="text-sm text-red-700">Need Review</div>
        <div class="text-xs text-red-600 mt-1">Potential revenue: $${results.potentialRevenue.toLocaleString()}</div>
      </div>

      <div class="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
        <div class="text-2xl font-bold text-emerald-900">${results.accuracy}%</div>
        <div class="text-sm text-emerald-700">Accuracy Score</div>
        <div class="text-xs text-emerald-600 mt-1">${results.confidence}% confidence</div>
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
      // --- INTEGRATION: Send results to backend for export ---
      utils.showToast('Preparing results for export...', 'info', 3000);
      analytics.track('export_started', { format: 'csv' });

      const response = await fetch(CONFIG.API_ENDPOINTS.export, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: demoState.results, format: 'csv' }) // Send raw backend results
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}: ${response.statusText}`);
      }

      // The backend sends a file directly, so we trigger download
      const blob = await response.blob();
      // Extract filename from Content-Disposition header provided by backend
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `medspasync_demo_results_${new Date().toISOString().split('T')[0]}.csv`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Clean up the object URL


      utils.showToast('Results exported successfully!', 'success');

      analytics.track('results_exported', {
        file_format: 'csv',
        results: demoState.results // Send raw backend results for analytics
      });

    } catch (error) {
      console.error('Export error:', error);
      utils.showToast(`Export failed: ${error.message}. Please try again or contact support.`, 'error', 8000);
      analytics.track('export_failed', { error: error.message });
    }
  },

  // generateCSVExport is now handled by the backend, this client-side version is deprecated.
  generateCSVExport(results) {
    console.warn("generateCSVExport is deprecated for client-side; backend handles it now.");
    // This function can be completely removed if frontend solely relies on backend export.
    // Keeping it here for reference/fallback if needed, but it won't be called in the new flow.
    const headers = [
      'Metric',
      'Value',
      'Notes'
    ];

    const rows = [
      ['Total Transactions', results.total, 'All processed transactions'],
      ['Successful Matches', results.matches, 'Automatically matched transactions'],
      ['Unmatched Transactions', results.unmatched, 'Require manual review'],
      ['Match Rate', `${results.matchRate}%`, 'Percentage of successful matches'],
      ['Accuracy Score', `${results.accuracy}%`, 'Algorithm confidence level'],
      ['Processing Time', `${results.processingTime}s`, 'Time to complete reconciliation'],
      ['Potential Revenue Impact', `$${results.potentialRevenue.toLocaleString()}`, 'Estimated revenue from unmatched transactions'],
      ['Perfect Matches', results.breakdown.perfectMatches, 'Exact transaction matches'],
      ['Fuzzy Matches', results.breakdown.fuzzyMatches, 'Approximate matches with high confidence'],
      ['Timing Discrepancies', results.breakdown.unmatchedReasons.timingDiscrepancies, 'Unmatched due to timing differences'],
      ['Name Variations', results.breakdown.unmatchedReasons.nameVariations, 'Unmatched due to name/description differences'],
      ['Missing Data', results.breakdown.unmatchedReasons.missingData, 'Unmatched due to incomplete information'],
      ['Industry Benchmark', `${results.industryComparison.industryAverage}%`, 'Medical spa industry average match rate'],
      ['Performance vs Industry', `${results.industryComparison.improvementVsIndustry}%`, 'Your performance compared to industry average']
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

    // Clear file handler (clears inputs, status, and previews)
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

      analytics.track('subscription_cta_shown', {
        trigger: 'demo_completion'
      });
    } else {
      // Fallback to modal if CTA section doesn't exist (less ideal, but robust)
      this.showModal();
    }
  },

  // Handles all clicks that lead to Stripe
  async redirectToPortal(source = 'unknown', plan = 'core') { // Added plan parameter
    utils.showToast('Redirecting to secure checkout...', 'info', 5000);

    analytics.track('subscription_redirect_initiated', {
      source: source,
      plan: plan,
      demo_completed: demoState.demoCompleted
    });

    try {
      // --- INTEGRATION: Call backend to create Stripe Checkout Session ---
      const response = await fetch(CONFIG.API_ENDPOINTS.checkoutSession, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Parse JSON error if available
        throw new Error(errorData.error || `Server responded with status ${response.status}: ${response.statusText}`);
      }

      const session = await response.json();
      if (session.url) {
        window.location.href = session.url; // Redirect to Stripe Checkout page
      } else {
        throw new Error('No checkout URL received.');
      }
      analytics.track('subscription_redirect_success', { source: source, plan: plan });

    } catch (error) {
      console.error('Stripe redirect error:', error);
      utils.showToast(`Failed to start subscription: ${error.message}. Please try again.`, 'error', 8000);
      analytics.track('subscription_redirect_failed', { source: source, plan: plan, error: error.message });
      // Fallback to generic portal if session creation fails
      setTimeout(() => {
        window.location.href = CONFIG.STRIPE_PORTAL_URL; // Fallback to hardcoded portal
      }, 2000);
    } finally {
      this.closeModal(); // Always close modal
    }
  }
};

// Enhanced lead capture system
const leadCapture = {
  init() {
    // Check for email parameter in URL
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
      // --- INTEGRATION: Send lead data to backend ---
      utils.showToast('Saving your info...', 'info', 3000);
      analytics.track('lead_submission_initiated');

      const response = await fetch(CONFIG.API_ENDPOINTS.lead, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}: ${response.statusText}`);
      }

      // Backend confirmed lead saved
      demoState.userEmail = formData.email;
      demoState.userName = formData.name;

      utils.showToast('Welcome! You can now access the demo.', 'success');

      analytics.track('lead_captured', {
        email: formData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Anonymize for analytics
        source: 'demo_page'
      });

      // Show the demo tool and hide the lead capture form
      utils.hide(utils.$('leadCapture'));
      utils.show(utils.$('demoTool'));
      utils.scrollToElement('demoTool');


      return true;
    } catch (error) {
      console.error('Lead capture error:', error);
      utils.showToast(`Failed to save your information: ${error.message}. You can still use the demo.`, 'warning', 8000);
      analytics.track('lead_submission_failed', { error: error.message });
      // Still show demo even if lead save fails on backend for demo purposes
      utils.hide(utils.$('leadCapture'));
      utils.show(utils.$('demoTool'));
      utils.scrollToElement('demoTool');
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
            usageTextSpan.textContent = 'Daily demo limit reached. Please subscribe for unlimited access.';
            utils.show(usageBanner);
        } else if (remaining <= 2) {
            usageTextSpan.textContent = `You have ${remaining} demo(s) remaining today.`;
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

  // Main demo button
  const runDemoBtn = utils.$('runDemoBtn');
  if (runDemoBtn) {
    runDemoBtn.addEventListener('click', () => reconciliation.run());
  }

  // Results action buttons
  const exportBtn = utils.$('exportBtn');
  const runAnotherDemoBtn = utils.$('runAnotherDemoBtn');

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
      subscription.redirectToPortal('header-cta', 'core'); // Assuming default is core
    });
  }

  const corePlanSubscribeBtn = utils.$('corePlanSubscribeBtn');
  if (corePlanSubscribeBtn) {
    corePlanSubscribeBtn.addEventListener('click', () => {
      subscription.redirectToPortal('core-plan-section', 'core');
    });
  }

  const proPlanSubscribeBtn = utils.$('proPlanSubscribeBtn');
  if (proPlanSubscribeBtn) {
    proPlanSubscribeBtn.addEventListener('click', () => {
      // Check if it's the "Coming Soon" button (disabled)
      if (proPlanSubscribeBtn.disabled) {
        utils.showToast('Professional plan coming Q3 2025!', 'info');
        analytics.track('coming_soon_clicked', { plan: 'professional' });
      } else {
        subscription.redirectToPortal('pro-plan-section', 'professional');
      }
    });
  }

  const mainCtaSubscribeBtn = utils.$('mainCtaSubscribeBtn'); // From #subscriptionCTA section
  if (mainCtaSubscribeBtn) {
      mainCtaSubscribeBtn.addEventListener('click', () => {
          subscription.redirectToPortal('main-cta-section', 'core'); // Assuming default is core
      });
  }


  // Subscription modal handlers
  const modalSubscribeBtn = utils.$('modalSubscribeBtn');
  if (modalSubscribeBtn) {
      modalSubscribeBtn.addEventListener('click', () => {
          subscription.redirectToPortal('modal-confirm', 'core'); // Assuming default is core
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
        utils.showToast('Welcome! Upload your CSV files or try our sample data to see MedSpaSync Pro in action.', 'info', 6000);
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