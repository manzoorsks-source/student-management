const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data_import', 'Students Particulars-2026 - 2027.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('--- ALL SHEETS & ESTIMATED ROWS ---');
let totalRows = 0;

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  console.log(`Sheet "${sheetName}": ${data.length} rows`);
  totalRows += data.length;
});

console.log(`Total across ${workbook.SheetNames.length} sheets: ${totalRows} rows`);
