const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 5510-5620 ===');
for (let i = 5509; i < Math.min(lines.length, 5620); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
