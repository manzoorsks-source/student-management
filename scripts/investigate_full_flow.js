const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('--- 1. Searching handleLogout ---');
lines.forEach((l, idx) => {
  if (l.includes('function handleLogout') || l.includes('handleLogout()')) {
    console.log(`Line ${idx + 1}: ${l.slice(0, 100)}`);
  }
});

console.log('\n--- 2. Searching INITIAL_USERS and testing user ---');
lines.forEach((l, idx) => {
  if (l.includes('testing') || l.includes('tester') || l.includes('INITIAL_USERS') || l.includes('loadUsersState')) {
    console.log(`Line ${idx + 1}: ${l.slice(0, 100)}`);
  }
});

console.log('\n--- 3. Searching Progress Card / Booklet rendering ---');
lines.forEach((l, idx) => {
  if (l.includes('PROGRESS CARD & EXAM TERM BOOKLET') || l.includes('Combined Annual (Image 3)') || l.includes('FA1 Card (Image 2)')) {
    console.log(`Line ${idx + 1}: ${l.slice(0, 100)}`);
  }
});
