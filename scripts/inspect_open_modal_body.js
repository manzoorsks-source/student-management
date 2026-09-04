const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 10035-10075 ===');
for (let i = 10034; i < Math.min(lines.length, 10075); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
