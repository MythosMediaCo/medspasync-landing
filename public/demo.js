/* Demo.js for SIMPLE HTML (Document 2) */
(function() {
  'use strict';
  
  console.log('🏥 MedSpaSync Pro Demo - Simple Version');
  
  function onDOMReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }
  
  function safeGetElement(id) {
    const element = document.getElementById(id);
    if (element) {
      console.log(`✅ Found: #${id}`);
    } else {
      console.warn(`⚠️ Missing: #${id}`);
    }
    return element;
  }
  
  // Demo state
  const demoState = {
    uploadedFiles: { pos: null, alle: null, aspire: null },
    useSampleData: false
  };
  
  // Sample data
  const sampleData = {
    pos: 'name,service,amount,date\n"Sarah Johnson","Botox",450,"2024-03-15"',
    alle: 'customer_name,product,points\n"Sarah Johnson","Botox",90',
    aspire: 'member_name,treatment,amount\n"Robert Davis","Restylane",140'
  };
  
  // Show toast
  function showToast(message) {
    const toast = safeGetElement('toast');
    if (toast) {
      toast.textContent = message;
      toast.className = 'toast show';
      setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
      console.log(`📢 ${message}`);
    }
  }
  
  // Update file preview
  function updateFilePreview(type, fileName) {
    const preview = safeGetElement(`${type}Preview`);
    if (preview) {
      preview.textContent = fileName ? `✓ ${fileName}` : 'No file selected';
      preview.style.color = fileName ? '#059669' : '#64748b';
    }
  }
  
  // Update button state
  function updateButtonState() {
    const button = safeGetElement('runDemoBtn');
    if (!button) return;
    
    const filesCount = Object.values(demoState.uploadedFiles).filter(f => f).length;
    const allSelected = filesCount >= 2; // Need at least POS and one reward file
    
    button.disabled = !allSelected;
    button.textContent = allSelected ? '🚀 Run AI Reconciliation' : `Select ${2-filesCount} more files`;
  }
  
  // Load sample data
  function loadSampleData(type) {
    if (!sampleData[type]) return;
    
    const mockFile = {
      name: `sample_${type}_data.csv`,
      size: sampleData[type].length,
      content: sampleData[type]
    };
    
    demoState.uploadedFiles[type] = mockFile;
    demoState.useSampleData = true;
    
    updateFilePreview(type, mockFile.name);
    updateButtonState();
    
    showToast(`Sample ${type.toUpperCase()} data loaded`);
  }
  
  // Handle file upload
  function handleFileUpload(type, file) {
    if (!file) return;
    
    demoState.uploadedFiles[type] = file;
    updateFilePreview(type, file.name);
    updateButtonState();
    
    showToast(`${type.toUpperCase()} file uploaded`);
  }
  
  // Show results
  function showResults(data) {
    const results = safeGetElement('results');
    if (!results) return;
    
    const html = `
      <div class="bg-white p-6 rounded-lg border">
        <h3 class="text-xl font-bold mb-4">Reconciliation Complete! 🎉</h3>
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">${data.total}</div>
            <div class="text-sm">Total Transactions</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">${data.matches}</div>
            <div class="text-sm">Matches Found</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">${data.accuracy}%</div>
            <div class="text-sm">Accuracy</div>
          </div>
        </div>
        <button id="exportBtn" class="bg-green-600 text-white px-4 py-2 rounded">
          📄 Export CSV Report
        </button>
      </div>
    `;
    
    results.innerHTML = html;
    results.classList.remove('hidden');
    
    // Setup export
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        showToast('CSV report would be generated');
      });
    }
  }
  
  // Run reconciliation
  async function runReconciliation() {
    const button = safeGetElement('runDemoBtn');
    const loader = safeGetElement('runLoader');
    
    if (button) button.classList.add('hidden');
    if (loader) loader.classList.remove('hidden');
    
    showToast('Processing data...');
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate results
    const results = {
      total: Math.floor(Math.random() * 10) + 5,
      matches: Math.floor(Math.random() * 8) + 4,
      accuracy: Math.floor(Math.random() * 10) + 85
    };
    
    showResults(results);
    
    if (button) button.classList.remove('hidden');
    if (loader) loader.classList.add('hidden');
    
    showToast('Reconciliation completed!');
  }
  
  // Setup event listeners
  function setupEvents() {
    console.log('🎯 Setting up events...');
    
    // Main run button
    const runBtn = safeGetElement('runDemoBtn');
    if (runBtn) {
      runBtn.addEventListener('click', runReconciliation);
      console.log('✅ Run button connected');
    }
    
    // File inputs
    const posFile = safeGetElement('posFile');
    const rewardFile = safeGetElement('rewardFile');
    
    if (posFile) {
      posFile.addEventListener('change', (e) => {
        handleFileUpload('pos', e.target.files[0]);
      });
    }
    
    if (rewardFile) {
      rewardFile.addEventListener('change', (e) => {
        handleFileUpload('alle', e.target.files[0]);
      });
    }
    
    // Sample data buttons
    const loadPosSample = safeGetElement('loadPosSample');
    const loadAlleSample = safeGetElement('loadAlleSample');
    const loadAspireSample = safeGetElement('loadAspireSample');
    
    if (loadPosSample) {
      loadPosSample.addEventListener('click', () => loadSampleData('pos'));
    }
    
    if (loadAlleSample) {
      loadAlleSample.addEventListener('click', () => loadSampleData('alle'));
    }
    
    if (loadAspireSample) {
      loadAspireSample.addEventListener('click', () => loadSampleData('aspire'));
    }
    
    console.log('✅ Events setup complete');
  }
  
  // Initialize
  function init() {
    console.log('🎯 Initializing...');
    
    const available = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
    console.log('📋 Available elements:', available);
    
    setupEvents();
    updateButtonState();
    
    console.log('✅ Demo ready');
    showToast('Demo loaded successfully!');
  }
  
  onDOMReady(init);
  
  window.MedSpaSyncDemo = { state: demoState };
  
})();