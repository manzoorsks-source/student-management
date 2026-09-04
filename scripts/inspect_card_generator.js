const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== LINES 5500-5650 ===');
for (let i = 5499; i < Math.min(lines.length, 5650); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('\n=== LINES 6080-6200 ===');
for (let i = 6079; i < Math.min(lines.length, 6200); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
