const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');

// Find GENERATE_RAW_STUDENTS
const genIdx = content.indexOf('function GENERATE_RAW_STUDENTS');
if (genIdx !== -1) {
  console.log('GENERATE_RAW_STUDENTS snippet:');
  console.log(content.slice(genIdx, genIdx + 1500));
}

// Find state save & load points
const saveIdx = content.indexOf('function saveState');
if (saveIdx !== -1) {
  console.log('--- saveState snippet: ---');
  console.log(content.slice(saveIdx, saveIdx + 1200));
}
