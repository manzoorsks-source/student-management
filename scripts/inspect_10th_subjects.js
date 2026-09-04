const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 345-365 ===');
for (let i = 344; i < Math.min(lines.length, 365); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
