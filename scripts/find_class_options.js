const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('selectedGrade') || line.includes('All Classes') || line.includes('All Grades') || line.includes('<option value="1st"') || line.includes('<option value="I"')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
