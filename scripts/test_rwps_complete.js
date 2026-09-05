const fs = require('fs');
const path = require('path');

console.log('🧪 Starting RWPS Comprehensive Test Suite...\n');

// Load index.html script context
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Extract script 5 (the main school system logic)
const scriptMatches = htmlContent.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
const mainScript = scriptMatches[scriptMatches.length - 1].replace(/^<script[\s\S]*?>/i, '').replace(/<\/script>$/i, '');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// Evaluate helpers in test scope
const testEnv = `
  const window = {
    addEventListener: () => {},
    location: { hash: '', search: '', pathname: '/', origin: 'http://localhost:8080' }
  };
  const location = window.location;
  const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const document = {
    getElementById: (id) => {
      if (id.startsWith('sub_r_')) return { value: '4' };
      if (id.startsWith('sub_w_')) return { value: '5' };
      if (id.startsWith('sub_p_')) return { value: '5' };
      if (id.startsWith('sub_s_')) return { value: '5' };
      if (id.startsWith('sub_mark_')) return { value: '' };
      return null;
    }
  };

` + mainScript + `

  // Exports for testing
  return {
    isHighSchoolWithRWPS,
    getStudentSubjectRWPS,
    getStudentSubjectEntry,
    normalizeClassCode,
    getClassSubjectsDetailed,
    calculateGradeAndGPA
  };
`;

const system = new Function(testEnv)();

// TEST 1: Class Scope Validation (8th, 9th, 10th ONLY)
console.log('--- TEST 1: Class Scope Validation for RWPS ---');
assert(system.isHighSchoolWithRWPS('10th Class - A') === true, '10th Class is identified for RWPS');
assert(system.isHighSchoolWithRWPS('10th Class') === true, '10th Class is identified for RWPS');
assert(system.isHighSchoolWithRWPS('9th Class') === true, '9th Class is identified for RWPS');
assert(system.isHighSchoolWithRWPS('8th Class') === true, '8th Class is identified for RWPS');
assert(system.isHighSchoolWithRWPS('Class 10') === true, 'Class 10 is identified for RWPS');
assert(system.isHighSchoolWithRWPS('7th Class') === false, '7th Class is NOT given RWPS');
assert(system.isHighSchoolWithRWPS('6th Class') === false, '6th Class is NOT given RWPS');
assert(system.isHighSchoolWithRWPS('5th Class') === false, '5th Class is NOT given RWPS');
assert(system.isHighSchoolWithRWPS('1st Class') === false, '1st Class is NOT given RWPS');
assert(system.isHighSchoolWithRWPS('UKG') === false, 'UKG is NOT given RWPS');
assert(system.isHighSchoolWithRWPS('NURSERY') === false, 'NURSERY is NOT given RWPS');

// TEST 2: 10th Class Student with Manual RWPS Components
console.log('\n--- TEST 2: 10th Class Student with Manual RWPS Entered ---');
const studentWithRWPS = {
  id: '3592',
  name: 'ASIYA ANJUM',
  grade: '10th Class',
  section: 'A',
  rollNo: '3',
  termMarks: {
    FA1: {
      '1st Lang. (Telugu)': '19',
      '2nd Lang. (Hindi)': '19',
      '3rd Lang. (English)': '19',
      'MATHEMATICS': '19',
      'Biological Science (B.S)': '9',
      'Physical Science (P.S)': '9',
      'SOCIAL STUDIES': '20',
      _rwps: {
        '1st Lang. (Telugu)': { r: 4, w: 5, p: 5, s: 5, total: 19 },
        '2nd Lang. (Hindi)': { r: 4, w: 5, p: 5, s: 5, total: 19 },
        '3rd Lang. (English)': { r: 4, w: 5, p: 5, s: 5, total: 19 },
        'MATHEMATICS': { r: 4, w: 5, p: 5, s: 5, total: 19 },
        'Biological Science (B.S)': { r: 3, w: 2, p: 2, s: 2, total: 9 },
        'Physical Science (P.S)': { r: 3, w: 2, p: 2, s: 2, total: 9 },
        'SOCIAL STUDIES': { r: 5, w: 5, p: 5, s: 5, total: 20 }
      }
    }
  }
};

