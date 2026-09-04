const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(htmlPath, 'utf8');

const target = `    function saveAllAttendanceChanges() {
      const dStr = getSelectedAttendanceDate();
      CloudSync.saveAttendance(state.attendanceMap, dStr);
      const dStr = getSelectedAttendanceDate();
      saveState();
      showToast(\`✅ All attendance changes for \${formatIsoDateNice(dStr)} saved successfully to Database & Cloud!\`);
    }`;

const replacement = `    function saveAllAttendanceChanges() {
      const dStr = getSelectedAttendanceDate();
      CloudSync.saveAttendance(state.attendanceMap, dStr);
      saveState();
      showToast(\`✅ All attendance changes for \${formatIsoDateNice(dStr)} saved successfully to Database & Cloud!\`);
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(htmlPath, content, 'utf8');
  console.log('✅ Fixed duplicate dStr declaration.');
} else {
  console.log('Target not found directly, checking regex...');
  content = content.replace(
    /function saveAllAttendanceChanges\(\)\s*\{\s*const dStr = getSelectedAttendanceDate\(\);\s*CloudSync\.saveAttendance\(state\.attendanceMap,\s*dStr\);\s*const dStr = getSelectedAttendanceDate\(\);/,
    'function saveAllAttendanceChanges() {\n      const dStr = getSelectedAttendanceDate();\n      CloudSync.saveAttendance(state.attendanceMap, dStr);'
  );
  fs.writeFileSync(htmlPath, content, 'utf8');
  console.log('✅ Fixed with regex.');
}
