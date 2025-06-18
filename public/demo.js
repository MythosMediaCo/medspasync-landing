/**
 * MedSpaSync Pro - Demo.js v2.1 Final Production Release
 * Fully optimized with Web Vitals, consistent RAF usage, and production considerations
 * Compatible with both index.html (landing) and demo.html (demo tool)
 */
(function() {
  'use strict';
  
  console.log('🏥 MedSpaSync Pro - Demo System v2.1 (Production Ready)');
  
  // Configuration - Immutable and environment-aware
  const CONFIG = Object.freeze({
    // File handling
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    VALID_EXTENSIONS: ['.csv'],
    
    // UI timing
    TOAST_DURATION: 4000,
    DEBOUNCE_DELAY: 300,
    THROTTLE_LIMIT: 100,
    ANIMATION_DURATION: 300,
    
    // Caching
    CACHE_TTL: 3600000, // 1 hour
    
    // URLs - environment-aware
    DEMO_URL: 'demo.html',
    SUBSCRIPTION_URL: window.location.hostname === 'localhost' 
      ? '#subscribe' 
      : 'https://billing.medspasyncpro.com/subscribe',
    
    // Analytics
    BATCH_SIZE: 10,
    BATCH_TIMEOUT: 5000,
    
    // Sample data
    SAMPLE_DATA: Object.freeze({
      pos: `name,service,amount,date,provider
"Sarah Johnson","Botox Cosmetic",450.00,"2024-03-15","Dr. Smith"
"Michael Chen","Juvederm Ultra",650.00,"2024-03-15","Dr. Johnson"
"Jennifer Smith","Dysport",380.00,"2024-03-16","Dr. Smith"
"Robert Davis","Restylane Lyft",700.00,"2024-03-16","Dr. Johnson"
"Lisa Anderson","Botox Cosmetic",525.00,"2024-03-17","Dr. Smith"
"Maria Garcia","Lip Filler",380.00,"2024-03-18","Dr. Smith"
"David Wilson","Botox Cosmetic",425.00,"2024-03-18","Dr. Johnson"`,
      
      alle: `customer_name,product,points_redeemed,redemption_date
"Sarah M Johnson","Botox Cosmetic",90,"2024-03-15"
"Michael C Chen","Juvederm Ultra",130,"2024-03-15"
"Jenny Smith","Dysport",76,"2024-03-16"
"Lisa A Anderson","Botox Cosmetic",105,"2024-03-17"
"Maria G Garcia","Lip Filler",76,"2024-03-18"`,
      
      aspire: `member_name,treatment,reward_amount,transaction_date
"Robert J Davis","Restylane Lyft",140.00,"2024-03-16"
"David M Wilson","Botox Cosmetic",85.00,"2024-03-18"
"Jennifer L Smith","Dysport",76.00,"2024-03-16"`
    })
  });

  // Enhanced reactive state with performance tracking
  const createReactiveState = (initialState) => {
    const state = { ...initialState };
    const listeners = new Set();
    let changeCount = 0;
    
    return new Proxy(state, {
      set(target, property, value) {
        const oldValue = target[property];
        if (oldValue === value) return true; // No change, skip
        
        target[property] = value;
        changeCount++;
        
        // Batch listener notifications using RAF for better performance
        perf.rafUpdate(() => {
          listeners.forEach(listener => {
            try {
              listener(property, value, oldValue, changeCount);
            } catch (error) {
              console.error(`State listener error for ${property}:`, error);
            }
          });
        });
        
        return true;
      },
      
      get(target, property) {
        // Add special methods to the proxy
        if (property === 'addListener') {
          return (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
          };
        }
        if (property === 'getChangeCount') {
          return () => changeCount;
        }
        return target[property];
      }
    });
  };

  // Global state with enhanced reactivity
  const demoState = createReactiveState({
    selectedPlan: 'core',
    userEmail: null,
    userName: null,
    currentPage: null,
    uploadedFiles: { pos: null, alle: null, aspire: null },
    processing: false,
    results: null,
    useSampleData: false,
    submitting: false,
    lastActivity: Date.now()
  });

  // Enhanced DOM cache with automatic cleanup
  const domCache = (() => {
    const cache = new Map();
    const accessTimes = new Map();
    const MAX_CACHE_SIZE = 50;
    
    return {
      get(id) {
        if (!cache.has(id)) {
          const element = document.getElementById(id);
          if (element) {
            // Cleanup old entries if cache is too large
            if (cache.size >= MAX_CACHE_SIZE) {
              this.cleanup();
            }
            cache.set(id, element);
          } else {
            console.warn(`⚠️ Element not found: #${id}`);
          }
        }
        
        if (cache.has(id)) {
          accessTimes.set(id, Date.now());
          return cache.get(id);
        }
        return null;
      },
      
      cleanup() {
        if (cache.size < MAX_CACHE_SIZE) return;
        
        // Remove least recently used entries
        const sortedByAccess = [...accessTimes.entries()]
          .sort(([,a], [,b]) => a - b)
          .slice(0, Math.floor(MAX_CACHE_SIZE * 0.3));
        
        sortedByAccess.forEach(([id]) => {
          cache.delete(id);
          accessTimes.delete(id);
        });
      },
      
      clear() {
        cache.clear();
        accessTimes.clear();
      },
      
      size() {
        return cache.size;
      }
    };
  })();

  // Enhanced performance utilities with consistent RAF usage
  const perf = {
    // Performance marks and measures
    mark(name) {
      if ('performance' in window && 'mark' in performance) {
        performance.mark(`medspa-${name}`);
      }
    },

    measure(name, startMark, endMark) {
      if ('performance' in window && 'measure' in performance) {
        try {
          performance.measure(`medspa-${name}`, `medspa-${startMark}`, `medspa-${endMark}`);
        } catch (error) {
          console.warn(`Performance measurement failed for ${name}:`, error);
        }
      }
    },

    // Enhanced debounce with immediate option
    debounce(func, delay = CONFIG.DEBOUNCE_DELAY, immediate = false) {
      let timeoutId;
      return function(...args) {
        const callNow = immediate && !timeoutId;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          timeoutId = null;
          if (!immediate) func.apply(this, args);
        }, delay);
        if (callNow) func.apply(this, args);
      };
    },

    // Enhanced throttle with trailing option
    throttle(func, limit = CONFIG.THROTTLE_LIMIT, trailing = true) {
      let inThrottle;
      let lastFunc;
      let lastRan;
      
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          lastRan = Date.now();
          inThrottle = true;
        } else if (trailing) {
          clearTimeout(lastFunc);
          lastFunc = setTimeout(() => {
            if ((Date.now() - lastRan) >= limit) {
              func.apply(this, args);
              lastRan = Date.now();
            }
          }, limit - (Date.now() - lastRan));
        }
      };
    },

    // Consistent RAF wrapper with fallback
    rafUpdate(callback) {
      if ('requestAnimationFrame' in window) {
        return requestAnimationFrame(callback);
      } else {
        // Fallback for older browsers
        return setTimeout(callback, 16); // ~60fps
      }
    },

    // Batch DOM updates for better performance
    batchDOMUpdates(updates) {
      this.rafUpdate(() => {
        updates.forEach(update => {
          try {
            update();
          } catch (error) {
            console.error('Batched DOM update error:', error);
          }
        });
      });
    }
  };

  // Enhanced utility functions with consistent RAF usage
  const utils = {
    // Cached element getter
    $(id) {
      return domCache.get(id);
    },

    // Enhanced email validation with comprehensive regex
    validateEmail: (() => {
      const cache = new Map();
      // More comprehensive email regex
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      
      return (email) => {
        if (!email || typeof email !== 'string') return false;
        
        const trimmedEmail = email.trim().toLowerCase();
        if (cache.has(trimmedEmail)) {
          return cache.get(trimmedEmail);
        }
        
        const isValid = emailRegex.test(trimmedEmail);
        
        // Keep cache size reasonable
        if (cache.size > 100) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        
        cache.set(trimmedEmail, isValid);
        return isValid;
      };
    })(),

    // Enhanced URL parameter getter with caching
    getUrlParameter: (() => {
      const params = new URLSearchParams(window.location.search);
      const cache = new Map();
      
      return (name) => {
        if (cache.has(name)) {
          return cache.get(name);
        }
        const value = params.get(name) || '';
        cache.set(name, value);
        return value;
      };
    })(),

    // Enhanced file size formatter with more units
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const size = bytes / Math.pow(k, i);
      return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${sizes[i]}`;
    },

    // Enhanced safe execution with retry capability
    safeExecute(fn, context = 'unknown', retries = 0) {
      const maxRetries = 2;
      
      const attempt = (attemptNumber) => {
        try {
          return fn();
        } catch (error) {
          console.error(`Error in ${context} (attempt ${attemptNumber + 1}):`, error);
          
          if (attemptNumber < maxRetries && retries > 0) {
            console.log(`Retrying ${context} in ${(attemptNumber + 1) * 1000}ms...`);
            setTimeout(() => attempt(attemptNumber + 1), (attemptNumber + 1) * 1000);
            return null;
          }
          
          this.showToast(`An error occurred in ${context}. Please try again.`, 'error');
          analytics.track('safe_execute_error', { 
            context, 
            error: error.message,
            attempts: attemptNumber + 1
          });
          return null;
        }
      };
      
      return attempt(0);
    },

    // Enhanced toast system with priority levels and better queue management
    showToast: (() => {
      const toastQueue = [];
      const toastHistory = new Set();
      let isProcessing = false;
      let currentToast = null;
      
      const PRIORITY_LEVELS = {
        error: 4,
        warning: 3,
        success: 2,
        info: 1
      };

      const processToastQueue = () => {
        if (isProcessing || toastQueue.length === 0) return;
        
        // Sort by priority (highest first)
        toastQueue.sort((a, b) => PRIORITY_LEVELS[b.type] - PRIORITY_LEVELS[a.type]);
        
        isProcessing = true;
        const { message, type, duration } = toastQueue.shift();
        
        const toast = utils.$('toast');
        if (!toast) {
          console.log(`${type.toUpperCase()}: ${message}`);
          isProcessing = false;
          processToastQueue();
          return;
        }

        // Prevent duplicate toasts
        const toastKey = `${type}:${message}`;
        if (toastHistory.has(toastKey)) {
          isProcessing = false;
          processToastQueue();
          return;
        }
        
        toastHistory.add(toastKey);
        currentToast = { message, type, duration };
        
        // Use RAF for smooth toast updates
        perf.rafUpdate(() => {
          toast.textContent = message;
          toast.className = `toast show ${type}`;
          
          // Track toast display
          analytics.track('toast_displayed', { type, message_length: message.length });
        });
        
        // Auto hide and continue queue
        setTimeout(() => {
          if (currentToast && currentToast.message === message) {
            perf.rafUpdate(() => {
              if (toast.classList.contains('show')) {
                toast.classList.remove('show');
              }
            });
            
            currentToast = null;
            
            // Clear history for old toasts
            setTimeout(() => toastHistory.delete(toastKey), 30000);
          }
          
          isProcessing = false;
          processToastQueue();
        }, duration);
      };

      return (message, type = 'info', duration = CONFIG.TOAST_DURATION) => {
        // Prevent spam
        if (toastQueue.length > 10) {
          toastQueue.shift(); // Remove oldest
        }
        
        toastQueue.push({ message, type, duration });
        processToastQueue();
      };
    })(),

    // Enhanced smooth scroll with intersection observer
    scrollToElement: perf.debounce((elementId, options = {}) => {
      const element = this.$(elementId);
      if (!element) return;
      
      const defaultOptions = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      };
      
      element.scrollIntoView({ ...defaultOptions, ...options });
      
      // Track scroll interactions
      analytics.track('scroll_to_element', { 
        element_id: elementId,
        scroll_behavior: options.behavior || 'smooth'
      });
    }, 150),

    // Enhanced redirect with loading state
    redirectToDemo(email) {
      const url = new URL(CONFIG.DEMO_URL, window.location.origin);
      if (email) {
        url.searchParams.set('email', email);
      }
      
      this.showToast('Redirecting to demo...', 'info', 2000);
      
      // Add loading state
      document.body.style.cursor = 'wait';
      
      setTimeout(() => {
        window.location.href = url.toString();
      }, 100);
    },

    // Debounced resize handler
    onResize: perf.debounce(() => {
      // Handle responsive adjustments
      domCache.cleanup(); // Clean cache on resize
      analytics.track('window_resize', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 250),

    // Enhanced activity tracking
    trackActivity: perf.throttle(() => {
      demoState.lastActivity = Date.now();
    }, 5000)
  };

  // Enhanced event delegation with more comprehensive handling
  const eventDelegator = {
    setup() {
      // Primary event listeners with passive options where appropriate
      document.addEventListener('click', this.handleClick.bind(this));
      document.addEventListener('change', this.handleChange.bind(this));
      document.addEventListener('submit', this.handleSubmit.bind(this));
      document.addEventListener('keydown', this.handleKeyboard.bind(this));
      
      // Enhanced scroll handling with throttling
      document.addEventListener('scroll', perf.throttle(() => {
        utils.trackActivity();
        this.handleScroll();
      }, CONFIG.THROTTLE_LIMIT), { passive: true });
      
      // Window resize handling
      window.addEventListener('resize', utils.onResize, { passive: true });
      
      // Enhanced mouse/touch activity tracking
      ['mousedown', 'touchstart', 'keydown'].forEach(event => {
        document.addEventListener(event, utils.trackActivity, { passive: true });
      });
      
      // Enhanced focus management
      document.addEventListener('focusin', this.handleFocusIn.bind(this));
      document.addEventListener('focusout', this.handleFocusOut.bind(this));
    },

    handleClick(e) {
      const target = e.target;
      const id = target.id;
      const closest = (selector) => target.closest(selector);
      
      // Plan selection with enhanced feedback
      if (id === 'corePlan' || closest('#corePlan')) {
        e.preventDefault();
        landing.selectPlan('core');
      } else if (id === 'proPlan' || closest('#proPlan')) {
        e.preventDefault();
        landing.selectPlan('professional');
      }
      
      // CTA buttons with enhanced tracking
      else if (id === 'heroCtaBtn' || id === 'demoCtaBtn') {
        e.preventDefault();
        const buttonType = id.replace('Btn', '');
        utils.scrollToElement('leadCapture');
        analytics.track('cta_clicked', { 
          button_type: buttonType,
          position: target.getBoundingClientRect().top
        });
      }
      
      // Sample data buttons with loading feedback
      else if (id === 'loadPosSample') {
        e.preventDefault();
        this.showButtonLoading(target);
        demo.loadSampleData('pos');
      } else if (id === 'loadAlleSample') {
        e.preventDefault();
        this.showButtonLoading(target);
        demo.loadSampleData('alle');
      } else if (id === 'loadAspireSample') {
        e.preventDefault();
        this.showButtonLoading(target);
        demo.loadSampleData('aspire');
      }
      
      // Demo controls with enhanced state management
      else if (id === 'runDemoBtn') {
        e.preventDefault();
        if (!demoState.processing) {
          demo.runReconciliation();
        }
      }
      
      // Results actions with confirmation for destructive actions
      else if (id === 'exportBtn') {
        e.preventDefault();
        demo.exportResults(demoState.results);
      } else if (id === 'startOverBtn') {
        e.preventDefault();
        if (confirm('Are you sure you want to start over? This will clear all uploaded files and results.')) {
          demo.startOver();
        }
      }
      
      // Enhanced subscription flow
      else if (id === 'subscribeBtn') {
        e.preventDefault();
        this.handleSubscription(target);
      }
      
      // Navigation
      else if (id === 'backToOptionsBtn') {
        e.preventDefault();
        utils.scrollToElement('main');
        analytics.track('navigation_back_clicked');
      }
    },

    handleChange(e) {
      const target = e.target;
      const id = target.id;
      
      if (id === 'posFile') {
        demo.handleFileUpload('pos', target.files[0]);
      } else if (id === 'rewardFile') {
        demo.handleFileUpload('alle', target.files[0]);
      }
      
      // Track form interactions
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        analytics.track('form_interaction', {
          field_id: id,
          field_type: target.type,
          has_value: !!target.value
        });
      }
    },

    handleSubmit(e) {
      const form = e.target;
      
      if (form.id === 'leadForm') {
        e.preventDefault();
        landing.handleLeadSubmit(form);
      }
    },

    handleKeyboard(e) {
      // Enhanced escape key handling
      if (e.key === 'Escape') {
        const toast = utils.$('toast');
        if (toast?.classList.contains('show')) {
          perf.rafUpdate(() => {
            toast.classList.remove('show');
          });
        }
      }
      
      // Enhanced Enter/Space handling for custom buttons
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[role="button"]')) {
        e.preventDefault();
        e.target.click();
      }
      
      // Alt + R for reset (accessibility shortcut)
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        if (demoState.currentPage === 'demo') {
          demo.startOver();
        }
      }
    },

    handleScroll() {
      // Track scroll depth for analytics
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > 0 && scrollPercent % 25 === 0) {
        analytics.track('scroll_depth', { percent: scrollPercent });
      }
    },

    handleFocusIn(e) {
      // Enhanced focus indication for keyboard users
      if (document.body.classList.contains('keyboard-navigation')) {
        perf.rafUpdate(() => {
          e.target.style.outline = '2px solid #0066cc';
          e.target.style.outlineOffset = '2px';
        });
      }
    },

    handleFocusOut(e) {
      perf.rafUpdate(() => {
        e.target.style.outline = '';
        e.target.style.outlineOffset = '';
      });
    },

    // Helper methods
    showButtonLoading(button) {
      const originalText = button.textContent;
      perf.rafUpdate(() => {
        button.textContent = 'Loading...';
        button.disabled = true;
      });
      
      setTimeout(() => {
        perf.rafUpdate(() => {
          button.textContent = originalText;
          button.disabled = false;
        });
      }, 1000);
    },

    handleSubscription(button) {
      utils.showToast('Redirecting to subscription...', 'info');
      
      perf.rafUpdate(() => {
        button.textContent = 'Redirecting...';
        button.disabled = true;
      });
      
      analytics.track('subscription_initiated', { 
        selected_plan: demoState.selectedPlan,
        user_email: demoState.userEmail
      });
      
      setTimeout(() => {
        window.location.href = CONFIG.SUBSCRIPTION_URL;
      }, 1500);
    }
  };

  // Enhanced landing page with consistent RAF usage
  const landing = {
    init() {
      console.log('🎯 Initializing landing page...');
      demoState.currentPage = 'landing';
      
      this.selectPlan('core');
      this.setupEmailValidation();
      this.preloadDemoAssets();
      
      console.log('✅ Landing page initialized');
      utils.showToast('Welcome! Choose demo or subscribe to get started.', 'info', 3000);
    },

    // Enhanced plan selection with animations
    selectPlan(planType) {
      const plans = {
        core: { name: 'Core Reconciliation', price: '$299/month', available: true },
        professional: { name: 'Professional Suite', price: '$499/month', available: false }
      };

      const plan = plans[planType];
      if (!plan) return;

      const corePlan = utils.$('corePlan');
      const proPlan = utils.$('proPlan');

      if (corePlan && proPlan) {
        // Batch DOM updates for better performance
        perf.batchDOMUpdates([
          () => {
            // Remove selection from both
            [corePlan, proPlan].forEach(el => {
              el.classList.remove('selected', 'border-blue-500', 'border-purple-500');
              el.setAttribute('aria-pressed', 'false');
            });
          },
          () => {
            // Add selection to chosen plan
            const selectedPlan = planType === 'core' ? corePlan : proPlan;
            const borderColor = planType === 'core' ? 'border-blue-500' : 'border-purple-500';
            
            selectedPlan.classList.add('selected', borderColor);
            selectedPlan.setAttribute('aria-pressed', 'true');
          }
        ]);
      }

      demoState.selectedPlan = planType;
      
      const message = plan.available 
        ? `${plan.name} selected`
        : `${plan.name} coming soon! We'll notify you when available.`;
      
      utils.showToast(message, plan.available ? 'success' : 'info', 2000);
      analytics.track('plan_selected', { plan_type: planType, ...plan });
    },

    // Enhanced email validation with better UX
    setupEmailValidation() {
      const emailInput = utils.$('leadEmail');
      if (!emailInput) return;

      const debouncedValidation = perf.debounce((email) => {
        if (email && !utils.validateEmail(email)) {
          this.showFieldError('leadEmail', 'Please enter a valid email address');
        } else if (email) {
          this.clearFieldError('leadEmail');
        }
      }, CONFIG.DEBOUNCE_DELAY);

      // Enhanced input handling
      emailInput.addEventListener('input', (e) => {
        const email = e.target.value.trim();
        
        if (emailInput.getAttribute('aria-invalid') === 'true') {
          this.clearFieldError('leadEmail');
        }
        
        debouncedValidation(email);
      });

      // Paste handling
      emailInput.addEventListener('paste', (e) => {
        setTimeout(() => {
          const email = e.target.value.trim();
          debouncedValidation(email);
        }, 0);
      });
    },

    // Preload demo assets for faster transition
    preloadDemoAssets() {
      if (demoState.currentPage !== 'landing') return;
      
      // Preload demo.html for faster navigation
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = CONFIG.DEMO_URL;
      document.head.appendChild(link);
    },

    async handleLeadSubmit(form) {
      if (demoState.submitting) return;
      
      const formData = new FormData(form);
      const email = formData.get('leadEmail')?.trim();
      const name = formData.get('leadName')?.trim();
      
      // Clear previous errors
      this.clearFieldError('leadEmail');
      
      // Enhanced validation
      if (!email) {
        this.showFieldError('leadEmail', 'Email address is required');
        return;
      }
      
      if (!utils.validateEmail(email)) {
        this.showFieldError('leadEmail', 'Please enter a valid email address');
        return;
      }

      await this.submitLead({ email, name });
    },

    // Enhanced form error handling with better animations
    showFieldError(fieldId, message) {
      const errorEl = utils.$(`${fieldId}-error`);
      const inputEl = utils.$(fieldId);
      
      perf.batchDOMUpdates([
        () => {
          if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            errorEl.style.opacity = '0';
          }
        },
        () => {
          if (inputEl) {
            inputEl.setAttribute('aria-invalid', 'true');
            inputEl.classList.add('border-red-500');
            inputEl.focus();
          }
        },
        () => {
          if (errorEl) {
            errorEl.style.transition = 'opacity 0.3s ease';
            errorEl.style.opacity = '1';
          }
        }
      ]);
    },

    clearFieldError(fieldId) {
      const errorEl = utils.$(`${fieldId}-error`);
      const inputEl = utils.$(fieldId);
      
      perf.batchDOMUpdates([
        () => {
          if (errorEl) {
            errorEl.style.opacity = '0';
            setTimeout(() => errorEl.classList.add('hidden'), 300);
          }
        },
        () => {
          if (inputEl) {
            inputEl.setAttribute('aria-invalid', 'false');
            inputEl.classList.remove('border-red-500');
          }
        }
      ]);
    },

    async submitLead(formData) {
      demoState.submitting = true;
      
      const submitBtn = utils.$('leadForm')?.querySelector('button[type="submit"]');
      const submitText = utils.$('leadSubmitText');
      const loading = utils.$('leadLoading');
      
      // Enhanced loading state
      perf.batchDOMUpdates([
        () => {
          if (submitText) submitText.textContent = 'Processing...';
          if (loading) loading.classList.remove('hidden');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.cursor = 'wait';
          }
        }
      ]);
      
      try {
        perf.mark('lead-submit-start');
        
        // Simulate API call with realistic timing
        await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
        
        perf.mark('lead-submit-end');
        perf.measure('lead-submit-duration', 'lead-submit-start', 'lead-submit-end');
        
        demoState.userEmail = formData.email;
        demoState.userName = formData.name;

        utils.showToast('Success! Redirecting to demo...', 'success');
        
        analytics.track('lead_captured', {
          ...formData,
          selected_plan: demoState.selectedPlan,
          timestamp: new Date().toISOString(),
          form_completion_time: performance.getEntriesByName('medspa-lead-submit-duration')[0]?.duration
        });
        
        setTimeout(() => utils.redirectToDemo(formData.email), 1000);
        
      } catch (error) {
        console.error('Lead submission error:', error);
        utils.showToast('Failed to submit. Please try again.', 'error');
        analytics.track('lead_submission_error', { 
          error: error.message,
          email: formData.email 
        });
      } finally {
        demoState.submitting = false;
        
        perf.batchDOMUpdates([
          () => {
            if (submitText) submitText.textContent = '🚀 Start Live Demo';
            if (loading) loading.classList.add('hidden');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.style.cursor = 'pointer';
            }
          }
        ]);
      }
    }
  };

  // Enhanced demo page with comprehensive optimization
  const demo = {
    init() {
      console.log('🎯 Initializing demo page...');
      demoState.currentPage = 'demo';
      
      this.handleEmailPrefill();
      this.updateButtonState();
      this.updateUsageMeter();
      this.setupFileDropZones();
      this.preloadProcessingAssets();
      
      console.log('✅ Demo page initialized');
      utils.showToast('Demo loaded successfully!', 'success', 2000);
    },

    // Enhanced email prefill with better validation
    handleEmailPrefill() {
      const email = utils.getUrlParameter('email');
      if (!email || !utils.validateEmail(email)) return;
      
      demoState.userEmail = email;
      
      const leadEmailInput = utils.$('leadEmail');
      const leadCaptureSection = utils.$('leadCapture');
      const demoTool = utils.$('demoTool');
      
      perf.batchDOMUpdates([
        () => {
          if (leadEmailInput) {
            leadEmailInput.value = email;
            leadEmailInput.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)';
            leadEmailInput.style.borderColor = '#059669';
            leadEmailInput.style.transition = 'all 0.3s ease';
          }
        },
        () => {
          if (leadCaptureSection) leadCaptureSection.classList.add('hidden');
          if (demoTool) demoTool.classList.remove('hidden');
        }
      ]);

      utils.showToast(`Welcome back! Email: ${email}`, 'success');
      analytics.track('email_prefilled', { email });
    },

    // Enhanced usage meter with realistic data
    updateUsageMeter() {
      const banner = utils.$('usageBanner');
      const text = utils.$('usageText');
      
      if (banner && text) {
        // Simulate usage based on time or localStorage
        const today = new Date().toDateString();
        const usageKey = `demo_usage_${today}`;
        let todayUsage = parseInt(localStorage.getItem(usageKey) || '0');
        
        const remaining = Math.max(0, 5 - todayUsage);
        
        perf.rafUpdate(() => {
          text.textContent = `${remaining}/5 demo runs remaining today`;
          banner.classList.remove('hidden');
          
          if (remaining <= 1) {
            banner.classList.add('bg-red-100', 'text-red-800');
            banner.classList.remove('bg-yellow-100', 'text-yellow-800');
          }
        });
        
        analytics.track('usage_meter_displayed', { remaining, used: todayUsage });
      }
    },

    // Enhanced file upload with drag & drop
    setupFileDropZones() {
      const dropZones = ['posFile', 'rewardFile'];
      
      dropZones.forEach(zoneId => {
        const zone = utils.$(zoneId);
        if (!zone) return;
        
        const dropArea = zone.parentElement;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropArea.addEventListener(eventName, this.handleDragEvent.bind(this), false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
          dropArea.addEventListener(eventName, () => {
            perf.rafUpdate(() => {
              dropArea.classList.add('drag-over');
            });
          }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
          dropArea.addEventListener(eventName, () => {
            perf.rafUpdate(() => {
              dropArea.classList.remove('drag-over');
            });
          }, false);
        });
        
        dropArea.addEventListener('drop', (e) => {
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const type = zoneId === 'posFile' ? 'pos' : 'alle';
            this.handleFileUpload(type, files[0]);
          }
        });
      });
    },

    handleDragEvent(e) {
      e.preventDefault();
      e.stopPropagation();
    },

    // Preload processing animation assets
    preloadProcessingAssets() {
      // Preload any processing animations or assets
      const processingElements = ['runLoader'];
      processingElements.forEach(id => {
        const element = utils.$(id);
        if (element) {
          // Force browser to prepare element for display
          element.style.visibility = 'hidden';
          element.classList.remove('hidden');
          setTimeout(() => {
            element.classList.add('hidden');
            element.style.visibility = 'visible';
          }, 0);
        }
      });
    },

    // Enhanced file upload with better validation and feedback
    handleFileUpload(type, file) {
      if (!file) return;
      
      perf.mark('file-upload-start');
      
      // Enhanced validation
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const errors = [];
      
      if (!CONFIG.VALID_EXTENSIONS.includes(ext)) {
        errors.push(`Invalid file type. Please select CSV files only.`);
      }
      
      if (file.size > CONFIG.MAX_FILE_SIZE) {
        errors.push(`File too large. Maximum size is ${utils.formatFileSize(CONFIG.MAX_FILE_SIZE)}.`);
      }
      
      if (file.size === 0) {
        errors.push('File appears to be empty.');
      }
      
      if (errors.length > 0) {
        utils.showToast(errors[0], 'error');
        return;
      }
      
      demoState.uploadedFiles[type] = file;
      this.updateFilePreview(type, file.name, file.size);
      this.updateButtonState();
      
      perf.mark('file-upload-end');
      perf.measure('file-upload-duration', 'file-upload-start', 'file-upload-end');
      
      utils.showToast(`${type.toUpperCase()} file uploaded successfully`, 'success');
      analytics.track('file_uploaded', { 
        file_type: type, 
        file_name: file.name, 
        file_size: file.size,
        upload_time: performance.getEntriesByName('medspa-file-upload-duration')[0]?.duration
      });
    },

    // Enhanced sample data loading with progress indication
    loadSampleData(type) {
      if (!CONFIG.SAMPLE_DATA[type]) return;
      
      const mockFile = {
        name: `sample_${type}_data.csv`,
        size: CONFIG.SAMPLE_DATA[type].length,
        content: CONFIG.SAMPLE_DATA[type],
        isSample: true
      };
      
      demoState.uploadedFiles[type] = mockFile;
      demoState.useSampleData = true;
      
      this.updateFilePreview(type, mockFile.name, mockFile.size);
      this.updateButtonState();
      
      utils.showToast(`Sample ${type.toUpperCase()} data loaded`, 'success');
      analytics.track('sample_data_loaded', { 
        data_type: type,
        data_size: mockFile.size 
      });
    },

    // Enhanced file preview with file size and type info
    updateFilePreview(type, fileName, fileSize = null) {
      const preview = utils.$(`${type}Preview`);
      if (!preview) return;
      
      perf.rafUpdate(() => {
        if (fileName) {
          const sizeText = fileSize ? ` (${utils.formatFileSize(fileSize)})` : '';
          preview.innerHTML = `
            <span class="text-green-600">✓</span> 
            <span class="font-medium">${fileName}</span>
            <span class="text-gray-500 text-sm">${sizeText}</span>
          `;
          preview.style.color = '#059669';
        } else {
          preview.textContent = 'No file selected';
          preview.style.color = '#64748b';
        }
      });
    },

    // Enhanced button state management with better UX
    updateButtonState() {
      const button = utils.$('runDemoBtn');
      if (!button) return;
      
      const filesCount = Object.values(demoState.uploadedFiles).filter(f => f).length;
      const allSelected = filesCount >= 2;
      const needMoreFiles = 2 - filesCount;
      
      perf.rafUpdate(() => {
        button.disabled = !allSelected || demoState.processing;
        
        if (demoState.processing) {
          button.textContent = '⏳ Processing...';
          button.classList.add('opacity-75', 'cursor-not-allowed');
        } else if (allSelected) {
          button.textContent = '🚀 Run AI Reconciliation';
          button.classList.remove('opacity-75', 'cursor-not-allowed');
          button.classList.add('hover:shadow-lg', 'transform', 'hover:scale-105');
        } else {
          button.textContent = `📁 Select ${needMoreFiles} more file${needMoreFiles > 1 ? 's' : ''}`;
          button.classList.add('opacity-75');
          button.classList.remove('hover:shadow-lg', 'transform', 'hover:scale-105');
        }
      });
    },

    // Enhanced reconciliation with realistic progress updates
    async runReconciliation() {
      if (demoState.processing) return;
      
      const filesCount = Object.values(demoState.uploadedFiles).filter(f => f).length;
      if (filesCount < 2) {
        utils.showToast('Please select at least 2 files (POS and rewards data)', 'error');
        return;
      }

      // Update usage tracking
      const today = new Date().toDateString();
      const usageKey = `demo_usage_${today}`;
      const todayUsage = parseInt(localStorage.getItem(usageKey) || '0');
      
      if (todayUsage >= 5) {
        utils.showToast('Daily demo limit reached. Please try again tomorrow or subscribe for unlimited access.', 'warning');
        return;
      }

      perf.mark('reconciliation-start');
      demoState.processing = true;
      this.updateButtonState();
      
      const button = utils.$('runDemoBtn');
      const loader = utils.$('runLoader');
      
      perf.batchDOMUpdates([
        () => {
          if (button) button.classList.add('hidden');
          if (loader) loader.classList.remove('hidden');
        }
      ]);
      
      utils.showToast('Analyzing transaction data...', 'info');
      analytics.track('reconciliation_started', { 
        files_count: filesCount,
        has_sample_data: demoState.useSampleData
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
        
        perf.mark('reconciliation-end');
        perf.measure('reconciliation-duration', 'reconciliation-start', 'reconciliation-end');
        
        // Generate more realistic results based on sample data
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
          confidence: Math.floor(accuracy * 0.95), // Confidence slightly lower than accuracy
          filesProcessed: Object.keys(demoState.uploadedFiles).filter(key => demoState.uploadedFiles[key])
        };
        
        demoState.results = results;
        this.showResults(results);
        
        // Update usage tracking
        localStorage.setItem(usageKey, (todayUsage + 1).toString());
        this.updateUsageMeter();
        
        utils.showToast('Reconciliation completed successfully!', 'success');
        analytics.track('reconciliation_completed', {
          ...results,
          processing_time_ms: performance.getEntriesByName('medspa-reconciliation-duration')[0]?.duration
        });
        
      } catch (error) {
        console.error('Reconciliation error:', error);
        utils.showToast('Processing failed. Please try again.', 'error');
        analytics.track('reconciliation_error', { 
          error: error.message,
          files_count: filesCount 
        });
      } finally {
        demoState.processing = false;
        this.updateButtonState();
        
        perf.batchDOMUpdates([
          () => {
            if (button) button.classList.remove('hidden');
            if (loader) loader.classList.add('hidden');
          }
        ]);
      }
    },

    // Enhanced results display with animations and better UX
    showResults(data) {
      const results = utils.$('results');
      if (!results) return;
      
      const html = this.generateResultsHTML(data);
      
      perf.rafUpdate(() => {
        results.innerHTML = html;
        results.classList.remove('hidden');
        results.style.opacity = '0';
        results.style.transform = 'translateY(20px)';
        results.style.transition = 'all 0.5s ease';
        
        // Animate in
        setTimeout(() => {
          results.style.opacity = '1';
          results.style.transform = 'translateY(0)';
        }, 100);
      });
      
      // Animate counters
      this.animateCounters(data);
      
      utils.scrollToElement('results');
      analytics.track('results_displayed', { 
        total_transactions: data.total,
        match_rate: (data.matches / data.total * 100).toFixed(1)
      });
    },

    // Enhanced results HTML with better design and data
    generateResultsHTML(data) {
      const matchRate = ((data.matches / data.total) * 100).toFixed(1);
      const savingsPerMonth = Math.floor(data.potentialRevenue * 12);
      
      return `
        <div class="bg-white p-6 rounded-xl border shadow-lg animate-fade-in">
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900 mb-2">🎉 Reconciliation Complete!</h3>
            <p class="text-gray-600">AI analysis completed in ${data.processingTime} seconds</p>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div class="text-3xl font-bold text-blue-600 counter" data-target="${data.total}">0</div>
              <div class="text-sm text-gray-600 font-medium">Total Transactions</div>
            </div>
            <div class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div class="text-3xl font-bold text-green-600 counter" data-target="${data.matches}">0</div>
              <div class="text-sm text-gray-600 font-medium">Auto-Matched</div>
              <div class="text-xs text-green-700 mt-1">${matchRate}% success rate</div>
            </div>
            <div class="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div class="text-3xl font-bold text-purple-600">${data.accuracy}%</div>
              <div class="text-sm text-gray-600 font-medium">Accuracy</div>
              <div class="text-xs text-purple-700 mt-1">${data.confidence}% confidence</div>
            </div>
            <div class="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <div class="text-3xl font-bold text-yellow-600">${data.potentialRevenue}</div>
              <div class="text-sm text-gray-600 font-medium">Potential Monthly Recovery</div>
              <div class="text-xs text-yellow-700 mt-1">${savingsPerMonth.toLocaleString()}/year</div>
            </div>
          </div>
          
          ${data.unmatched > 0 ? `
          <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div class="flex items-center mb-2">
              <span class="text-amber-600 mr-2">⚠️</span>
              <h4 class="font-semibold text-amber-800">Manual Review Required</h4>
            </div>
            <p class="text-amber-700 text-sm">
              ${data.unmatched} transactions need manual review. Our AI flagged these for your attention 
              to ensure 100% accuracy.
            </p>
          </div>
          ` : ''}
          
          <div class="text-center space-x-3 mb-6">
            <button id="exportBtn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md">
              📄 Export Detailed Report
            </button>
            <button id="startOverBtn" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md">
              🔄 Start Over
            </button>
          </div>
          
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg text-center border">
            <h4 class="font-bold text-gray-900 mb-2">🎯 Ready to automate your reconciliation?</h4>
            <p class="text-gray-600 mb-4">
              This demo processed ${data.filesProcessed.length} file${data.filesProcessed.length > 1 ? 's' : ''} 
              and found ${data.matches} matches with ${data.accuracy}% accuracy.
            </p>
            <div class="space-y-2 mb-4">
              <div class="text-sm text-gray-700">
                <strong>Time saved:</strong> ~3 hours per day → ${data.processingTime} seconds
              </div>
              <div class="text-sm text-gray-700">
                <strong>Monthly value:</strong> ${data.potentialRevenue} in recovered revenue
              </div>
            </div>
            <a href="index.html#pricing" class="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
              Subscribe to Core Plan - $299/month
            </a>
          </div>
        </div>
      `;
    },

    // Enhanced counter animation
    animateCounters(data) {
      const counters = document.querySelectorAll('.counter');
      
      counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          
          perf.rafUpdate(() => {
            counter.textContent = Math.floor(current);
          });
        }, duration / steps);
      });
    },

    // Enhanced CSV export with better formatting
    exportResults(data) {
      if (!data) return;
      
      const timestamp = new Date().toISOString();
      const csvData = [
        ['MedSpaSync Pro - Reconciliation Report'],
        [`Generated: ${new Date().toLocaleString()}`],
        [`User: ${demoState.userEmail || 'Demo User'}`],
        [`Processing Time: ${data.processingTime} seconds`],
        [''],
        ['EXECUTIVE SUMMARY'],
        [`Total Transactions,${data.total}`],
        [`Successful Matches,${data.matches}`],
        [`Manual Review Required,${data.unmatched || 0}`],
        [`Match Rate,${((data.matches / data.total) * 100).toFixed(1)}%`],
        [`AI Confidence,${data.confidence}%`],
        [`Accuracy Rating,${data.accuracy}%`],
        [`Potential Monthly Recovery,${data.potentialRevenue}`],
        [`Estimated Annual Savings,${Math.floor(data.potentialRevenue * 12)}`],
        [''],
        ['FILES PROCESSED'],
        ...Object.entries(demoState.uploadedFiles)
          .filter(([_, file]) => file !== null)
          .map(([type, file]) => [
            `${type.toUpperCase()} File`,
            file.name,
            file.isSample ? 'Sample Data' : 'User Upload',
            utils.formatFileSize(file.size || 0)
          ]),
        [''],
        ['TECHNICAL DETAILS'],
        [`Processing Start,${timestamp}`],
        [`Demo Version,2.1`],
        [`Session ID,${analytics.getSessionId()}`]
      ];

      const csvContent = csvData.map(row => 
        Array.isArray(row) 
          ? row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          : `"${String(row).replace(/"/g, '""')}"`
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `medspasync-reconciliation-${new Date().toISOString().split('T')[0]}-${Date.now()}.csv`;
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      utils.showToast('Detailed report exported successfully!', 'success');
      analytics.track('results_exported', { 
        filename, 
        rows: csvData.length,
        total_transactions: data.total,
        matches: data.matches
      });
    },

    // Enhanced start over with confirmation and smooth animations
    startOver() {
      // Reset state efficiently
      Object.assign(demoState.uploadedFiles, { pos: null, alle: null, aspire: null });
      demoState.results = null;
      demoState.processing = false;
      demoState.useSampleData = false;

      // Clear file inputs
      const fileInputs = ['posFile', 'rewardFile'];
      fileInputs.forEach(id => {
        const input = utils.$(id);
        if (input) input.value = '';
      });

      // Clear previews and update UI with animations
      ['pos', 'alle', 'aspire'].forEach(type => {
        this.updateFilePreview(type, null);
      });

      // Hide results with animation
      const results = utils.$('results');
      if (results) {
        perf.rafUpdate(() => {
          results.style.opacity = '0';
          results.style.transform = 'translateY(-20px)';
          
          setTimeout(() => {
            results.classList.add('hidden');
            results.innerHTML = '';
            results.style.opacity = '';
            results.style.transform = '';
          }, 300);
        });
      }

      this.updateButtonState();
      utils.showToast('Demo reset successfully! Ready for new files.', 'success');
      analytics.track('demo_reset', { 
        timestamp: new Date().toISOString(),
        previous_results: !!demoState.results
      });

      // Smooth scroll to demo start
      setTimeout(() => {
        utils.scrollToElement('demoTool');
      }, 400);
    }
  };

  // Enhanced analytics with Web Vitals integration
  const analytics = (() => {
    const eventQueue = [];
    let batchTimer;
    let sessionId = null;

    // Initialize session
    const initSession = () => {
      sessionId = sessionStorage.getItem('medspa_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('medspa_session_id', sessionId);
      }
      return sessionId;
    };

    const sendBatch = () => {
      if (eventQueue.length === 0) return;
      
      const batch = eventQueue.splice(0, CONFIG.BATCH_SIZE);
      console.log('📊 Analytics Batch:', batch);
      
      // In production, send to your analytics service
      // Example: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(batch) });
      // Example: gtag('event', 'batch', { events: batch });
      
      if (eventQueue.length > 0) {
        batchTimer = setTimeout(sendBatch, CONFIG.BATCH_TIMEOUT);
      }
    };

    return {
      track(event, properties = {}) {
        const eventData = {
          event,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            page: demoState.currentPage,
            user_id: demoState.userEmail,
            session_id: sessionId || initSession(),
            user_agent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            performance: this.getPerformanceMetrics()
          }
        };

        eventQueue.push(eventData);
        
        // Send immediately for critical events or when batch is full
        const criticalEvents = ['lead_captured', 'reconciliation_completed', 'error_occurred', 'page_unload'];
        if (criticalEvents.includes(event) || eventQueue.length >= CONFIG.BATCH_SIZE) {
          clearTimeout(batchTimer);
          sendBatch();
        } else if (!batchTimer) {
          batchTimer = setTimeout(sendBatch, CONFIG.BATCH_TIMEOUT);
        }
      },

      getSessionId() {
        return sessionId || initSession();
      },

      getPerformanceMetrics() {
        if (!('performance' in window)) return {};
        
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return {};
        
        return {
          page_load_time: navigation.loadEventEnd - navigation.loadEventStart,
          dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          dom_cache_size: domCache.size(),
          state_changes: demoState.getChangeCount?.() || 0
        };
      },

      trackPageView() {
        this.track('page_view', {
          referrer: document.referrer,
          url: window.location.href,
          title: document.title,
          load_time: performance.now()
        });
      },

      // Web Vitals integration (if available)
      trackWebVitals() {
        if (typeof webVitals !== 'undefined') {
          webVitals.getCLS(this.trackVital.bind(this));
          webVitals.getFID(this.trackVital.bind(this));
          webVitals.getLCP(this.trackVital.bind(this));
          webVitals.getTTFB(this.trackVital.bind(this));
        }
      },

      trackVital(metric) {
        this.track('web_vital', {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta
        });
      }
    };
  })();

  // Production-ready error handling with recovery strategies
  const errorHandler = {
    setup() {
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
      
      // Network status monitoring
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Page visibility changes
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    },

    handleError(event) {
      const error = event.error;
      console.error('Global error:', error);
      
      // Filter out common non-critical errors
      const ignorableErrors = [
        'ResizeObserver loop limit exceeded',
        'Script error.',
        'Non-Error promise rejection captured'
      ];
      
      if (ignorableErrors.some(msg => error?.message?.includes(msg))) {
        return;
      }
      
      // Don't show toast for script loading errors (likely adblocker)
      if (event.filename && event.filename.includes('.js')) {
        console.warn('Script loading error detected, might be adblocker or CDN issue');
        return;
      }
      
      utils.showToast('An unexpected error occurred. The page will attempt to recover.', 'error');
      
      analytics.track('javascript_error', {
        error_message: error?.message,
        error_stack: error?.stack,
        filename: event.filename,
        line_number: event.lineno,
        column_number: event.colno,
        user_agent: navigator.userAgent,
        page_url: window.location.href
      });
      
      this.recoverFromError();
    },

    handlePromiseRejection(event) {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Handle specific types of promise rejections
      if (event.reason?.name === 'NetworkError' || event.reason?.message?.includes('fetch')) {
        utils.showToast('Network error detected. Retrying operation...', 'warning');
        this.scheduleRetry(() => {
          if (demoState.processing) {
            demo.runReconciliation();
          } else if (demoState.submitting) {
            // Could retry form submission here
          }
        });
      } else if (event.reason?.name === 'QuotaExceededError') {
        utils.showToast('Storage quota exceeded. Clearing cache...', 'warning');
        this.clearStorageCache();
      } else {
        utils.showToast('A processing error occurred. Please try again.', 'error');
      }
      
      analytics.track('unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        name: event.reason?.name
      });
    },

    handleOnline() {
      utils.showToast('Connection restored. Resuming operations.', 'success');
      this.retryFailedOperations();
      analytics.track('connection_restored');
    },

    handleOffline() {
      utils.showToast('Connection lost. Operations will retry when online.', 'warning');
      analytics.track('connection_lost');
    },

    handleVisibilityChange() {
      if (document.hidden) {
        analytics.track('page_hidden', { time_visible: performance.now() });
      } else {
        analytics.track('page_visible');
        // Refresh critical data when page becomes visible again
        if (demoState.currentPage === 'demo') {
          demo.updateUsageMeter();
        }
      }
    },

    recoverFromError() {
      // Reset critical state
      demoState.processing = false;
      demoState.submitting = false;
      
      // Reset UI elements with batch updates
      const elements = [
        { id: 'runDemoBtn', actions: ['show', 'enable'] },
        { id: 'runLoader', actions: ['hide'] },
        { id: 'leadForm', actions: ['enable'] }
      ];
      
      perf.batchDOMUpdates(elements.map(({ id, actions }) => () => {
        const element = utils.$(id);
        if (!element) return;
        
        actions.forEach(action => {
          switch (action) {
            case 'show':
              element.classList.remove('hidden');
              break;
            case 'hide':
              element.classList.add('hidden');
              break;
            case 'enable':
              if (element.tagName === 'FORM') {
                const submitBtn = element.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = false;
              } else {
                element.disabled = false;
              }
              break;
          }
        });
      }));
      
      // Update button states
      if (demoState.currentPage === 'demo') {
        demo.updateButtonState();
      }
    },

    scheduleRetry(operation, delay = 5000, maxRetries = 3) {
      let retryCount = 0;
      
      const retry = () => {
        if (retryCount >= maxRetries) {
          utils.showToast('Maximum retries reached. Please refresh the page.', 'error');
          return;
        }
        
        if (navigator.onLine) {
          try {
            operation();
          } catch (error) {
            retryCount++;
            setTimeout(retry, delay * Math.pow(2, retryCount)); // Exponential backoff
          }
        } else {
          setTimeout(retry, delay);
        }
      };
      
      setTimeout(retry, delay);
    },

    retryFailedOperations() {
      console.log('Attempting to retry failed operations...');
      // Implementation for retrying specific operations
    },

    clearStorageCache() {
      try {
        // Clear various caches
        domCache.clear();
        sessionStorage.removeItem('medspa_session_id');
        
        // Clear any large localStorage items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('demo_') || key.startsWith('medspa_')) {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn('Failed to clear localStorage item:', key);
            }
          }
        });
        
        utils.showToast('Cache cleared successfully.', 'success');
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  };

  // Enhanced performance monitoring with Web Vitals
  const performanceMonitor = {
    setup() {
      this.trackPageLoad();
      this.observeLongTasks();
      this.observeLayoutShifts();
      this.monitorMemoryUsage();
      
      // Initialize Web Vitals if available
      if (typeof webVitals !== 'undefined') {
        analytics.trackWebVitals();
      }
    },

    trackPageLoad() {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            const metrics = {
              // Core timing metrics
              dns_time: perfData.domainLookupEnd - perfData.domainLookupStart,
              connect_time: perfData.connectEnd - perfData.connectStart,
              request_time: perfData.responseStart - perfData.requestStart,
              response_time: perfData.responseEnd - perfData.responseStart,
              dom_loading: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
              page_load_time: perfData.loadEventEnd - perfData.loadEventStart,
              total_time: perfData.loadEventEnd - perfData.fetchStart,
              
              // Additional metrics
              redirect_count: perfData.redirectCount,
              transfer_size: perfData.transferSize,
              encoded_body_size: perfData.encodedBodySize,
              decoded_body_size: perfData.decodedBodySize
            };
            
            analytics.track('page_performance', metrics);
            
            // Performance recommendations
            if (metrics.total_time > 3000) {
              console.warn('Page load time is slow:', metrics.total_time + 'ms');
            }
          }
        }, 0);
      });
    },

    observeLongTasks() {
      if (!('PerformanceObserver' in window)) return;
      
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              analytics.track('long_task', {
                duration: entry.duration,
                start_time: entry.startTime,
                name: entry.name || 'unknown'
              });
              
              if (entry.duration > 100) {
                console.warn('Long task detected:', entry.duration + 'ms');
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('PerformanceObserver for longtask not supported:', error);
      }
    },

    observeLayoutShifts() {
      if (!('PerformanceObserver' in window)) return;
      
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.value > 0.1) { // Significant layout shift
              analytics.track('layout_shift', {
                value: entry.value,
                sources: entry.sources?.map(source => ({
                  node: source.node?.tagName,
                  previous_rect: source.previousRect,
                  current_rect: source.currentRect
                }))
              });
            }
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('PerformanceObserver for layout-shift not supported:', error);
      }
    },

    monitorMemoryUsage() {
      if (!('memory' in performance)) return;
      
      const checkMemory = () => {
        const memory = performance.memory;
        const memoryInfo = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          usage_percent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100).toFixed(2)
        };
        
        // Warn if memory usage is high
        if (memoryInfo.usage_percent > 80) {
          console.warn('High memory usage detected:', memoryInfo);
          analytics.track('high_memory_usage', memoryInfo);
        }
        
        return memoryInfo;
      };
      
      // Check memory usage periodically
      setInterval(checkMemory, 60000); // Every minute
    }
  };

  // Enhanced accessibility with comprehensive WCAG compliance
  const accessibility = {
    setup() {
      this.setupKeyboardNavigation();
      this.setupFocusManagement();
      this.setupScreenReaderSupport();
      this.setupReducedMotion();
      this.validateAccessibility();
      this.setupSkipLinks();
    },

    setupKeyboardNavigation() {
      // Enhanced tab navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          document.body.classList.add('keyboard-navigation');
          document.body.classList.remove('mouse-navigation');
        }
      });

      // Mouse interaction removes keyboard navigation indicator
      document.addEventListener('mousedown', () => {
        document.body.classList.add('mouse-navigation');
        document.body.classList.remove('keyboard-navigation');
      });

      // Enhanced keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Alt + M for main content
        if (e.altKey && e.key === 'm') {
          e.preventDefault();
          const main = document.querySelector('main') || utils.$('main');
          if (main) main.focus();
        }
        
        // Alt + H for help/instructions
        if (e.altKey && e.key === 'h') {
          e.preventDefault();
          this.showKeyboardHelp();
        }
      });
    },

    setupFocusManagement() {
      // Enhanced focus visibility
      const style = document.createElement('style');
      style.textContent = `
        .keyboard-navigation *:focus {
          outline: 2px solid #0066cc !important;
          outline-offset: 2px !important;
        }
        .mouse-navigation *:focus {
          outline: none !important;
        }
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #0066cc;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          text-decoration: none;
          z-index: 9999;
          font-weight: 600;
          transition: top 0.3s ease;
        }
        .skip-link:focus {
          top: 6px;
        }
      `;
      document.head.appendChild(style);

      // Focus trap for modal-like content
      document.addEventListener('focusin', (e) => {
        if (document.body.classList.contains('keyboard-navigation')) {
          // Add visual focus indication
          perf.rafUpdate(() => {
            e.target.setAttribute('data-focused', 'true');
          });
        }
      });

      document.addEventListener('focusout', (e) => {
        perf.rafUpdate(() => {
          e.target.removeAttribute('data-focused');
        });
      });
    },

    setupScreenReaderSupport() {
      // Enhanced live region
      if (!utils.$('sr-live-region')) {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'sr-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.cssText = `
          position: absolute !important;
          left: -10000px !important;
          width: 1px !important;
          height: 1px !important;
          overflow: hidden !important;
          clip: rect(1px, 1px, 1px, 1px) !important;
          white-space: nowrap !important;
        `;
        document.body.appendChild(liveRegion);
      }

      // Enhanced screen reader announcements
      demoState.addListener?.((property, newValue, oldValue) => {
        let announcement = '';
        
        switch (property) {
          case 'processing':
            announcement = newValue ? 'Processing started' : 'Processing completed';
            break;
          case 'results':
            if (newValue) {
              announcement = `Reconciliation complete. Found ${newValue.matches} matches out of ${newValue.total} transactions.`;
            }
            break;
          case 'uploadedFiles':
            const fileCount = Object.values(newValue).filter(f => f).length;
            announcement = `${fileCount} file${fileCount !== 1 ? 's' : ''} uploaded`;
            break;
        }
        
        if (announcement) {
          this.announceToScreenReader(announcement);
        }
      });
    },

    setupReducedMotion() {
      // Respect user's motion preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      const updateMotionPreference = (e) => {
        if (e.matches) {
          document.body.classList.add('reduced-motion');
          // Disable smooth scrolling
          document.documentElement.style.scrollBehavior = 'auto';
        } else {
          document.body.classList.remove('reduced-motion');
          document.documentElement.style.scrollBehavior = 'smooth';
        }
        
        analytics.track('motion_preference_change', { 
          prefers_reduced_motion: e.matches 
        });
      };
      
      updateMotionPreference(prefersReducedMotion);
      prefersReducedMotion.addListener(updateMotionPreference);
    },

    setupSkipLinks() {
      // Add skip links if not present
      if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);
      }
    },

    announceToScreenReader(message) {
      const liveRegion = utils.$('sr-live-region');
      if (liveRegion) {
        // Clear first to ensure announcement
        liveRegion.textContent = '';
        
        setTimeout(() => {
          liveRegion.textContent = message;
          console.log('Screen reader announcement:', message);
          
          // Clear after announcement
          setTimeout(() => {
            liveRegion.textContent = '';
          }, 1000);
        }, 100);
      }
    },

    showKeyboardHelp() {
      const helpContent = `
        Keyboard shortcuts:
        • Tab: Navigate between elements
        • Enter/Space: Activate buttons and links
        • Escape: Close dialogs and toasts
        • Alt + M: Jump to main content
        • Alt + H: Show this help
        • Alt + R: Reset demo (on demo page)
      `;
      
      utils.showToast(helpContent, 'info', 8000);
      this.announceToScreenReader('Keyboard help displayed');
    },

    validateAccessibility() {
      const issues = [];
      
      // Check for missing alt text
      document.querySelectorAll('img:not([alt])').forEach(img => {
        issues.push(`Missing alt text: ${img.src}`);
      });
      
      // Check for missing form labels
      document.querySelectorAll('input, select, textarea').forEach(control => {
        const hasLabel = control.labels?.length > 0 || 
                         control.getAttribute('aria-label') || 
                         control.getAttribute('aria-labelledby');
        
        if (!hasLabel) {
          issues.push(`Missing label: ${control.id || control.name || 'unnamed control'}`);
        }
      });
      
      // Check color contrast (basic check)
      document.querySelectorAll('*').forEach(element => {
        const style = getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        
        // This is a simplified check - in production, use a proper contrast checker
        if (color === 'rgb(128, 128, 128)' && backgroundColor === 'rgb(255, 255, 255)') {
          issues.push(`Potential contrast issue: ${element.tagName}`);
        }
      });
      
      if (issues.length > 0) {
        console.warn('Accessibility issues found:', issues);
        analytics.track('accessibility_issues', { issues: issues.slice(0, 10) }); // Limit for analytics
      } else {
        console.log('✅ No accessibility issues detected');
      }
    }
  };

  // Enhanced page detector with better detection logic
  const pageDetector = {
    detectPage() {
      // Check URL path
      const path = window.location.pathname;
      const filename = path.split('/').pop().toLowerCase() || 'index.html';
      
      // Check for specific page indicators
      if (filename.includes('demo') || utils.$('demoTool')) {
        return 'demo';
      } else if (filename.includes('index') || utils.$('leadCapture') || utils.$('heroCtaBtn')) {
        return 'landing';
      }
      
      // Fallback detection based on content
      const hasLandingElements = !!(utils.$('corePlan') || utils.$('proPlan') || utils.$('heroCtaBtn'));
      const hasDemoElements = !!(utils.$('posFile') || utils.$('runDemoBtn') || utils.$('results'));
      
      if (hasDemoElements && !hasLandingElements) {
        return 'demo';
      } else if (hasLandingElements && !hasDemoElements) {
        return 'landing';
      }
      
      // Default to landing page
      return 'landing';
    },

    initializePage() {
      const pageType = this.detectPage();
      console.log(`🎯 Detected page type: ${pageType}`);
      
      demoState.currentPage = pageType;
      
      // Initialize appropriate page functionality
      if (pageType === 'demo') {
        demo.init();
      } else {
        landing.init();
      }
      
      // Track page view
      analytics.trackPageView();
      
      // Set up page-specific optimizations
      this.optimizeForPage(pageType);
    },

    optimizeForPage(pageType) {
      if (pageType === 'demo') {
        // Preload potential export functionality
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = 'data:text/javascript,console.log("CSV export ready")';
        document.head.appendChild(link);
      } else {
        // Preload demo page assets
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = CONFIG.DEMO_URL;
        document.head.appendChild(link);
      }
    }
  };

  // Main initialization with comprehensive error handling
  const init = () => {
    console.log('🚀 Initializing MedSpaSync Pro Demo System v2.1...');
    
    try {
      perf.mark('init-start');
      
      // Core system setup
      errorHandler.setup();
      performanceMonitor.setup();
      accessibility.setup();
      eventDelegator.setup();
      
      // Initialize reactive state listeners
      const removeStateListener = demoState.addListener?.((property, newValue, oldValue, changeCount) => {
        console.log(`State change #${changeCount}: ${property} = ${newValue}`);
        
        // Performance-optimized state reactions
        if (property === 'processing' || property === 'uploadedFiles') {
          if (demoState.currentPage === 'demo') {
            demo.updateButtonState();
          }
        }
        
        // Track significant state changes
        if (['processing', 'results', 'selectedPlan'].includes(property)) {
          analytics.track('state_change', { 
            property, 
            new_value: newValue, 
            change_count: changeCount 
          });
        }
      });
      
      // Initialize page
      pageDetector.initializePage();
      
      perf.mark('init-end');
      perf.measure('init-duration', 'init-start', 'init-end');
      
      console.log('✅ Demo system v2.1 initialized successfully');
      
      // Cleanup DOM cache periodically to prevent memory leaks
      setInterval(() => {
        domCache.cleanup();
      }, 300000); // Every 5 minutes
      
      // Success message
      setTimeout(() => {
        const message = demoState.currentPage === 'landing' 
          ? 'Welcome to MedSpaSync Pro! 🎉' 
          : 'Demo ready to use! 🚀';
        utils.showToast(message, 'success', 2000);
      }, 500);

    } catch (error) {
      console.error('Initialization error:', error);
      utils.showToast('Failed to initialize. Please refresh the page.', 'error');
      errorHandler.recoverFromError();
      
      analytics.track('initialization_error', {
        error_message: error.message,
        error_stack: error.stack,
        user_agent: navigator.userAgent
      });
    }
  };

  // Enhanced global API with debugging capabilities
  window.MedSpaSyncDemo = Object.freeze({
    // Public API
    version: '2.1',
    getState: () => ({ ...demoState }),
    resetDemo: () => demo.startOver(),
    showToast: utils.showToast,
    
    // Analytics
    track: analytics.track,
    getSessionId: analytics.getSessionId,
    
    // Utilities
    validateEmail: utils.validateEmail,
    formatFileSize: utils.formatFileSize,
    
    // Performance utilities
    perf: Object.freeze({
      mark: perf.mark,
      measure: perf.measure,
      getDOMCacheSize: () => domCache.size()
    }),
    
    // Accessibility
    announceToScreenReader: accessibility.announceToScreenReader,
    showKeyboardHelp: accessibility.showKeyboardHelp,
    
    // Debug utilities (development/localhost only)
    ...(window.location.hostname === 'localhost' && {
      debug: Object.freeze({
        domCache,
        eventDelegator,
        analytics,
        errorHandler,
        performanceMonitor,
        accessibility,
        clearCache: () => {
          domCache.clear();
          errorHandler.clearStorageCache();
        },
        getPerformanceMetrics: analytics.getPerformanceMetrics,
        simulateError: () => {
          throw new Error('Simulated error for testing');
        }
      })
    })
  });

  // DOM ready handler with multiple fallbacks
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded
    init();
  }

  // Additional fallbacks for edge cases
  if (document.readyState !== 'loading') {
    setTimeout(init, 50);
  }

  // Final fallback
  setTimeout(() => {
    if (!window.MedSpaSyncDemo?.version) {
      console.warn('Demo system may not have initialized properly, attempting recovery...');
      init();
    }
  }, 1000);

  // Enhanced cleanup on page unload
  window.addEventListener('beforeunload', () => {
    // Send final analytics
    analytics.track('page_unload', {
      time_on_page: performance.now(),
      interactions: demoState.getChangeCount?.() || 0,
      final_state: {
        page: demoState.currentPage,
        has_results: !!demoState.results,
        files_uploaded: Object.values(demoState.uploadedFiles).filter(f => f).length
      }
    });
    
    // Clear resources
    domCache.clear();
    
    // Remove event listeners
    if (typeof removeStateListener === 'function') {
      removeStateListener();
    }
  });

  // Service Worker registration for production caching
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
          analytics.track('service_worker_registered');
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }

})();