const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const funcs = [
  'function saveTeacher',
  'function deleteTeacher',
  'function saveUserAccount',
  'function deleteUserAccount',
  'function addSubject',
  'function removeSubject',
  'function saveFeeStructure',
  'function saveTimetableCell',
  'function toggleExamLockStatus',
  'function updateStudentTeacherRemarks',
  'function promoteStudents',
  'function undoPromotion',
  'function changeAcademicYear',
  'function commitImport'
];

funcs.forEach(f => {
  lines.forEach((l, idx) => {
    if (l.includes(f)) {
      console.log(`Found ${f} at line ${idx + 1}`);
    }
  });
});
