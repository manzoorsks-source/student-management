const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('Searching all state.students modifications:');
lines.forEach((l, idx) => {
  if (
    l.includes('state.students =') ||
    l.includes('state.students.map') ||
    l.includes('state.students.filter') ||
    l.includes('state.students.unshift') ||
    l.includes('state.students.push') ||
    l.includes('s.termMarks') ||
    l.includes('studentObj.termMarks') ||
    l.includes('s.paymentHistory') ||
    l.includes('student.paymentHistory') ||
    l.includes('s.attendanceHistory')
  ) {
    console.log(`Line ${idx + 1}: ${l.trim().slice(0, 120)}`);
  }
});
