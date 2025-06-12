(function() {
  const expectedHeaders = ['Name', 'Email', 'Date', 'Amount'];

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

  function parseCSV(text) {
    const [headerLine, ...lines] = text.trim().split(/\r?\n/);
    const headers = headerLine.split(',').map(h => h.trim());
    const rows = lines.slice(0, 5).map(l => {
      const vals = l.split(',');
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (vals[i] || '').trim();
      });
      return obj;
    });
    return { headers, rows };
  }

  function analyzeHeaders(headers) {
    const mismatched = [];
    const suggestions = {};
    headers.forEach(h => {
      const normalized = h.replace(/[_\s]+/g, '').toLowerCase();
      const matched = expectedHeaders.find(
        e => e.replace(/\s+/g, '').toLowerCase() === normalized
      );
      if (!matched) {
        mismatched.push(h);
        let best = '';
        let bestScore = 0;
        expectedHeaders.forEach(e => {
          const score = similarity(h.toLowerCase(), e.toLowerCase());
          if (score > bestScore) {
            bestScore = score;
            best = e;
          }
        });
        if (bestScore > 0.5) suggestions[h] = best;
      }
    });
    return { mismatched, suggestions };
  }

  function rowConfidence(row, headers) {
    let matches = 0;
    expectedHeaders.forEach(h => {
      const idx = headers.indexOf(h);
      if (idx !== -1 && row[headers[idx]]) matches++;
    });
    return Math.round((matches / expectedHeaders.length) * 100);
  }

  function Preview({ data }) {
    if (!data) return null;
    const { headers, rows } = data;
    const analysis = analyzeHeaders(headers);
    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { className: 'overflow-auto border rounded' },
        React.createElement(
          'table',
          { className: 'min-w-full text-xs' },
          React.createElement(
            'thead',
            null,
            React.createElement(
              'tr',
              null,
              headers.map(h =>
                React.createElement(
                  'th',
                  {
                    key: h,
                    className:
                      'px-2 py-1 border-b ' +
                      (analysis.mismatched.includes(h) ? 'text-red-600' : '')
                  },
                  h
                )
              ),
              React.createElement(
                'th',
                { className: 'px-2 py-1 border-b' },
                'Match Confidence'
              )
            )
          ),
          React.createElement(
            'tbody',
            null,
            rows.map((row, i) =>
              React.createElement(
                'tr',
                { key: i },
                headers.map(h =>
                  React.createElement(
                    'td',
                    {
                      key: h,
                      className:
                        'px-2 py-1 border-b ' +
                        (analysis.mismatched.includes(h) ? 'text-red-600' : '')
                    },
                    row[h]
                  )
                ),
                React.createElement(
                  'td',
                  { className: 'px-2 py-1 border-b font-semibold' },
                  rowConfidence(row, headers) + '%'
                )
              )
            )
          )
        )
      ),
      Object.keys(analysis.suggestions).length
        ? React.createElement(
            'div',
            { className: 'mt-2 text-xs' },
            React.createElement(
              'div',
              { className: 'font-medium mb-1' },
              'Header Suggestions:'
            ),
            Object.entries(analysis.suggestions).map(([bad, good]) =>
              React.createElement(
                'div',
                { key: bad },
                bad + ' \u2192 ' + good
              )
            )
          )
        : null
    );
  }

  const mountPoints = { pos: 'posPreview', reward: 'rewardPreview' };
  const cache = { pos: null, reward: null };

  window.showPreview = function(type, text) {
    const parsed = parseCSV(text);
    cache[type] = parsed;
    const node = document.getElementById(mountPoints[type]);
    if (node) ReactDOM.render(React.createElement(Preview, { data: parsed }), node);
  };
})();
