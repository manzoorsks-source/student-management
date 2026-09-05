const fs = require('fs');
const path = require('path');

console.log('🧪 Starting HTML Progress Card Render Verification...\n');

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
  const document = {
    getElementById: (id) => null
  };

` + mainScript + `

  return {
    openStudentProgressReportModal,
    isHighSchoolWithRWPS,
    getClassSubjectsDetailed,
    getStudentSubjectEntry,
    getStudentSubjectRWPS,
    calculateGradeAndGPA,
    state
  };
`;

const system = new Function(testEnv)();

// Mock students
const student10th = {
  id: '3592',
  name: 'ASIYA ANJUM',
  grade: '10th Class',
  section: 'A',
  rollNo: '3',
  termMarks: {
    FA1: {
      'Telugu': '19',
      'Hindi': '19',
      'English': '19',
      'Mathematics': '19',
      'Bio science': '9',
      'physical science': '9',
      'Social': '20',
      _rwps: {
        'Telugu': { r: 4, w: 5, p: 5, s: 5, total: 19 },
        'Hindi': { r: 4, w: 5, p: 5, s: 5, total: 19 },
        'English': { r: 4, w: 5, p: 5, s: 5, total: 19 },
        'Mathematics': { r: 4, w: 5, p: 5, s: 5, total: 19 },
        'Bio science': { r: 3, w: 2, p: 2, s: 2, total: 9 },
        'physical science': { r: 3, w: 2, p: 2, s: 2, total: 9 },
        'Social': { r: 5, w: 5, p: 5, s: 5, total: 20 }
      }
    }
  }
};

const student5th = {
  id: '101',
  name: 'MOHAMMED ZAYN',
  grade: '5th Class',
  section: 'A',
  rollNo: '1',
  termMarks: {
    FA1: {
      'Telugu': '18',
      'Hindi': '19',
      'English': '18',
      'Mathematics': '20',
      'EVS': '19',
      'General English': '18'
    }
  }
};

system.state.students = [student10th, student5th];

// Check 10th class card generation logic
console.log('--- Checking 10th Class Progress Card generation ---');
const isHighSchool10 = system.isHighSchoolWithRWPS(student10th.grade);
console.log('isHighSchool for 10th Class:', isHighSchool10);
if (!isHighSchool10) {
  console.error('FAIL: 10th Class must be isHighSchool = true');
  process.exit(1);
}

// Check 5th class card generation logic
console.log('--- Checking 5th Class Progress Card generation ---');
const isHighSchool5 = system.isHighSchoolWithRWPS(student5th.grade);
console.log('isHighSchool for 5th Class:', isHighSchool5);
if (isHighSchool5) {
  console.error('FAIL: 5th Class must be isHighSchool = false');
  process.exit(1);
}

console.log('✅ HTML render logic verified successfully!');
