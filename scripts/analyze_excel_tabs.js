const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.join(__dirname, '..', 'data_import', 'Students Particulars-2026 - 2027.xlsx');
const workbook = XLSX.readFile(excelPath);

console.log('Workbook Sheet Names:', workbook.SheetNames);

let totalAcrossAll = 0;
let totalWithoutDouble = 0;

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  let validStudentCount = 0;
  const sampleStudents = [];

  rows.forEach(row => {
    const sNo = row[0];
    const admnNo = String(row[1] || '').trim();
    const studentName = String(row[2] || '').trim();

    if ((typeof sNo === 'number' || (!isNaN(parseInt(sNo)) && parseInt(sNo) > 0)) &&
        studentName && studentName.length > 1 &&
        !studentName.includes('NAME OF') && !studentName.includes('STUDENT NAME') && !studentName.includes('SECTION')) {
      validStudentCount++;
      if (sampleStudents.length < 3) sampleStudents.push({ sNo, admnNo, studentName });
    }
  });

  console.log(`Sheet "${sheetName}": ${validStudentCount} students. Sample:`, sampleStudents[0]);
  totalAcrossAll += validStudentCount;
  if (sheetName.trim().toUpperCase() !== 'DOUBLE') {
    totalWithoutDouble += validStudentCount;
  }
});

console.log('\n--- TOTALS ---');
console.log('Total Across ALL sheets (including DOUBLE):', totalAcrossAll);
console.log('Total WITHOUT "DOUBLE" sheet:', totalWithoutDouble);
