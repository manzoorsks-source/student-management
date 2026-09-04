const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const targets = ['correspondent', 'principal123', 'admin123', 'accountant123', 'testing'];
lines.forEach((line, idx) => {
  for (const t of targets) {
    if (line.includes(t)) {
      console.log(`${idx + 1}: ${line.trim()}`);
      break;
    }
  }
});
