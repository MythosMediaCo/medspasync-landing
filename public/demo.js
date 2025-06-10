const tierPrices = { core: 299, professional: 499 };
let selectedTier = 'core';
let posData = '';
let rewardData = '';
let matchResults = [];

function selectTier(tier) {
  selectedTier = tier;
  const btn = document.getElementById('subscribeBtn');
  btn.textContent = `Subscribe Now – $${tierPrices[tier]}/month`;
}

function startCheckout() {
  alert('Demo only – Stripe checkout would launch here.');
}

async function ensureLead() {
  let email = localStorage.getItem('demoEmail');
  let name = localStorage.getItem('demoName');
  if (!email) {
    email = prompt('Enter your email to start the demo:');
    if (!email) return;
    name = prompt('Name (optional):') || '';
    localStorage.setItem('demoEmail', email);
    localStorage.setItem('demoName', name);
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
  }
}

async function trackUsage() {
  const email = localStorage.getItem('demoEmail');
  if (!email) return true;
  const res = await fetch('/api/demo/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  const banner = document.getElementById('usageBanner');
  if (data.blocked) {
    banner.textContent = 'Demo limit reached. Contact sales for full access.';
    banner.classList.remove('hidden');
    return false;
  }
  if (data.remaining <= 3) {
    banner.textContent = `${data.remaining} demo runs remaining`;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
  return true;
}

function loadSample(type) {
  fetch(`sample/${type}.csv`).then(r => r.text()).then(text => {
    if (type === 'pos') posData = text; else rewardData = text;
    alert(`${type} sample loaded`);
  });
}

function readFile(input, cb) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => cb(e.target.result);
  reader.readAsText(file);
}

document.getElementById('posFile').addEventListener('change', e => {
  readFile(e.target, text => posData = text);
});

document.getElementById('rewardFile').addEventListener('change', e => {
  readFile(e.target, text => rewardData = text);
});

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/).map(r => r.split(','));
  const headers = rows.shift();
  return rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = (r[i] || '').trim());
    return obj;
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
      const score = similarity(p.Name || '', r.Name || '') +
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
  const matchRate = (results.filter(r => r.status === 'matched').length / pos.length) * 100;
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
  thead.innerHTML = '<tr><th class="border px-2">Name</th><th class="border px-2">Email</th><th class="border px-2">Date</th><th class="border px-2">Amount</th><th class="border px-2">Status</th><th class="border px-2">Confidence</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  results.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="border px-2">${r.Name}</td><td class="border px-2">${r.Email}</td><td class="border px-2">${r.Date}</td><td class="border px-2">${r.Amount || ''}</td><td class="border px-2">${r.status}</td><td class="border px-2">${r.confidence}</td>`;
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
  if (!posData && document.getElementById('posFile').files[0]) {
    await new Promise(res => readFile(document.getElementById('posFile'), t => { posData = t; res(); }));
  }
  if (!rewardData && document.getElementById('rewardFile').files[0]) {
    await new Promise(res => readFile(document.getElementById('rewardFile'), t => { rewardData = t; res(); }));
  }
  if (!posData || !rewardData) {
    alert('Please provide both POS and rewards data.');
    return;
  }
  if (!(await trackUsage())) return;
  const pos = parseCSV(posData);
  const rew = parseCSV(rewardData);
  const data = matchRecords(pos, rew);
  displayResults(data);
}

ensureLead();
