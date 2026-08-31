const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data_import', 'Students Particulars-2026 - 2027.xlsx');
const workbook = XLSX.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  let validStudents = 0;
  let sectionTitles = [];

  rows.forEach((row, idx) => {
    const rStr = row.join(' ').trim();
    if (rStr.includes('SECTION') || rStr.includes('CLASS')) {
      sectionTitles.push(`Row ${idx+1}: ${row.filter(Boolean).join(' ')}`);
    }
    // Check if row has S.No and Student Name
    const sNo = row[0];
    const admnNo = row[1];
    const name = row[2];
    if ((typeof sNo === 'number' || (!isNaN(parseInt(sNo)) && parseInt(sNo) > 0)) && name && typeof name === 'string' && name.trim().length > 1) {
      validStudents++;
    }
  });

  console.log(`Sheet [${sheetName}]: ~${validStudents} valid student rows. Headers/Sections:`, sectionTitles);
});
