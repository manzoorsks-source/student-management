const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const targets = [
  'function addStudent',
  'function saveEditStudent',
  'function deleteStudent',
  'function saveFeePayment',
  'function saveStudentMarks',
  'function saveBulkMarks',
  'function setAttendance',
  'function markAllStudentsPresentForDate',
  'function saveAllAttendanceChanges',
  'function addTask',
  'function toggleTask',
  'function deleteTask',
  'function addNote',
  'function deleteNote',
  'function addSubject',
  'function removeSubject',
  'function saveTeacher',
  'function deleteTeacher',
  'function saveUser',
  'function deleteUser',
  'function saveState'
];

targets.forEach(target => {
  lines.forEach((line, idx) => {
    if (line.includes(target)) {
      console.log(`${target} found at line ${idx + 1}`);
      for (let j = idx; j <= Math.min(lines.length - 1, idx + 20); j++) {
        console.log(`  ${j + 1}: ${lines[j].slice(0, 100)}`);
        if (lines[j].includes('}') && j > idx + 5) break;
      }
    }
  });
});
