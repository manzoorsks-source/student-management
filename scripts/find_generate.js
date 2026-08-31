const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('GENERATE_RAW_STUDENTS') || line.includes('function GENERATE')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
