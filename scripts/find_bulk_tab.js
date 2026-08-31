const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('function renderBulkMessagingTab') || line.includes('broadcast-recipient-table-body') || line.includes('Dispatch All')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
