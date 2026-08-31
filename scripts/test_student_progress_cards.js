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
  // Login first
  handleLogin();

  // Test 1: Nursery Student
  const nurseryStudent = state.students.find(s => s.grade === 'Nursery');
  openStudentProgressReportModal(nurseryStudent.id);
  const nurseryCardStudent = state.modalStudent.name;
  const nurseryCardGrade = state.modalStudent.grade;
  const nurserySubjects = getClassSubjectsDetailed(state.modalStudent.grade).map(s => s.name);

  // Test 2: 1st Class Student
  const firstClassStudent = state.students.find(s => s.grade === '1st Class');
  openStudentProgressReportModal(firstClassStudent.id);
  const firstCardStudent = state.modalStudent.name;
  const firstCardGrade = state.modalStudent.grade;
  const firstSubjects = getClassSubjectsDetailed(state.modalStudent.grade).map(s => s.name);

  // Test 3: 6th Class Student
  const sixthClassStudent = state.students.find(s => s.grade === '6th Class');
  openStudentProgressReportModal(sixthClassStudent.id);
  const sixthCardStudent = state.modalStudent.name;
  const sixthCardGrade = state.modalStudent.grade;
  const sixthSubjects = getClassSubjectsDetailed(state.modalStudent.grade).map(s => s.name);

  // Test 4: 10th Class Student
  const tenthClassStudent = state.students.find(s => s.grade === '10th Class');
  openStudentProgressReportModal(tenthClassStudent.id);
  const tenthCardStudent = state.modalStudent.name;
  const tenthCardGrade = state.modalStudent.grade;
  const tenthSubjects = getClassSubjectsDetailed(state.modalStudent.grade).map(s => s.name);

  globalThis.testOutput = {
    nursery: { student: nurseryCardStudent, grade: nurseryCardGrade, subjects: nurserySubjects },
    first: { student: firstCardStudent, grade: firstCardGrade, subjects: firstSubjects },
    sixth: { student: sixthCardStudent, grade: sixthCardGrade, subjects: sixthSubjects },
    tenth: { student: tenthCardStudent, grade: tenthCardGrade, subjects: tenthSubjects }
  };
`, sandbox);

console.log('\n--- PROGRESS CARD VALIDATION ACROSS CLASSES ---');
console.log('1. Nursery Student Card:', sandbox.testOutput.nursery);
console.log('\n2. 1st Class Student Card:', sandbox.testOutput.first);
console.log('\n3. 6th Class Student Card:', sandbox.testOutput.sixth);
console.log('\n4. 10th Class Student Card:', sandbox.testOutput.tenth);
