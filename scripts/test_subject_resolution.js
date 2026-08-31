const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)[1];
const cleanScript = scriptMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

const sandbox = {
  document: { getElementById: () => null },
  window: { location: { hash: '' }, scrollTo: () => {}, print: () => {} },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
  alert: console.log,
  console: console
};

vm.createContext(sandbox);
vm.runInContext(cleanScript + `
  const classesToTest = [
    'Nursery', 'LKG', 'UKG',
    '1st Class', '2nd Class', '3rd Class', '4th Class', '5th Class',
    '6th Class', '7th Class', '8th Class', '9th Class', '10th Class'
  ];

  const results = {};
  classesToTest.forEach(cls => {
    results[cls] = getClassSubjectsDetailed(cls).map(s => s.name);
  });
  globalThis.testResults = results;
`, sandbox);

console.log('--- SUBJECT RESOLUTION PER CLASS ---');
console.log(JSON.stringify(sandbox.testResults, null, 2));
