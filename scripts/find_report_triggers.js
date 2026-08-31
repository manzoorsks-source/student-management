const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('openReportCardModal') || line.includes('openEditMarksModal') || line.includes('openStudentMarks') || line.includes('SYED YASEER') || line.includes('setReportSubTab') || line.includes('activeModal = \'printReportCard\'')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
