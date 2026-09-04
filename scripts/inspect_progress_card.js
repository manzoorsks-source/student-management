const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const pIdx = lines.findIndex(l => l.includes('PROGRESS CARD & EXAM TERM BOOKLET'));
console.log('Found PROGRESS CARD at line ' + (pIdx + 1));
if (pIdx !== -1) {
  for (let i = pIdx - 10; i < pIdx + 150; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
