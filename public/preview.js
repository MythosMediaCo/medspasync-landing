// public/preview.js - Demo 2.0
// This module renders live CSV previews and header hints using React.

// Ensure React and ReactDOM are loaded before this script.

(function() {
  const expectedHeaders = ['Name', 'Email', 'Date', 'Amount']; // Example expected headers for reconciliation

  // --- Helper Functions (Levenshtein, Similarity, CSV Parsing, Header Analysis) ---

  /**
   * Calculates the Levenshtein distance between two strings.
   * Measures the minimum number of single-character edits (insertions, deletions, or substitutions)
   * required to change one word into the other.
   * @param {string} a - The first string.
   * @param {string} b - The second string.
   * @returns {number} The Levenshtein distance.
   */
  function levenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // Deletion
          matrix[i][j - 1] + 1,      // Insertion
          matrix[i - 1][j - 1] + cost // Substitution
        );
      }
    }
    return matrix[a.length][b.length];
  }

  /**
   * Calculates the similarity between two strings based on Levenshtein distance.
   * Returns a score between 0 (no similarity) and 1 (identical).
   * @param {string} a - The first string.
   * @param {string} b - The second string.
   * @returns {number} The similarity score.
   */
  function similarity(a, b) {
    const max = Math.max(a.length, b.length);
    if (max === 0) return 1; // Both empty, considered identical
    return (max - levenshtein(a, b)) / max;
  }

  /**
   * Parses a raw CSV string into an array of header names and an array of row objects.
   * Limits rows for preview purposes.
   * @param {string} text - The raw CSV content.
   * @returns {{headers: string[], rows: object[]}} Parsed CSV data.
   */
  function parseCSV(text) {
    const [headerLine, ...lines] = text.trim().split(/\r?\n/);
    // Remove quotes and trim headers
    const headers = headerLine.split(',').map(h => h.replace(/"/g, '').trim());
    // Limit to first 5 data rows for preview and remove quotes/trim values
    const rows = lines.slice(0, 5).map(l => {
      const vals = l.split(',').map(v => v.replace(/"/g, '').trim());
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (vals[i] || '').trim();
      });
      return obj;
    });
    return { headers, rows };
  }

  /**
   * Analyzes the provided CSV headers against a list of expected headers.
   * Identifies mismatches and suggests corrections based on similarity.
   * @param {string[]} headers - Headers parsed from the CSV file.
   * @returns {{mismatched: string[], suggestions: object}} Analysis results.
   */
  function analyzeHeaders(headers) {
    const mismatched = [];
    const suggestions = {};
    headers.forEach(h => {
      // Normalize header from file for comparison (remove spaces/underscores, lowercase)
      const normalizedHeader = h.replace(/[_\s-]+/g, '').toLowerCase();
      const matched = expectedHeaders.find(
        e => e.replace(/\s+/g, '').toLowerCase() === normalizedHeader // Normalize expected header for comparison
      );
      if (!matched) {
        mismatched.push(h); // Header from file doesn't exactly match expected
        let best = '';
        let bestScore = 0;
        expectedHeaders.forEach(e => {
          const score = similarity(normalizedHeader, e.replace(/\s+/g, '').toLowerCase());
          if (score > bestScore) {
            bestScore = score;
            best = e;
          }
        });
        if (bestScore > 0.5) suggestions[h] = best; // Suggest if similarity is reasonable (e.g., >50%)
      }
    });
    return { mismatched, suggestions };
  }

  /**
   * Calculates a confidence score for a given row based on how many expected headers it contains data for.
   * @param {object} row - A single parsed row object.
   * @param {string[]} headers - The actual headers from the CSV.
   * @returns {number} Confidence percentage (0-100).
   */
  function rowConfidence(row, headers) {
    let matches = 0;
    expectedHeaders.forEach(eh => {
        // Find if expected header exists in the actual headers (case-insensitive, normalized)
        const foundHeaderInFile = headers.find(h => eh.replace(/\s+/g, '').toLowerCase() === h.replace(/[_\s-]+/g, '').toLowerCase());
        // Check if the found header exists in the row and has a non-empty value
        if (foundHeaderInFile && row[foundHeaderInFile]) {
            matches++;
        }
    });
    return Math.round((matches / expectedHeaders.length) * 100);
  }

  // --- React Component for Preview Display ---

  const Preview = ({ data }) => {
    if (!data || !data.headers || !data.rows) return null;
    const { headers, rows } = data;
    const analysis = analyzeHeaders(headers);

    return React.createElement('div', { className: 'space-y-4' },
      // Header Mismatch Suggestions
      analysis.mismatched.length > 0 && React.createElement('div', { 
        className: 'bg-orange-50 border border-orange-200 text-orange-800 p-2 rounded text-sm' 
      },
        React.createElement('p', { className: 'font-semibold mb-1' }, 'Potential Header Mismatch Detected:'),
        React.createElement('ul', { className: 'list-disc list-inside' },
          analysis.mismatched.map(h => React.createElement('li', { key: h },
            `"${h}" `,
            analysis.suggestions[h] && `(Suggested: "${analysis.suggestions[h]}")`
          ))
        ),
        React.createElement('p', { className: 'mt-2' }, 
          `Ensure your CSV headers match the expected format: ${expectedHeaders.join(', ')}`
        )
      ),

      // Live Preview Table
      React.createElement('div', { className: 'overflow-x-auto border rounded border-gray-200 shadow-sm' },
        React.createElement('table', { className: 'min-w-full divide-y divide-gray-200 text-xs' },
          React.createElement('thead', { className: 'bg-gray-50' },
            React.createElement('tr', null,
              headers.map(h => React.createElement('th', {
                key: h,
                className: `px-3 py-2 text-left font-medium text-gray-700 uppercase tracking-wider ${
                  analysis.mismatched.includes(h) ? 'text-red-600' : ''
                }`
              }, h)),
              React.createElement('th', { 
                className: 'px-3 py-2 text-left font-medium text-gray-700 uppercase tracking-wider' 
              }, 'Confidence')
            )
          ),
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            rows.map((row, i) => React.createElement('tr', { key: i },
              headers.map(h => React.createElement('td', {
                key: h,
                className: `px-3 py-2 whitespace-nowrap ${
                  analysis.mismatched.includes(h) ? 'text-red-600' : 'text-gray-800'
                }`
              }, row[h])),
              React.createElement('td', { 
                className: 'px-3 py-2 whitespace-nowrap font-semibold text-gray-900' 
              }, `${rowConfidence(row, headers)}%`)
            ))
          )
        )
      )
    );
  };

  // --- Global Function to Expose to demo.js ---

  const mountPoints = { pos: 'posPreview', loyalty: 'rewardPreview' }; // DOM IDs where previews will be rendered

  /**
   * Renders a live preview of CSV data into the DOM using React.
   * This function is intended to be called by demo.js when a file is selected or sample data is loaded.
   * @param {'pos' | 'loyalty'} type - The type of file (pos or loyalty) to determine the mount point.
   * @param {string} text - The raw CSV text content to preview.
   */
  window.showPreview = function(type, text) {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        console.warn('React or ReactDOM not loaded. Cannot show CSV preview. Ensure React CDN scripts are in index.html.');
        return;
    }
    const parsed = parseCSV(text);
    const node = document.getElementById(mountPoints[type]);
    if (node) {
      // Use ReactDOM.createRoot for React 18+ concurrent mode benefits
      // Fallback to old render for compatibility if createRoot not available (though unlikely with fixed CDN)
      if (ReactDOM.createRoot) {
          if (!node._reactRoot) { // Check if a root has already been created for this node
              node._reactRoot = ReactDOM.createRoot(node);
          }
          node._reactRoot.render(React.createElement(Preview, { data: parsed }));
      } else {
          ReactDOM.render(React.createElement(Preview, { data: parsed }), node);
      }
    }
  };

  console.log('public/preview.js loaded');
})();