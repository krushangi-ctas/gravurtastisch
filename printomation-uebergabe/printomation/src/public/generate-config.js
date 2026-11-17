const fs = require('fs');
const path = require('path');

// Read SITE_URL from Environment Variables (Vercel Dashboard -> Settings -> Environment Variables -> SITE_URL)
const rawUrl = (process.env.SITE_URL || '').trim();
const siteUrl = rawUrl || 'http://localhost:7051';

const content = `// Auto-generated during build from process.env.SITE_URL
window.CONFIG = Object.freeze({
  SITE_URL: "${siteUrl}"
});
`;

fs.writeFileSync(path.join(__dirname, 'config.js'), content);
console.log('✅ config.js generated with SITE_URL from env:', siteUrl);
