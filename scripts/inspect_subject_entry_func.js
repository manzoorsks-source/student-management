const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 485-550 ===');
for (let i = 484; i < Math.min(lines.length, 550); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('\n=== LINES 5450-5510 ===');
for (let i = 5449; i < Math.min(lines.length, 5510); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
