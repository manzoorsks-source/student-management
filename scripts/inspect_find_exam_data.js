const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('findExamData')) {
    console.log(`Line ${idx + 1}: ${l.slice(0, 120)}`);
  }
});
