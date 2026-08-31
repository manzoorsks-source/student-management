const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.join(__dirname, '..', 'data_import', 'Students Particulars-2026 - 2027.xlsx');
const workbook = XLSX.readFile(excelPath);

const studentMap = new Map();
const duplicates = [];

workbook.SheetNames.forEach(sheetName => {
  if (sheetName.trim().toUpperCase() === 'DOUBLE') return; // Exclude duplicate sheet

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  rows.forEach(row => {
    const sNo = row[0];
    const admnNo = String(row[1] || '').trim();
    const studentName = String(row[2] || '').trim();

    if ((typeof sNo === 'number' || (!isNaN(parseInt(sNo)) && parseInt(sNo) > 0)) &&
        studentName && studentName.length > 1 &&
        !studentName.includes('NAME OF') && !studentName.includes('STUDENT NAME') && !studentName.includes('SECTION')) {
      
      const key = `${admnNo}_${studentName.toUpperCase()}`;
      if (studentMap.has(key)) {
        duplicates.push({ key, sheetName, prev: studentMap.get(key) });
      } else {
        studentMap.set(key, { sheetName, sNo, admnNo, studentName });
      }
    }
  });
});

console.log(`Distinct students across Nursery to 10th Class: ${studentMap.size}`);
console.log(`Duplicates found across standard classes: ${duplicates.length}`);
