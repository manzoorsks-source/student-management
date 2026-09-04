const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 440-485 ===');
for (let i = 439; i < Math.min(lines.length, 485); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('\n=== LINES 5410-5455 ===');
for (let i = 5409; i < Math.min(lines.length, 5455); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
