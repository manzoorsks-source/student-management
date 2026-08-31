const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const target = `      if (matchedUser.passwordHash !== p) {
        state.loginError = '⚠️ Incorrect Password! Please check your password or contact the Correspondent (Super Admin).';
        saveState();
        return;
      }`;

const replacement = `      const enteredHash = sha256(p);
      if (matchedUser.passwordHash !== enteredHash && matchedUser.passwordHash !== p) {
        state.loginError = '⚠️ Incorrect Password! Please check your password or contact the Correspondent (Super Admin).';
        saveState();
        return;
      }`;

if (html.includes(target)) {
  html = html.replace(target, replacement);
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log('✅ Successfully replaced password check in index.html!');
} else {
  console.log('Target string not found, searching index.html...');
}
