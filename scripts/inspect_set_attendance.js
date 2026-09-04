const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 10805-10875 ===');
for (let i = 10804; i < Math.min(lines.length, 10875); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
