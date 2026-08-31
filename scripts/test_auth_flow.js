const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)[1];
const cleanScript = scriptMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

const mockDocument = {
  getElementById: (id) => {
    if (id === 'app') return { innerHTML: '' };
    if (id === 'loginUsername') return { value: 'correspondent' };
    if (id === 'loginPassword') return { value: 'admin123' };
    if (id === 'loginRole') return { value: 'super_admin' };
    return null;
  }
};

const sandbox = {
  document: mockDocument,
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
vm.runInContext(cleanScript + `
  globalThis.uHash = state.users[0].passwordHash;
  globalThis.pHash = sha256("admin123");
  handleLogin();
  globalThis.currentUser = state.currentUser;
  globalThis.viewMode = state.viewMode;
  globalThis.loginError = state.loginError;
`, sandbox);

console.log('User in state hash:', sandbox.uHash);
console.log('Computed admin123 hash:', sandbox.pHash);
console.log('Are hashes equal?', sandbox.uHash === sandbox.pHash);
console.log('Login Error:', sandbox.loginError || 'NONE');
console.log('Logged in user:', sandbox.currentUser ? sandbox.currentUser.fullName : 'NULL');
console.log('View mode:', sandbox.viewMode);
