const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)[1];
const cleanScript = scriptMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

// Create sandbox
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
vm.runInContext(cleanScript, sandbox);

console.log('--- TESTING IN-BROWSER AUTH & STATE ---');
console.log('View Mode:', sandbox.state.viewMode);
console.log('Students count:', sandbox.state.students.length);
console.log('Testing handleLogin with correspondent / admin123:');
sandbox.handleLogin();
console.log('Current User after login:', sandbox.state.currentUser ? sandbox.state.currentUser.fullName : 'None');
console.log('Login Error (if any):', sandbox.state.loginError || 'None (Success)');
console.log('View Mode after login:', sandbox.state.viewMode);
console.log('Active Tab after login:', sandbox.state.activeTab);
