const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)[1];
const cleanScript = scriptMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

const sandbox = {
  document: {
    getElementById: (id) => {
      if (id === 'app') return { innerHTML: '' };
      return null;
    }
  },
  window: {
    location: { hash: '' },
    scrollTo: () => {},
    print: () => {}
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  alert: (msg) => console.log('ALERT:', msg),
  console: console
};

vm.createContext(sandbox);
vm.runInContext(cleanScript + `
  const generatedReceipts = [];
  for (let i = 0; i < 12; i++) {
    generatedReceipts.push(getNextReceiptNumber());
  }
  globalThis.receipts = generatedReceipts;
`, sandbox);

console.log('\n--- 12 CONSECUTIVE RECEIPT NUMBER SIMULATION ---');
sandbox.receipts.forEach((r, idx) => {
  console.log(`Transaction #${idx + 1}: ${r}`);
});
