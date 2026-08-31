const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data_import', 'Students Particulars-2026 - 2027.xlsx');
console.log('Reading Excel workbook from:', filePath);

const workbook = XLSX.readFile(filePath);
console.log('\nWorkbook Sheet Names (', workbook.SheetNames.length, 'sheets ):');
console.log(workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  console.log(`\n========================================`);
  console.log(`SHEET: "${sheetName}" (${data.length} rows)`);
  console.log(`========================================`);
  
  // Show first 5 rows
  for (let i = 0; i < Math.min(5, data.length); i++) {
    console.log(`Row ${i + 1}:`, JSON.stringify(data[i]));
  }
});
