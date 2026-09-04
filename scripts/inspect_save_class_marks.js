const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 9845-9930 ===');
for (let i = 9844; i < Math.min(lines.length, 9930); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