const rwpsTelugu = system.getStudentSubjectRWPS(studentWithRWPS, 'FA1', '1st Lang. (Telugu)');
assert(rwpsTelugu !== null && rwpsTelugu.r === 4 && rwpsTelugu.w === 5 && rwpsTelugu.p === 5 && rwpsTelugu.s === 5, 'RWPS components retrieved correctly for Telugu');

const rwpsBS = system.getStudentSubjectRWPS(studentWithRWPS, 'FA1', 'Biological Science (B.S)');
assert(rwpsBS !== null && rwpsBS.r === 3 && rwpsBS.w === 2 && rwpsBS.p === 2 && rwpsBS.s === 2, 'RWPS components retrieved correctly for Biological Science (Max 10)');

// TEST 3: 10th Class Student with NO RWPS entered (Empty/Blank RWPS)
console.log('\n--- TEST 3: 10th Class Student with Blank/Unentered RWPS ---');
const studentWithoutRWPS = {
  id: '3593',
  name: 'RAHUL SHARMA',
  grade: '10th Class',
  section: 'A',
  rollNo: '4',
  termMarks: {
    FA1: {
      '1st Lang. (Telugu)': '19',
      '2nd Lang. (Hindi)': '19',
      '3rd Lang. (English)': '19',
      'MATHEMATICS': '19',
      'Biological Science (B.S)': '9',
      'Physical Science (P.S)': '9',
      'SOCIAL STUDIES': '20'
    }
  }
};

const teluguEntry = system.getStudentSubjectEntry(studentWithoutRWPS, 'FA1', { name: '1st Lang. (Telugu)', faMax: 20 });
assert(teluguEntry.entered === true && teluguEntry.mark === 19, 'Subject Total Mark is preserved (19/20) even when RWPS is not entered');

const bsEntry = system.getStudentSubjectEntry(studentWithoutRWPS, 'FA1', { name: 'Biological Science (B.S)', faMax: 10 });
assert(bsEntry.entered === true && bsEntry.mark === 9, 'Biological Science mark is preserved (9/10) even when RWPS is not entered');

const blankRWPS = system.getStudentSubjectRWPS(studentWithoutRWPS, 'FA1', '1st Lang. (Telugu)');
assert(blankRWPS === null, 'Returns null when RWPS is not entered (displaying -- in RWPS columns while preserving total score)');

// TEST 4: Max marks capping and validation
console.log('\n--- TEST 4: Validation and Capping ---');
const subjects10th = system.getClassSubjectsDetailed('10th Class', 'FA1');
const bsSubject = subjects10th.find(s => s.name.toLowerCase().includes('bio') || s.shortName === 'B.S');
const psSubject = subjects10th.find(s => s.name.toLowerCase().includes('physical') || s.shortName === 'P.S');
const mathSubject = subjects10th.find(s => s.name.toLowerCase().includes('math'));

assert(bsSubject && bsSubject.maxMarks === 10, '10th Class Biological Science FA max is 10');
assert(psSubject && psSubject.maxMarks === 10, '10th Class Physical Science FA max is 10');
assert(mathSubject && mathSubject.maxMarks === 20, '10th Class Mathematics FA max is 20');

// Calculate total formative score for 10th Class
let totalObt = 0;
let totalMax = 0;
subjects10th.forEach(sub => {
  const entry = system.getStudentSubjectEntry(studentWithRWPS, 'FA1', sub);
  if (entry.entered) {
    totalObt += entry.mark;
    totalMax += sub.maxMarks;
  }
});

assert(totalObt === 114, `Total Formative Score obtained is exactly 114 (Got: ${totalObt})`);
assert(totalMax === 120, `Total Formative Score maximum is exactly 120 (Got: ${totalMax})`);
const gradeInfo = system.calculateGradeAndGPA((totalObt / totalMax) * 100);
assert(gradeInfo.grade === 'A+', `Grade is A+ for 114/120 (Got: ${gradeInfo.grade})`);

console.log(`\n========================================`);
console.log(`🎉 ALL TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
console.log(`========================================`);
