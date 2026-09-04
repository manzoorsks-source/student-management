const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const lIdx = lines.findIndex(l => l.includes('function handleLogin'));
console.log('=== handleLogin ===');
if (lIdx !== -1) {
  for (let i = lIdx; i < lIdx + 50; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
