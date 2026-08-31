const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = content.split('\n');

console.log('Total lines in index.html:', lines.length);

lines.forEach((line, idx) => {
  if (line.includes('<script') || line.includes('state =') || line.includes('INITIAL_STUDENTS') || line.includes('students:')) {
    console.log(`Line ${idx + 1}: ${line.trim().substring(0, 100)}`);
  }
});
