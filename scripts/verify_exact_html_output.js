const fs = require('fs');
const path = require('path');

console.log('🧪 Comprehensive All-Classes Card Verification...\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptMatches = htmlContent.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
const mainScript = scriptMatches[scriptMatches.length - 1].replace(/^<script[\s\S]*?>/i, '').replace(/<\/script>$/i, '');

const testEnv = `
  const window = {
    addEventListener: () => {},
    location: { hash: '', search: '', pathname: '/', origin: 'http://localhost:8080' }
  };
  const location = window.location;
  const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  let appHtml = '';
  const appEl = {
    set innerHTML(val) { appHtml = val; },
    get innerHTML() { return appHtml; }
  };
  const document = {
    getElementById: (id) => (id === 'app' ? appEl : null),
    querySelector: () => null,
    querySelectorAll: () => []
  };

` + mainScript + `

  return {
    state,
    renderApp: () => {
      render();
      return appHtml;
    }
  };
`;

const system = new Function(testEnv)();
system.state.token = 'test-token-123';
system.state.currentUser = { id: 'admin', role: 'super_admin', name: 'Principal' };

const testClasses = [
  { grade: 'Nursery', expectedRWPS: false },
  { grade: 'LKG', expectedRWPS: false },
  { grade: 'UKG', expectedRWPS: false },
  { grade: '1st Class', expectedRWPS: false },
  { grade: '1st Class - A', expectedRWPS: false },
  { grade: '2nd Class', expectedRWPS: false },
  { grade: '3rd Class', expectedRWPS: false },
  { grade: '4th Class', expectedRWPS: false },
  { grade: '5th Class', expectedRWPS: false },
  { grade: '6th Class', expectedRWPS: false },
  { grade: '7th Class', expectedRWPS: false },
  { grade: '8th Class', expectedRWPS: true },
  { grade: '8th Class - A', expectedRWPS: true },
  { grade: '9th Class', expectedRWPS: true },
  { grade: '10th Class', expectedRWPS: true },
  { grade: '10th Class - A', expectedRWPS: true }
];

let failedCount = 0;

testClasses.forEach(tc => {
  const dummyStudent = {
    id: '999',
    name: 'TEST STUDENT',
    grade: tc.grade,
    section: 'A',
    rollNo: '1',
    termMarks: {
      FA1: {
        'Telugu': '19',
        'Hindi': '19',
        'English': '19',
        'Mathematics': '19',
        'Science': '19',
        'Social': '19',
        'Bio science': '9',
        'physical science': '9',
        'EVS': '19',
        'General English': '19'
      }
    }
  };

  system.state.students = [dummyStudent];
  system.state.modalStudent = dummyStudent;
  system.state.activeModal = 'printReportCard';
  system.state.reportCardSubTab = 'fa1';

  const html = system.renderApp();
  const hasRWPS = html.includes('Read & Reflection') || html.includes('Written Work') || html.includes('Slip Test');

  if (hasRWPS === tc.expectedRWPS) {
    console.log(`  ✅ PASS: ${tc.grade.padEnd(16)} -> RWPS Columns: ${hasRWPS ? 'YES (8-Cols)' : 'NO (5-Cols)'}`);
  } else {
    console.error(`  ❌ FAIL: ${tc.grade.padEnd(16)} -> Expected RWPS=${tc.expectedRWPS}, but got ${hasRWPS}`);
    failedCount++;
  }
});

console.log(`\n========================================`);
if (failedCount === 0) {
  console.log(`🎉 ALL ${testClasses.length} CLASSES PASSED SCOPE ISOLATION TESTS!`);
} else {
  console.error(`❌ ${failedCount} CLASSES FAILED!`);
  process.exit(1);
}
console.log(`========================================`);
