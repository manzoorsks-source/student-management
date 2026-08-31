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
  // Test isSameClass
  const test1 = isSameClass('10th Class', '1st Class');
  const test2 = isSameClass('1st Class', '10th Class');
  const test3 = isSameClass('10th Class', '10th Class');
  const test4 = isSameClass('1st Class', '1st Class');

  // Filter 10th Class
  const tenthStudents = state.students.filter(s => isSameClass(s.grade, '10th Class'));
  const tenthContainsFirst = tenthStudents.some(s => s.grade === '1st Class');

  // Filter 1st Class
  const firstStudents = state.students.filter(s => isSameClass(s.grade, '1st Class'));
  const firstContainsTenth = firstStudents.some(s => s.grade === '10th Class');

  // Filter 10th Class Section A
  const tenthSecA = state.students.filter(s => isSameClass(s.grade, '10th Class') && isSameSection(s.section, 'A'));

  globalThis.isolationResults = {
    isSameClass_10_and_1: test1,
    isSameClass_1_and_10: test2,
    isSameClass_10_and_10: test3,
    isSameClass_1_and_1: test4,
    tenthTotalCount: tenthStudents.length,
    tenthContainsFirst: tenthContainsFirst,
    firstTotalCount: firstStudents.length,
    firstContainsTenth: firstContainsTenth,
    tenthSecACount: tenthSecA.length,
    sampleTenthStudent: tenthStudents[0]?.name,
    sampleFirstStudent: firstStudents[0]?.name
  };
`, sandbox);

console.log('\n--- CLASS ISOLATION & FILTERING RESULTS ---');
console.log(JSON.stringify(sandbox.isolationResults, null, 2));
