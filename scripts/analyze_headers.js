const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data_import', 'Students Particulars-2026 - 2027.xlsx');
const workbook = XLSX.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  console.log(`\n========================================`);
  console.log(`SHEET: "${sheetName}"`);
  console.log(`========================================`);
  for (let i = 0; i < Math.min(4, rows.length); i++) {
    console.log(`[R${i+1}]`, rows[i].filter(x => x !== '').join(' | '));
  }
});
