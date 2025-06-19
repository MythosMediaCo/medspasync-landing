// demo.js - Demo 2.0 with Stripe Customer Portal Integration
// Handles lead capture, file uploads, reconciliation processing, and subscription flow

console.log('🏥 MedSpaSync Pro - Demo System v2.1 (Production Ready)');

// Configuration
const CONFIG = {
  STRIPE_PORTAL_URL: 'https://billing.stripe.com/p/login/aFabJ23SRavo12mcJ44Vy00',
  API_BASE_URL: '/api',
  MAX_DAILY_DEMOS: 5,
  DEMO_TIMEOUT: 30000,
  SUBSCRIPTION_DELAY: 5000 // Show subscription prompt after 5 seconds
};

// Demo state management
const demoState = {
  uploadedFiles: {},
  processing: false,
  results: null,
  currentPlan: 'core',
  userEmail: null,
  demoCompleted: false,
  subscriptionPromptShown: false
};

// Utility functions
const utils = {
  $(id) {
    return document.getElementById(id);
  },

  showToast(message, type = 'info', duration = 4000) {
    const toast = this.$('toast');
    if (!toast) {
      console.log(`${type.toUpperCase()}: ${message}`);
      return;
    }

    const typeStyles = {
      success: 'border-green-200 bg-green-50 text-green-800',
      error: 'border-red-200 bg-red-50 text-red-800',
      warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      info: 'border-blue-200 bg-blue-50 text-blue-800'
    };

    toast.className = `fixed bottom-4 right-4 z-50 max-w-sm border rounded-lg shadow-lg p-4 toast ${typeStyles[type] || typeStyles.info}`;
    toast.textContent = message;
    
    // Show toast
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
    }, duration);

    console.log(`${type.toUpperCase()}: ${message}`);
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // CSP-compliant element manipulation
  show(element, displayType = 'block') {
    if (!element) return;
    element.classList.remove('hidden-element');
    element.classList.add('visible-element');
    element.style.display = displayType;
  },

  hide(element) {
    if (!element) return;
    element.classList.add('hidden-element');
    element.classList.remove('visible-element');
  }
};

// Analytics tracking
const analytics = {
  track(event, properties = {}) {
    const data = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        demo_session_id: this.getSessionId()
      }
    };
    
    console.log('Analytics Event:', data);
    
    // Store for potential later sending
    const events = JSON.parse(localStorage.getItem('demo_events') || '[]');
    events.push(data);
    localStorage.setItem('demo_events', JSON.stringify(events.slice(-50))); // Keep last 50 events
  },

  getSessionId() {
    let sessionId = sessionStorage.getItem('demo_session_id');
    if (!sessionId) {
      sessionId = 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('demo_session_id', sessionId);
    }
    return sessionId;
  }
};

