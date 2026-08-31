const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(htmlPath, 'utf-8');

// Normalize line endings to \n temporarily or split by lines
const lines = content.split(/\r?\n/);

console.log('Total lines:', lines.length);

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('if (matchedUser.passwordHash !== p)')) {
    console.log(`Found match at line ${i+1}`);
    lines[i] = '      const enteredHash = sha256(p);\n      if (matchedUser.passwordHash !== enteredHash && matchedUser.passwordHash !== p) {';
    break;
  }
}

content = lines.join('\n');
fs.writeFileSync(htmlPath, content, 'utf-8');
console.log('✅ Replaced password comparison in index.html!');
