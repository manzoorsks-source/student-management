const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('isSameClass') || line.includes('getClassSubjectsDetailed') || line.includes('getClassFeeConfig') || line.includes('selectedGrade') || line.includes('handleGradeFilter')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
