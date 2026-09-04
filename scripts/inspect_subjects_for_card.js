const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 5370-5415 ===');
for (let i = 5369; i < Math.min(lines.length, 5415); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
