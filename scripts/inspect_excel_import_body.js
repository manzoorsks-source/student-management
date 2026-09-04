const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 2030-2130 ===');
for (let i = 2029; i < Math.min(lines.length, 2130); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('\n=== LINES 2130-2220 ===');
for (let i = 2129; i < Math.min(lines.length, 2220); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
