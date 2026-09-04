const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 9930-9960 ===');
for (let i = 9929; i < Math.min(lines.length, 9960); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
