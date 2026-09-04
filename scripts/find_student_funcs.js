const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const targets = [
  'function addStudent',
  'function saveEditStudent',
  'function editStudent',
  'function deleteStudent',
  'function saveStudentMarks',
  'function saveBulkMarks',
  'function saveFeePayment',
  'function deleteFeePayment'
];

targets.forEach(t => {
  lines.forEach((l, idx) => {
    if (l.includes(t)) {
      console.log(`${t} at line ${idx + 1}: ${l.slice(0, 100)}`);
    }
  });
});
