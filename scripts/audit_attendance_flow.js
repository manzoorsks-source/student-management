const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== ATTENDANCE REFERENCES IN index.html ===');
lines.forEach((l, idx) => {
  if (
    l.includes('setAttendance') ||
    l.includes('attendanceMap') ||
    l.includes('attendanceHistory') ||
    l.includes('saveAllAttendanceChanges') ||
    l.includes('markAllStudentsPresent') ||
    l.includes('getStudentAttendanceStatus') ||
    l.includes('stv_attendance') ||
    l.includes('selectedAttendanceDate')
  ) {
    console.log(`Line ${idx + 1}: ${l.slice(0, 120)}`);
  }
});
