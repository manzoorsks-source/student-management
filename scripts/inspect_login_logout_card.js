const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== 1. INITIAL_USERS (Lines 745-775) ===');
for (let i = 744; i < 775; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('\n=== 2. handleLogout (Lines 9015-9050) ===');
for (let i = 9014; i < 9050; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('\n=== 3. handleLogin (Lines 8935-8975) ===');
for (let i = 8934; i < 8975; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
