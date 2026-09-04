const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 4410-4440 ===');
for (let i = 4409; i < 4440; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('\n=== LINES 4585-4605 ===');
for (let i = 4584; i < 4605; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('\n=== LINES 9730-9850 ===');
for (let i = 9729; i < 9850; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
