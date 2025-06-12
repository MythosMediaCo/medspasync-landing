const API_BASE = window.API_BASE || 'https://api.medspasyncpro.com';
const tierPrices = { core: 299, professional: 499 };
let selectedTier = 'core';
let posData = '';
let rewardData = '';
let matchResults = [];

document.getElementById('posFile')?.addEventListener('change', e => {
  readFile(e.target, text => {
    posData = text;
    if (window.updatePreview) window.updatePreview('pos', text);
    });
  });

document.getElementById('rewardFile')?.addEventListener('change', e => {
  readFile(e.target, text => {
    rewardData = text;
    if (window.updatePreview) window.updatePreview('rew', text);
  });
});

  document.getElementById('subscribeBtn')?.addEventListener('click', startCheckout);
  document.getElementById('exportBtn')?.addEventListener('click', exportCSV);

  document.getElementById('loadPosSample')?.addEventListener('click', () => loadSample('pos'));
  document.getElementById('loadAlleSample')?.addEventListener('click', () => loadSample('alle'));
  document.getElementById('loadAspireSample')?.addEventListener('click', () => loadSample('aspire'));

  document.getElementById('runDemoBtn')?.addEventListener('click', runDemo);

  initLeadForm();
});

function selectTier(tier) {
  selectedTier = tier;
  const btn = document.getElementById('subscribeBtn');
  btn.textContent = `Subscribe Now – $${tierPrices[tier]}/month`;

  document.getElementById('corePlan')?.classList.remove('border-blue-500');
  document.getElementById('proPlan')?.classList.remove('border-purple-500');
  if (tier === 'core') {
    document.getElementById('corePlan')?.classList.add('border-blue-500');
  } else {
    document.getElementById('proPlan')?.classList.add('border-purple-500');
  }
}

