/**
 * Local development middleware for Create React App (`react-scripts start`).
 * Mounts the serverless `/api/leads` handler directly on the local dev server
 * so frontend -> backend -> Odoo integration works identically in local development and Vercel.
 */

const fs = require('fs');
const path = require('path');

function loadEnvLocalIfPresent() {
  const envLocalPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envLocalPath)) return;
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocalIfPresent();

const leadsHandler = require('../api/leads');

module.exports = function setupProxy(app) {
  app.all('/api/leads', (req, res) => {
    loadEnvLocalIfPresent();
    return leadsHandler(req, res);
  });
};
