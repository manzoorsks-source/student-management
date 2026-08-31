const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('getMonthlyInstallmentBreakdown') || line.includes('81835') || line.includes('latestTx') || line.includes('REC-STV-') || line.includes('studentFeeLedger')) {
    if (line.length < 200) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
