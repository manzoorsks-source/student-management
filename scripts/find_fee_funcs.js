const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('function getStudentFeeTotals') || line.includes('DEFAULT_CLASS_FEE_STRUCTURE') || line.includes('totalSchoolFee') || line.includes('getOverallFinancialStats')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
