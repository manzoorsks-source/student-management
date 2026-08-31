const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('INITIAL_USERS') || line.includes('handleRoleSelect') || line.includes('admin123') || line.includes('demo') || line.includes('login') || line.includes('Staff Authentication') || line.includes('quickLogin') || line.includes('prefill') || line.includes('credentials')) {
    if (line.length < 200) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
