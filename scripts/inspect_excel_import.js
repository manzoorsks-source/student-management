const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('handleImport') || l.includes('importExcel') || l.includes('processExcel') || l.includes('readAsArrayBuffer') || l.includes('XLSX.read')) {
    console.log(`Line ${idx + 1}: ${l.slice(0, 120)}`);
  }
});
