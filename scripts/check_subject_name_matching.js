const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('--- Checking 10th class subjects definition in index.html ---');
lines.forEach((l, idx) => {
  if (l.includes('DEFAULT_CLASS_SUBJECTS') || l.includes('10th') || l.includes('getClassSubjectsDetailed')) {
    if (l.includes('10th') || l.includes('function getClassSubjectsDetailed') || l.includes('DEFAULT_CLASS_SUBJECTS')) {
      console.log(`Line ${idx + 1}: ${l.slice(0, 120)}`);
    }
  }
});
