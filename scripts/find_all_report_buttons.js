const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Progress') || line.includes('Report Card') || line.includes('Marks & Reports') || line.includes('printReportCard') || line.includes('viewStudentProfile')) {
    if (line.length < 160) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
