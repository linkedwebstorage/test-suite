/**
 * HTML Reporter
 * Generates human-readable HTML conformance reports
 */

import { writeFile } from 'fs/promises';

export class HtmlReporter {
  constructor(subjectName, version) {
    this.subjectName = subjectName;
    this.version = version;
    this.results = [];
  }

  addResult(test, outcome, duration, error = null) {
    this.results.push({
      test,
      outcome,
      duration,
      error,
      timestamp: new Date().toISOString()
    });
  }

  async generateReport(outputPath) {
    const summary = this.getSummary();
    const resultsByCategory = this.groupByCategory();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LWS Conformance Report: ${this.subjectName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1, h2, h3 { color: #333; }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
    }
    .category {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f8f8f8;
      font-weight: 600;
    }
    .passed {
      background: #d4edda;
      color: #155724;
    }
    .failed {
      background: #f8d7da;
      color: #721c24;
    }
    .skipped {
      background: #fff3cd;
      color: #856404;
    }
    .icon {
      font-weight: bold;
      margin-right: 5px;
    }
    .pass-rate {
      font-size: 3em;
      font-weight: bold;
      color: ${summary.passRate >= 0.9 ? '#28a745' : summary.passRate >= 0.7 ? '#ffc107' : '#dc3545'};
    }
    .error-details {
      background: #fff;
      padding: 10px;
      margin-top: 5px;
      border-left: 3px solid #dc3545;
      font-family: monospace;
      font-size: 0.85em;
    }
    .timestamp {
      color: #666;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>LWS Protocol Conformance Report</h1>
    <p><strong>Implementation:</strong> ${this.subjectName} ${this.version ? `v${this.version}` : ''}</p>
    <p class="timestamp"><strong>Test Date:</strong> ${new Date().toISOString()}</p>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="pass-rate">${(summary.passRate * 100).toFixed(1)}%</div>
      <div class="stat-label">Pass Rate</div>
    </div>
    <div class="stat">
      <div class="stat-value">${summary.total}</div>
      <div class="stat-label">Total Tests</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #28a745">${summary.passed}</div>
      <div class="stat-label">Passed</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #dc3545">${summary.failed}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #ffc107">${summary.skipped}</div>
      <div class="stat-label">Skipped</div>
    </div>
  </div>

  ${Object.entries(resultsByCategory).map(([category, tests]) => `
    <div class="category">
      <h2>${category}</h2>
      <table>
        <thead>
          <tr>
            <th width="50">Result</th>
            <th>Test Name</th>
            <th>Requirement</th>
            <th>Spec</th>
            <th width="80">Duration</th>
          </tr>
        </thead>
        <tbody>
          ${tests.map(r => `
            <tr class="${r.outcome}">
              <td>
                <span class="icon">${r.outcome === 'passed' ? '✓' : r.outcome === 'failed' ? '✗' : '○'}</span>
              </td>
              <td>${r.test.name}</td>
              <td>${r.test.comment || '-'}</td>
              <td>${r.test.specSection || '-'}</td>
              <td>${r.duration}ms</td>
            </tr>
            ${r.error ? `
              <tr>
                <td colspan="5">
                  <div class="error-details">${this.escapeHtml(r.error)}</div>
                </td>
              </tr>
            ` : ''}
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}

</body>
</html>`;

    await writeFile(outputPath, html, 'utf-8');
    return outputPath;
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.outcome === 'passed').length;
    const failed = this.results.filter(r => r.outcome === 'failed').length;
    const skipped = this.results.filter(r => r.outcome === 'inapplicable').length;

    return {
      total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? (passed / total) : 0
    };
  }

  groupByCategory() {
    const groups = {};

    for (const result of this.results) {
      const category = result.test.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
    }

    return groups;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
