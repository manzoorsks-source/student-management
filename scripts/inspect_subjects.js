const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

let capturing = false;
const subjectLines = [];
lines.forEach(line => {
  if (line.includes('const DEFAULT_CLASS_SUBJECTS = {')) capturing = true;
  if (capturing) {
    subjectLines.push(line);
    if (line.includes('const DEFAULT_GRADE_RULES')) capturing = false;
  }
});

console.log(subjectLines.join('\n'));
