const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

console.log('HTML file size:', (html.length / 1024 / 1024).toFixed(2), 'MB');
console.log('APP_VERSION check:', html.includes('stv_v2026_excel_full_roster_789'));
console.log('GENERATE_RAW_STUDENTS check (has STV-5101):', html.includes('STV-5101'));
console.log('Total students embedded:', (html.match(/uniqueStudentId|"id":"STV-/g) || []).length);
