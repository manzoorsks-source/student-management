const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('COMBINED RESULTS') || line.includes('openReportCard') || line.includes('openProgressCard') || line.includes('openMarksModal') || line.includes('printProgressCard') || line.includes('academicProgressCard') || line.includes('FORMATIVE FA 1')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
