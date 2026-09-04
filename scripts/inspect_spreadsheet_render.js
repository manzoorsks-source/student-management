const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 4460-4550 (Spreadsheet table rendering) ===');
for (let i = 4459; i < 4550; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
