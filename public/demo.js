/* MedSpaSync Pro Demo JavaScript */
(function(){
  'use strict';

  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const resultsDiv = document.getElementById('results');
  const exportBtn = document.getElementById('exportBtn');
  const sampleBtn = document.getElementById('sampleBtn');
  const startBtn = document.getElementById('startBtn');
  const leadModal = document.getElementById('leadModal');
  const leadEmail = document.getElementById('leadEmail');
  const leadCompany = document.getElementById('leadCompany');
  const leadSubmit = document.getElementById('leadSubmit');
  const leadCancel = document.getElementById('leadCancel');

  let demoResults = null;
  let useSample = false;

  function trackEvent(name, data){
    if(window.console){
      console.log('trackEvent', name, data || {});
    }
  }

  sampleBtn.addEventListener('click', () => {
    useSample = true;
    trackEvent('sample_data_used');
    startProcessing();
  });

  startBtn.addEventListener('click', () => {
    useSample = false;
    startProcessing();
  });

  function startProcessing(){
    const files = {
      pos: document.getElementById('filePos').files[0],
      alle: document.getElementById('fileAlle').files[0],
      aspire: document.getElementById('fileAspire').files[0]
    };

    step1.classList.add('hidden');
    step2.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = 'Starting...';

    const stages = [
      'Validating data',
      'Cross-checking records',
      'Fuzzy matching',
      'Calculating accuracy',
      'Generating report',
      'Finalizing'
    ];
    const totalDuration = 120000; // 2 minutes
    const stageDuration = totalDuration / stages.length;

    let stageIndex = 0;

    function updateStage(){
      progressText.textContent = stages[stageIndex];
      progressBar.style.width = ((stageIndex)/stages.length*100) + '%';
      if(stageIndex < stages.length){
        setTimeout(() => {
          stageIndex++;
          if(stageIndex === stages.length){
            progressBar.style.width = '100%';
          }
          updateStage();
        }, stageDuration);
      }
    }
    updateStage();

    readFiles(files).then(payload => {
      if(useSample) payload.sample = true;
      fetch('/api/demo/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(data => {
        demoResults = data;
        trackEvent('processing_completed', { accuracy: data.accuracy });
        setTimeout(() => showResults(data), totalDuration);
      })
      .catch(err => {
        console.error('Process error', err);
        progressText.textContent = 'Error processing files';
      });
    });
  }

  function readFiles(files){
    if(useSample) return Promise.resolve({ sample: true });
    return Promise.all(Object.keys(files).map(key => {
      return new Promise(resolve => {
        if(!files[key]) return resolve([key, null]);
        const reader = new FileReader();
        reader.onload = () => resolve([key, reader.result]);
        reader.readAsText(files[key]);
      });
    })).then(entries => {
      const obj = {};
      entries.forEach(([k,v])=>{ if(v) obj[k] = v; });
      return obj;
    });
  }

  function showResults(data){
    step2.classList.add('hidden');
    step3.classList.remove('hidden');
    const { matches, accuracy } = data;
    const tableRows = matches.map(m => `<tr><td class="border px-2">${m.name}</td><td class="border px-2">${m.service}</td><td class="border px-2">${m.date}</td><td class="border px-2 text-right">${m.amount}</td><td class="border px-2 text-right">${m.confidence}%</td></tr>`).join('');
    const table = `<p class="mb-2">Accuracy: <strong>${accuracy}%</strong></p><table class="w-full text-xs"><thead><tr><th class="border px-2">Name</th><th class="border px-2">Service</th><th class="border px-2">Date</th><th class="border px-2">Amount</th><th class="border px-2">Confidence</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    resultsDiv.innerHTML = table;
    trackEvent('processing_completed', { accuracy });
  }

  exportBtn.addEventListener('click', () => {
    if(!demoResults) return;
    fetch('/api/demo/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches: demoResults.matches })
    })
      .then(r => r.text())
      .then(csv => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reconciliation.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        trackEvent('report_exported', { format: 'csv' });
        leadModal.classList.remove('hidden');
      });
  });

  leadSubmit.addEventListener('click', () => {
    const email = leadEmail.value.trim();
    const company = leadCompany.value.trim();
    if(!email) return alert('Email required');
    fetch('/api/demo/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: company })
    }).then(() => {
      trackEvent('lead_captured', { email });
      leadModal.classList.add('hidden');
      alert('Thank you!');
    }).catch(() => {
      alert('Error saving lead');
    });
  });

  leadCancel.addEventListener('click', () => {
    leadModal.classList.add('hidden');
  });
})();
