const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('function getFilteredStudents')) {
    console.log(`Found at line ${idx + 1}`);
    for (let i = idx; i < Math.min(idx + 50, lines.length); i++) {
      console.log(lines[i]);
    }
  }
});
