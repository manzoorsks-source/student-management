const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

html = html.replace(
  `      if (matchedUser.passwordHash !== p) {
        state.loginError = '⚠️ Incorrect Password! Please check your password or contact the Correspondent (Super Admin).';
        saveState();
        return;
      }`,
  `      const enteredHash = sha256(p);
      if (matchedUser.passwordHash !== enteredHash && matchedUser.passwordHash !== p) {
        state.loginError = '⚠️ Invalid Credentials! Please check your username and password.';
        saveState();
        return;
      }`
);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Updated handleLogin password check.');

// Test sandbox
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)[1];
const cleanScript = scriptMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

const sandbox = {
  document: {
    getElementById: (id) => {
      if (id === 'app') return { innerHTML: '' };
      if (id === 'loginUsername') return { value: 'correspondent' };
      if (id === 'loginPassword') return { value: 'admin123' };
      if (id === 'loginRole') return { value: 'super_admin' };
      return null;
    }
  },
  window: { location: { hash: '' }, scrollTo: () => {} },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  console: console
};

vm.createContext(sandbox);
vm.runInContext(cleanScript + '; globalThis.testState = state; handleLogin(); globalThis.afterLoginState = state;', sandbox);

console.log('Login result user:', sandbox.afterLoginState.currentUser ? sandbox.afterLoginState.currentUser.fullName : 'FAILED');
console.log('View mode:', sandbox.afterLoginState.viewMode);
console.log('Active tab:', sandbox.afterLoginState.activeTab);
