const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

for (let i = 7810; i < 7845; i++) {
  console.log(`[${i+1}] ${JSON.stringify(lines[i])}`);
}