async function startCheckout() {
  try {
    const res = await fetch(`${API_BASE}/checkout/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: selectedTier })
    });
    const data = await res.json();
    if (data.url) {
      window.location = data.url;
    } else {
      alert('Unable to start checkout.');
    }
  } catch (err) {
    alert('Checkout failed.');
  }
}

function initLeadForm() {
  const form = document.getElementById('leadForm');
  if (!form) return;
  const emailEl = document.getElementById('leadEmail');
  const nameEl = document.getElementById('leadName');
  const notice = document.getElementById('leadNotice');
  const demoTool = document.getElementById('demoTool');

  const storedEmail = localStorage.getItem('demoEmail');
  if (storedEmail) {
    form.classList.add('hidden');
    demoTool.classList.remove('hidden');
    trackUsage();
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    notice.textContent = '';
    const email = emailEl.value.trim();
    const name = nameEl.value.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      notice.textContent = 'Please enter a valid email.';
      return;
    }
    emailEl.disabled = true;
    nameEl.disabled = true;
    form.querySelector('button').disabled = true;
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }
      localStorage.setItem('demoEmail', email);
      localStorage.setItem('demoName', name);
      form.classList.add('hidden');
      demoTool.classList.remove('hidden');
      notice.classList.remove('text-red-600');
      notice.classList.add('text-green-600');
      notice.textContent = 'Thank you! You can now run the demo.';
    } catch (err) {
      notice.textContent = 'Unable to submit. Please try again later.';
      emailEl.disabled = false;
      nameEl.disabled = false;
      form.querySelector('button').disabled = false;
    }
  });
}

async function trackUsage() {
  const email = localStorage.getItem('demoEmail');
  if (!email) {
    alert('Please submit your email to run the demo.');
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/demo/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    const used = data.remaining != null ? 7 - data.remaining : 7;
    if (window.renderUsageMeter) {
      window.renderUsageMeter(used);
    }
    if (data.blocked) {
      return false;
    }
    return true;
  } catch (err) {
    return true;
  }
}

function loadSample(type) {
  fetch(`/sample/${type}.csv`)
    .then(r => r.text())
    .then(text => {
      if (type === 'pos') {
        posData = text;
        if (window.updatePreview) window.updatePreview('pos', text);
      } else {
        rewardData = text;
        if (window.updatePreview) window.updatePreview('rew', text);
      }
    })
    .catch(() => {});
}

function readFile(input, cb) {
  const file = input.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.csv')) {
    alert('Only CSV files are supported.');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => cb(e.target.result);
  reader.readAsText(file);
}

function parseCSV(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  return lines.map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, idx) => {
      obj[header.trim()] = (values[idx] || '').trim();
      return obj;
    }, {});
  });
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function similarity(a, b) {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return (max - levenshtein(a, b)) / max;
}

function matchRecords(pos, rewards) {
  const results = [];
  let recovered = 0;
  pos.forEach(p => {
    let bestScore = 0;
    rewards.forEach(r => {
      const score =
        similarity(p.Name || '', r.Name || '') +
        similarity(p.Email || '', r.Email || '') +
        (p.Date === r.Date ? 1 : 0);
      if (score > bestScore) bestScore = score;
    });
    let status = 'unmatched';
    let confidence = 'low';
    if (bestScore > 2) {
      status = 'matched';
      confidence = 'high';
      recovered += parseFloat(p.Amount || '0');
    } else if (bestScore > 1) {
      status = 'review';
      confidence = 'medium';
    }
    results.push({ ...p, status, confidence });
  });
  const matchRate =
    (results.filter(r => r.status === 'matched').length / pos.length) * 100;
  return { results, recovered, matchRate };
}

function displayResults(data) {
  const container = document.getElementById('results');
  container.innerHTML = '';
  const { results, recovered, matchRate } = data;

  const summary = document.createElement('div');
  summary.className = 'grid md:grid-cols-2 gap-4 mb-6';
  summary.innerHTML = `
    <div class="p-4 bg-white rounded shadow">
      <div class="text-sm text-gray-500">Recovered Revenue</div>
      <div class="text-2xl font-bold text-green-600">$${recovered.toFixed(2)}</div>
    </div>
    <div class="p-4 bg-white rounded shadow">
      <div class="text-sm text-gray-500">Match Rate</div>
      <div class="text-2xl font-bold">${matchRate.toFixed(1)}%</div>
    </div>`;
  container.appendChild(summary);

  const table = document.createElement('table');
  table.className = 'min-w-full text-sm';
  const thead = document.createElement('thead');
  thead.innerHTML =
    '<tr><th class="border px-2">Name</th><th class="border px-2">Email</th><th class="border px-2">Date</th><th class="border px-2">Amount</th><th class="border px-2">Status</th><th class="border px-2">Confidence</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  results.forEach(r => {
    const tr = document.createElement('tr');
    ['Name', 'Email', 'Date', 'Amount', 'status', 'confidence'].forEach(key => {
      const td = document.createElement('td');
      td.className = 'border px-2';
      td.textContent = r[key] || '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  matchResults = results;
  document.getElementById('exportBtn').classList.remove('hidden');
}

function exportCSV() {
  if (!matchResults.length) return;
  const headers = Object.keys(matchResults[0]);
  const lines = [headers.join(',')];
  matchResults.forEach(r => {
    lines.push(headers.map(h => r[h]).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'reconciliation.csv';
  link.click();
}

async function runDemo() {
  try {
    const runBtn = document.getElementById('runDemoBtn');
    if (runBtn) runBtn.disabled = true;
    if (!posData && document.getElementById('posFile').files[0]) {
      await new Promise(res =>
        readFile(document.getElementById('posFile'), t => {
          posData = t;
          res();
        })
      );
    }
    if (!rewardData && document.getElementById('rewardFile').files[0]) {
      await new Promise(res =>
        readFile(document.getElementById('rewardFile'), t => {
          rewardData = t;
          res();
        })
      );
    }
    if (!posData || !rewardData) {
      alert('Please provide both POS and rewards data.');
      if (runBtn) runBtn.disabled = false;
      return;
    }
    if (!(await trackUsage())) return;
    await fetch(`${API_BASE}/reconciliation/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: localStorage.getItem('demoEmail'),
        pos: posData,
        rewards: rewardData
      })
    }).catch(() => {});
    const pos = parseCSV(posData);
    const rew = parseCSV(rewardData);
    const data = matchRecords(pos, rew);
    displayResults(data);
  } catch (err) {
    alert('Something went wrong while running the demo.');
  } finally {
    const runBtn = document.getElementById('runDemoBtn');
    if (runBtn) runBtn.disabled = false;
  }
}
