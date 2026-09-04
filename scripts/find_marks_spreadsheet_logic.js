const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (
    l.includes('Save All Class Marks') ||
    l.includes('SPREADSHEET MARKS') ||
    l.includes('Lock & Publish') ||
    l.includes('saveAllClassMarks') ||
    l.includes('saveBulkMarks') ||
    l.includes('saveSpreadsheetMarks') ||
    l.includes('examMarks') ||
    l.includes('Spreadsheet')
  ) {
    console.log(`Line ${idx + 1}: ${l.trim().slice(0, 120)}`);
  }
});