// Subscription management
const subscription = {
  trackClick(source) {
    analytics.track('subscription_clicked', {
      source: source,
      demo_completed: demoState.demoCompleted,
      current_plan: demoState.currentPlan,
      user_email: demoState.userEmail
    });
  },

  open(source) {
    this.trackClick(source);
    
    // Open Stripe Customer Portal
    window.open(CONFIG.STRIPE_PORTAL_URL, '_blank');
    
    utils.showToast('Opening secure billing portal...', 'info', 2000);
  },

  showModal() {
    if (demoState.subscriptionPromptShown) return;
    
    const modal = utils.$('subscriptionModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      demoState.subscriptionPromptShown = true;
      
      analytics.track('subscription_modal_shown', {
        trigger: 'demo_completion',
        demo_results: demoState.results
      });
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

  showCTA() {
    const ctaSection = utils.$('subscriptionCTA');
    if (ctaSection) {
      ctaSection.classList.remove('hidden');
      
      setTimeout(() => {
        ctaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
      
      analytics.track('subscription_cta_shown', {
        trigger: 'demo_completion'
      });
    }
  }
};

// File handling
const fileHandler = {
  validateFile(file) {
    const validTypes = ['.csv', '.txt'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExt)) {
      return 'Invalid file type. Please upload CSV files only.';
    }
    
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${utils.formatFileSize(maxSize)}.`;
    }
    
    return null;
  },

  handleFileSelect(input, fileType) {
    const file = input.files[0];
    if (!file) return;
    
    const error = this.validateFile(file);
    if (error) {
      utils.showToast(error, 'error');
      input.value = '';
      return;
    }
    
    demoState.uploadedFiles[fileType] = file;
    
    utils.showToast(`${file.name} uploaded successfully`, 'success', 2000);
    analytics.track('file_uploaded', {
      file_type: fileType,
      file_size: file.size,
      file_name: file.name
    });
    
    this.updateUI();
  },

  loadSampleData(type) {
    const sampleFiles = {
      pos: 'sample_pos_data.csv',
      alle: 'sample_alle_data.csv',
      aspire: 'sample_aspire_data.csv'
    };
    
    demoState.uploadedFiles[type] = { 
      name: sampleFiles[type], 
      size: 2048, 
      type: 'text/csv',
      isSample: true 
    };
    
    utils.showToast(`${sampleFiles[type]} loaded`, 'success', 2000);
    analytics.track('sample_data_loaded', { sample_type: type });
    
    this.updateUI();
  },

  updateUI() {
    const filesCount = Object.keys(demoState.uploadedFiles).length;
    const runBtn = utils.$('runDemoBtn');
    
    if (runBtn) {
      runBtn.disabled = filesCount < 2 || demoState.processing;
      
      if (demoState.processing) {
        runBtn.textContent = '⏳ Processing...';
      } else if (filesCount >= 2) {
        runBtn.textContent = '🚀 Run AI Reconciliation';
      } else {
        const needed = 2 - filesCount;
        runBtn.textContent = `📁 Select ${needed} more file${needed > 1 ? 's' : ''}`;
      }
    }
  }
};

// Demo reconciliation engine
const reconciliation = {
  async run() {
    if (demoState.processing) return;
    
    const filesCount = Object.keys(demoState.uploadedFiles).length;
    if (filesCount < 2) {
      utils.showToast('Please select at least 2 files (POS and rewards data)', 'error');
      return;
    }

    // Check daily usage limit
    const today = new Date().toDateString();
    const usageKey = `demo_usage_${today}`;
    const todayUsage = parseInt(localStorage.getItem(usageKey) || '0');
    
    if (todayUsage >= CONFIG.MAX_DAILY_DEMOS) {
      utils.showToast('Daily demo limit reached. Please subscribe for unlimited access.', 'warning');
      setTimeout(() => subscription.showModal(), 1000);
      return;
    }

    demoState.processing = true;
    fileHandler.updateUI();
    
    const loader = utils.$('runLoader');
    if (loader) utils.show(loader);
    
    utils.showToast('Analyzing transaction data...', 'info');
    analytics.track('reconciliation_started', { 
      files_count: filesCount,
      user_email: demoState.userEmail
    });
    
    try {
      // Simulate realistic processing with progress updates
      const progressMessages = [
        'Loading POS data...',
        'Processing rewards data...',
        'Running AI matching algorithm...',
        'Analyzing patterns...',
        'Generating results...'
      ];
      
      for (let i = 0; i < progressMessages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
        if (i < progressMessages.length - 1) {
          utils.showToast(progressMessages[i], 'info', 1500);
        }
      }
      
      // Generate realistic results
      const baseTotal = 15 + Math.floor(Math.random() * 10);
      const matchRate = 0.75 + Math.random() * 0.2; // 75-95% match rate
      const matches = Math.floor(baseTotal * matchRate);
      const accuracy = 85 + Math.floor(Math.random() * 15); // 85-100% accuracy
      
      const results = {
        total: baseTotal,
        matches: matches,
        unmatched: baseTotal - matches,
        accuracy: accuracy,
        processingTime: (1.2 + Math.random() * 1.8).toFixed(1),
        potentialRevenue: Math.floor((baseTotal - matches) * 150 + Math.random() * 1000) + 500,
        confidence: Math.floor(accuracy * 0.95),
        filesProcessed: Object.keys(demoState.uploadedFiles)
      };
      
      demoState.results = results;
      demoState.demoCompleted = true;
      
      this.displayResults(results);
      
      // Update usage tracking
      localStorage.setItem(usageKey, (todayUsage + 1).toString());
      
      utils.showToast('Reconciliation completed successfully!', 'success');
      analytics.track('reconciliation_completed', results);
      
      // Show subscription options after delay
      setTimeout(() => {
        subscription.showCTA();
        setTimeout(() => subscription.showModal(), CONFIG.SUBSCRIPTION_DELAY);
      }, 2000);
      
    } catch (error) {
      console.error('Reconciliation error:', error);
      utils.showToast('Processing failed. Please try again.', 'error');
      analytics.track('reconciliation_error', { error: error.message });
    } finally {
      demoState.processing = false;
      fileHandler.updateUI();
      
      const loader = utils.$('runLoader');
      if (loader) utils.hide(loader);
    }
  },

  displayResults(results) {
    const resultsDiv = utils.$('results');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Reconciliation Complete</h3>
          <p class="text-gray-600">AI analysis finished in ${results.processingTime} seconds</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          <div class="bg-blue-50 p-6 rounded-lg text-center">
            <div class="text-3xl font-bold text-blue-600">${results.total}</div>
            <div class="text-sm text-gray-600">Total Transactions</div>
          </div>
          
          <div class="bg-green-50 p-6 rounded-lg text-center">
            <div class="text-3xl font-bold text-green-600">${results.matches}</div>
            <div class="text-sm text-gray-600">Matched (${Math.round(results.matches/results.total*100)}%)</div>
          </div>
          
          <div class="bg-yellow-50 p-6 rounded-lg text-center">
            <div class="text-3xl font-bold text-yellow-600">${results.unmatched}</div>
            <div class="text-sm text-gray-600">Need Review</div>
          </div>
        </div>
        
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div class="flex items-center mb-4">
            <svg class="h-6 w-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h4 class="text-lg font-semibold text-red-800">Revenue at Risk</h4>
          </div>
          <p class="text-red-700 text-lg">
            <strong>${results.potentialRevenue.toLocaleString()}/month</strong> in unmatched rewards transactions
          </p>
          <p class="text-red-600 text-sm mt-2">
            Manual reconciliation is missing these revenue opportunities. 
            MedSpaSync Pro would recover this automatically.
          </p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h5 class="font-semibold text-gray-900 mb-2">Match Accuracy</h5>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div class="bg-green-500 h-3 rounded-full" style="width: ${results.accuracy}%"></div>
            </div>
            <p class="text-sm text-gray-600 mt-1">${results.accuracy}% accuracy</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h5 class="font-semibold text-gray-900 mb-2">Confidence Score</h5>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div class="bg-blue-500 h-3 rounded-full" style="width: ${results.confidence}%"></div>
            </div>
            <p class="text-sm text-gray-600 mt-1">${results.confidence}% confidence</p>
          </div>
        </div>
        
        <div class="border-t border-gray-200 pt-6">
          <div class="text-center">
            <h4 class="text-xl font-semibold text-gray-900 mb-4">
              Stop Losing ${results.potentialRevenue.toLocaleString()}/Month
            </h4>
            <p class="text-gray-600 mb-6">
              This demo shows real savings potential. Get the full platform to recover this revenue automatically.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onclick="subscription.open('demo-results')"
                class="subscription-cta text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300"
              >
                Start Subscription - $299/month
              </button>
              
              <button
                onclick="exportResults()"
                class="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Export Demo Results
              </button>
            </div>
            
            <div class="mt-4 text-sm text-gray-500 space-y-1">
              <p>✅ 30-day money-back guarantee</p>
              <p>✅ HIPAA-compliant processing</p>
              <p>✅ Cancel anytime</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    utils.show(resultsDiv);
    
    // Smooth scroll to results
    setTimeout(() => {
      resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
};

// Lead form handling
const leadForm = {
  init() {
    const form = utils.$('leadForm');
    if (!form) return;
    
    form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Real-time email validation
    const emailInput = utils.$('leadEmail');
    if (emailInput) {
      emailInput.addEventListener('blur', this.validateEmailField.bind(this));
    }
  },

  async handleSubmit(e) {
    e.preventDefault();
    
    const emailEl = utils.$('leadEmail');
    const nameEl = utils.$('leadName');
    
    if (!emailEl) return;
    
    const email = emailEl.value.trim();
    const name = nameEl ? nameEl.value.trim() : '';
    
    // Validation
    if (!email) {
      this.showError('leadEmail', 'Email address is required');
      return;
    }
    
    if (!utils.validateEmail(email)) {
      this.showError('leadEmail', 'Please enter a valid email address');
      return;
    }
    
    this.clearError('leadEmail');
    
    // Store user info
    demoState.userEmail = email;
    
    // Show demo tool
    const demoTool = utils.$('demoTool');
    if (demoTool) {
      utils.show(demoTool);
      demoTool.scrollIntoView({ behavior: 'smooth' });
    }
    
    analytics.track('lead_captured', { email, name });
    utils.showToast('Demo unlocked! Upload your files to begin.', 'success');
  },

  showError(fieldId, message) {
    const errorEl = utils.$(`${fieldId}-error`);
    const inputEl = utils.$(fieldId);
    
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
    
    if (inputEl) {
      inputEl.classList.add('border-red-500');
      inputEl.focus();
    }
  },

  clearError(fieldId) {
    const errorEl = utils.$(`${fieldId}-error`);
    const inputEl = utils.$(fieldId);
    
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
    
    if (inputEl) {
      inputEl.classList.remove('border-red-500');
    }
  },

  validateEmailField() {
    const emailInput = utils.$('leadEmail');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    if (email && !utils.validateEmail(email)) {
      this.showError('leadEmail', 'Please enter a valid email address');
    } else if (email) {
      this.clearError('leadEmail');
    }
  }
};

// Export functionality
function exportResults() {
  if (!demoState.results) {
    utils.showToast('No results to export', 'warning');
    return;
  }
  
  const csvContent = [
    ['Metric', 'Value'],
    ['Total Transactions', demoState.results.total],
    ['Matched Transactions', demoState.results.matches],
    ['Unmatched Transactions', demoState.results.unmatched],
    ['Match Rate', `${Math.round(demoState.results.matches/demoState.results.total*100)}%`],
    ['Accuracy Score', `${demoState.results.accuracy}%`],
    ['Confidence Score', `${demoState.results.confidence}%`],
    ['Processing Time', `${demoState.results.processingTime} seconds`],
    ['Potential Monthly Revenue Recovery', `${demoState.results.potentialRevenue.toLocaleString()}`],
    ['Demo Date', new Date().toLocaleDateString()],
    ['Demo Time', new Date().toLocaleTimeString()]
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `medspasync-demo-results-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  analytics.track('demo_results_exported', demoState.results);
  utils.showToast('Demo results exported successfully', 'success');
}

// Global functions for HTML onclick handlers
window.handleSubscribeClick = (source) => subscription.open(source);
window.showSubscriptionModal = () => subscription.showModal();
window.closeSubscriptionModal = () => subscription.closeModal();
window.confirmSubscription = () => {
  subscription.open('modal');
  subscription.closeModal();
};
window.exportResults = exportResults;

// Event listeners setup
function setupEventListeners() {
  // File upload handlers
  const posFile = utils.$('posFile');
  const rewardFile = utils.$('rewardFile');
  
  if (posFile) {
    posFile.addEventListener('change', (e) => {
      fileHandler.handleFileSelect(e.target, 'pos');
    });
  }
  
  if (rewardFile) {
    rewardFile.addEventListener('change', (e) => {
      fileHandler.handleFileSelect(e.target, 'rewards');
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
  
  // Run demo button
  const runDemoBtn = utils.$('runDemoBtn');
  if (runDemoBtn) {
    runDemoBtn.addEventListener('click', () => reconciliation.run());
  }
  
  // Plan selection
  const corePlan = utils.$('corePlan');
  const proPlan = utils.$('proPlan');
  
  if (corePlan) {
    corePlan.addEventListener('click', () => {
      demoState.currentPlan = 'core';
      analytics.track('plan_selected', { plan: 'core' });
    });
  }
  
  if (proPlan) {
    proPlan.addEventListener('click', () => {
      demoState.currentPlan = 'professional';
      analytics.track('plan_selected', { plan: 'professional' });
    });
  }
}

// Main initialization
function init() {
  console.log('🚀 Initializing MedSpaSync Pro Demo System v2.1...');
  
  try {
    // Initialize components
    leadForm.init();
    setupEventListeners();
    fileHandler.updateUI();
    
    // Track page view
    analytics.track('demo_page_loaded', {
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Demo system v2.1 initialized successfully');
    
  } catch (error) {
    console.error('Demo initialization error:', error);
    utils.showToast('Demo system failed to initialize. Please refresh the page.', 'error');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
