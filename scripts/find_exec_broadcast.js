const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('executeMassBroadcastModal') || line.includes('openWhatsAppDirect')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
