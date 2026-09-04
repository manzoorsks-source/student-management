const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const cIdx = lines.findIndex(l => l.includes('const CloudSync = {'));
console.log('Found CloudSync at line ' + (cIdx + 1));
if (cIdx !== -1) {
  for (let i = cIdx; i < cIdx + 180; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
