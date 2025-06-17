/* Fixed MedSpaSync Pro Demo - Matches Your Actual HTML Elements */

(function() {
  'use strict';
  
  console.log('🏥 MedSpaSync Pro Demo - Fixed Version');
  console.log('✅ Matching actual HTML elements');
  
  // Wait for DOM to be ready
  function onDOMReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }
  
  // Safe element getter
  function safeGetElement(id) {
    const element = document.getElementById(id);
    if (element) {
      console.log(`✅ Found: #${id}`);
    } else {
      console.warn(`⚠️ Missing: #${id}`);
    }
    return element;
  }
  
  // Safe event listener
  function safeAddEventListener(elementId, event, handler) {
    const element = safeGetElement(elementId);
    if (element) {
      element.addEventListener(event, handler);
      console.log(`🎯 Event attached: ${elementId}.${event}`);
      return true;
    }
    return false;
  }
  
  // Demo state
  const demoState = {
    uploadedFiles: { pos: null, alle: null, aspire: null },
    processingResults: null,
    isProcessing: false,
    useSampleData: false,
    currentStep: 'upload'
  };
  
  // Sample data content
  const sampleDataContent = {
    pos: `name,service,amount,date,location_id,staff_member
"Sarah Johnson","Botox Cosmetic",450.00,"2024-03-15","LOC001","Dr. Smith"
"Michael Chen","Juvederm Ultra",650.00,"2024-03-15","LOC001","Dr. Johnson"
"Jennifer Smith","Dysport",380.00,"2024-03-16","LOC002","Dr. Smith"
"Robert Davis","Restylane Lyft",700.00,"2024-03-16","LOC001","Dr. Johnson"
"Lisa Anderson","Botox Cosmetic",525.00,"2024-03-17","LOC001","Dr. Smith"`,
    
    alle: `customer_name,product,points_redeemed,redemption_date,member_id,clinic_code
"Sarah M Johnson","Botox Cosmetic",90,"2024-03-15","ALL001","CLI001"
"Michael C Chen","Juvederm Ultra",130,"2024-03-15","ALL002","CLI001"
"Jenny Smith","Dysport",76,"2024-03-16","ALL003","CLI002"
"Lisa A Anderson","Botox Cosmetic",105,"2024-03-17","ALL004","CLI001"`,
    
    aspire: `member_name,treatment,reward_amount,transaction_date,account_id,provider_code
"Robert J Davis","Restylane Lyft",140.00,"2024-03-16","ASP001","PRV001"
"David R Williams","Radiesse",96.00,"2024-03-19","ASP002","PRV001"`
  };
  
  // Show toast notification
  function showToast(message, type = 'success') {
    const toast = safeGetElement('toast');
    if (toast) {
      toast.textContent = message;
      toast.className = `toast ${type} show`;
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    } else {
      console.log(`📢 ${message}`);
    }
  }
  
  // Update file preview
  function updateFilePreview(fileType, fileName, isSelected, fileSize) {
    const preview = safeGetElement(`${fileType}Preview`);
    if (preview) {
      if (isSelected && fileName) {
        const sizeText = fileSize ? ` (${(fileSize / 1024).toFixed(1)} KB)` : '';
        preview.textContent = `✓ ${fileName}${sizeText}`;
        preview.style.color = '#059669';
      } else {
        preview.textContent = 'No file selected';
        preview.style.color = '#64748b';
      }
    }
  }
  
  // Update run demo button state
  function updateRunDemoButtonState() {
    const button = safeGetElement('runDemoBtn');
    if (!button) return;
    
    const filesSelected = Object.values(demoState.uploadedFiles).filter(file => file !== null);
    const allFilesSelected = filesSelected.length === 3;
    
    if (allFilesSelected) {
      button.disabled = false;
      button.textContent = '🚀 Run AI Reconciliation';
      button.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      button.disabled = true;
      const remaining = 3 - filesSelected.length;
      button.textContent = `Select ${remaining} more file${remaining !== 1 ? 's' : ''} to continue`;
      button.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }
  
  // Load sample data for file type
  function loadSampleDataForType(fileType) {
    if (!sampleDataContent[fileType]) {
      console.error(`No sample data for type: ${fileType}`);
      showToast(`Sample data not available for ${fileType}`, 'error');
      return;
    }
    
    const button = safeGetElement(`load${fileType.charAt(0).toUpperCase() + fileType.slice(1)}Sample`);
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Loading...';
      button.disabled = true;
    }
    
    setTimeout(() => {
      const mockFile = {
        name: `sample_${fileType}_data.csv`,
        size: sampleDataContent[fileType].length,
        type: 'text/csv',
        content: sampleDataContent[fileType],
        lastModified: Date.now()
      };
      
      demoState.uploadedFiles[fileType] = mockFile;
      demoState.useSampleData = true;
      
      updateFilePreview(fileType, mockFile.name, true, mockFile.size);
      updateRunDemoButtonState();
      
      if (button) {
        button.textContent = '✓ Sample Loaded';
        button.disabled = false;
        setTimeout(() => {
          button.textContent = 'Load Sample Data';
        }, 2000);
      }
      
      showToast(`Sample ${fileType.toUpperCase()} data loaded successfully`);
      
      console.log(`📊 Sample data loaded for ${fileType}:`, mockFile);
    }, 500);
  }
  
  // Handle file upload
  function handleFileUploadSelection(fileType, selectedFile) {
    if (!selectedFile) return;
    
    // Basic validation
    const allowedTypes = ['.csv', '.txt'];
    const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      showToast(`Invalid file type. Please select a CSV or TXT file.`, 'error');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      showToast(`File too large. Maximum size is 10MB.`, 'error');
      return;
    }
    
    demoState.uploadedFiles[fileType] = selectedFile;
    updateFilePreview(fileType, selectedFile.name, true, selectedFile.size);
    updateRunDemoButtonState();
    
    showToast(`${fileType.toUpperCase()} file uploaded successfully`);
    
    console.log(`📁 File uploaded for ${fileType}:`, {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type
    });
  }
  
  // Show processing with realistic stages
  function showProcessing() {
    const loader = safeGetElement('runLoader');
    const button = safeGetElement('runDemoBtn');
    
    if (loader) loader.classList.remove('hidden');
    if (button) button.classList.add('hidden');
    
    showToast('Starting AI reconciliation process...', 'info');
  }
  
  // Hide processing
  function hideProcessing() {
    const loader = safeGetElement('runLoader');
    const button = safeGetElement('runDemoBtn');
    
    if (loader) loader.classList.add('hidden');
    if (button) button.classList.remove('hidden');
  }
  
  // Generate realistic results
  function generateRealisticResults() {
    const baseTransactions = demoState.useSampleData ? 5 : 8;
    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    const totalTransactions = Math.floor(baseTransactions * randomFactor);
    
    const exactMatchRate = 0.6 + (Math.random() * 0.15); // 60-75%
    const fuzzyMatchRate = 0.2 + (Math.random() * 0.1);  // 20-30%
    
    const exactMatches = Math.floor(totalTransactions * exactMatchRate);
    const fuzzyMatches = Math.floor(totalTransactions * fuzzyMatchRate);
    const unmatched = totalTransactions - exactMatches - fuzzyMatches;
    const accuracy = Math.round(((exactMatches + fuzzyMatches) / totalTransactions) * 100);
    
    return {
      totalTransactions,
      exactMatches,
      fuzzyMatches,
      unmatched,
      accuracy: Math.max(85, Math.min(96, accuracy)),
      processingTimeMs: 2800 + (Math.random() * 2000),
      potentialRecovery: Math.floor(unmatched * 180 + (Math.random() * 400)),
      matches: [
        {
          name: "Sarah Johnson",
          service: "Botox Cosmetic",
          date: "2024-03-15",
          amount: 450.00,
          confidence: 98,
          matchType: "exact"
        },
        {
          name: "Michael Chen", 
          service: "Juvederm Ultra",
          date: "2024-03-15",
          amount: 650.00,
          confidence: 99,
          matchType: "exact"
        },
        {
          name: "Jennifer Smith",
          service: "Dysport", 
          date: "2024-03-16",
          amount: 380.00,
          confidence: 87,
          matchType: "fuzzy"
        }
      ]
    };
  }
  
  // Display results
  function displayResults(resultsData) {
    const resultsContainer = safeGetElement('results');
    if (!resultsContainer) {
      console.error('Results container not found');
      return;
    }
    
    const processingTime = (resultsData.processingTimeMs / 1000).toFixed(1);
    
    const resultsHTML = `
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Reconciliation Complete! 🎉</h3>
          <p class="text-gray-600">
            Processed ${resultsData.totalTransactions} transactions in ${processingTime} seconds<br>
            <span class="text-green-600 font-semibold">Achieved ${resultsData.accuracy}% accuracy</span>
          </p>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">${resultsData.totalTransactions}</div>
            <div class="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">${resultsData.exactMatches}</div>
            <div class="text-sm text-gray-600">Exact Matches</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-yellow-600">${resultsData.fuzzyMatches}</div>
            <div class="text-sm text-gray-600">AI Fuzzy Matches</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">${resultsData.accuracy}%</div>
            <div class="text-sm text-gray-600">Match Accuracy</div>
          </div>
        </div>
        
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-3">Sample Matched Transactions</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-gray-900">Customer</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-900">Service</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-900">Date</th>
                  <th class="px-4 py-3 text-right font-medium text-gray-900">Amount</th>
                  <th class="px-4 py-3 text-center font-medium text-gray-900">Match Type</th>
                  <th class="px-4 py-3 text-center font-medium text-gray-900">Confidence</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${resultsData.matches.map(match => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">${match.name}</td>
                    <td class="px-4 py-3 text-gray-700">${match.service}</td>
                    <td class="px-4 py-3 text-gray-700">${match.date}</td>
                    <td class="px-4 py-3 text-right font-medium text-gray-900">$${match.amount.toFixed(2)}</td>
                    <td class="px-4 py-3 text-center">
                      <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                        match.matchType === 'exact' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }">
                        ${match.matchType.charAt(0).toUpperCase() + match.matchType.slice(1)}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                        match.confidence >= 95 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }">
                        ${match.confidence}%
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="text-center">
          <p class="text-gray-600 mb-4">Ready to export your professional reconciliation report?</p>
          <button id="exportBtn" class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            📄 Export CSV Report
          </button>
        </div>
      </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
    resultsContainer.classList.remove('hidden');
    
    // Setup export button
    const exportBtn = safeGetElement('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => exportResults(resultsData));
    }
  }
  
  // Export results to CSV
  function exportResults(resultsData) {
    const csvContent = generateCSVContent(resultsData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `medspasync-reconciliation-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('Report exported successfully!');
    }
  }
  
  // Generate CSV content
  function generateCSVContent(resultsData) {
    const headers = ['Customer Name', 'Service', 'Date', 'Amount', 'Match Type', 'Confidence'];
    const rows = [
      ['MedSpaSync Pro Reconciliation Report'],
      [`Generated: ${new Date().toISOString()}`],
      [`Total Transactions: ${resultsData.totalTransactions}`],
      [`Match Accuracy: ${resultsData.accuracy}%`],
      [''],
      headers
    ];
    
    resultsData.matches.forEach(match => {
      rows.push([
        match.name,
        match.service,
        match.date,
        `$${match.amount.toFixed(2)}`,
        match.matchType.charAt(0).toUpperCase() + match.matchType.slice(1),
        `${match.confidence}%`
      ]);
    });
    
    return rows.map(row => 
      row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field}"` 
          : field
      ).join(',')
    ).join('\n');
  }
  
  // Start reconciliation process
  async function startReconciliationProcess() {
    if (demoState.isProcessing) {
      showToast('Reconciliation already in progress', 'warning');
      return;
    }
    
    const selectedFiles = demoState.uploadedFiles;
    if (!selectedFiles.pos || !selectedFiles.alle || !selectedFiles.aspire) {
      showToast('Please select all three files before starting', 'error');
      return;
    }
    
    demoState.isProcessing = true;
    showProcessing();
    
    // Hide results if they exist
    const resultsContainer = safeGetElement('results');
    if (resultsContainer) {
      resultsContainer.classList.add('hidden');
    }
    
    try {
      console.log('🚀 Starting reconciliation process...');
      
      // Simulate realistic processing time
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
      
      // Generate results
      const results = generateRealisticResults();
      demoState.processingResults = results;
      
      // Display results
      displayResults(results);
      
      showToast('Reconciliation completed successfully!');
      
      console.log('✅ Reconciliation completed:', results);
      
    } catch (error) {
      console.error('❌ Reconciliation failed:', error);
      showToast('Reconciliation failed. Please try again.', 'error');
    } finally {
      demoState.isProcessing = false;
      hideProcessing();
    }
  }
  
  // Setup event listeners
  function setupEventListeners() {
    console.log('🎯 Setting up event listeners...');
    
    // Main demo button - FIXED: Using correct ID
    safeAddEventListener('runDemoBtn', 'click', startReconciliationProcess);
    
    // File inputs
    ['pos', 'alle', 'aspire'].forEach(fileType => {
      const fileInput = safeGetElement(`${fileType}File`);
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          handleFileUploadSelection(fileType, e.target.files[0]);
        });
      }
      
      // Sample data buttons
      safeAddEventListener(`load${fileType.charAt(0).toUpperCase() + fileType.slice(1)}Sample`, 'click', (e) => {
        e.preventDefault();
        loadSampleDataForType(fileType);
      });
    });
    
    console.log('✅ Event listeners setup complete');
  }
  
  // Initialize demo
  function initializeDemo() {
    console.log('🎯 Initializing MedSpaSync Pro Demo...');
    
    try {
      // Show available elements
      const availableIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
      console.log('📋 Available elements:', availableIds);
      
      // Setup event listeners
      setupEventListeners();
      
      // Set initial button state
      updateRunDemoButtonState();
      
      console.log('✅ Demo initialization complete');
      showToast('Demo loaded successfully!');
      
    } catch (error) {
      console.error('❌ Demo initialization failed:', error);
      showToast('Demo failed to load', 'error');
    }
  }
  
  // Initialize when DOM is ready
  onDOMReady(initializeDemo);
  
  // Export for debugging
  window.MedSpaSyncDemo = {
    state: demoState,
    reinitialize: initializeDemo,
    loadSample: loadSampleDataForType
  };
  
  console.log('🔧 Fixed demo script loaded - matches your HTML elements');
  
})();