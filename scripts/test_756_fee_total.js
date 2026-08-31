const fs = require('fs');
const path = require('path');

const students = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data_import', 'all_students.json'), 'utf-8'));

const feeConfigMap = {
  'Nursery': { monthlyFee: 2100, yearlyExamFee: 1100 },
  'LKG': { monthlyFee: 2300, yearlyExamFee: 1100 },
  'UKG': { monthlyFee: 2200, yearlyExamFee: 1100 },
  '1st Class': { monthlyFee: 2400, yearlyExamFee: 1100 },
  '2nd Class': { monthlyFee: 2500, yearlyExamFee: 1100 },
  '3rd Class': { monthlyFee: 2600, yearlyExamFee: 1100 },
  '4th Class': { monthlyFee: 2700, yearlyExamFee: 1100 },
  '5th Class': { monthlyFee: 2800, yearlyExamFee: 1100 },
  '6th Class': { monthlyFee: 3000, yearlyExamFee: 1200 },
  '7th Class': { monthlyFee: 3200, yearlyExamFee: 1200 },
  '8th Class': { monthlyFee: 3500, yearlyExamFee: 1200 },
  '9th Class': { monthlyFee: 3800, yearlyExamFee: 1200 },
  '10th Class': { monthlyFee: 4300, yearlyExamFee: 2500 }
};

let totalStudents = students.length;
let totalTuition11Months = 0;
let totalExamFee = 0;
let totalSchoolAnnualFee = 0;

const classSummary = {};

students.forEach(s => {
  const cfg = feeConfigMap[s.grade] || { monthlyFee: s.monthlyFee || 2500, yearlyExamFee: 1100 };
  const tuition11 = cfg.monthlyFee * 11;
  const exam = cfg.yearlyExamFee;
  const annual = tuition11 + exam;

  totalTuition11Months += tuition11;
  totalExamFee += exam;
  totalSchoolAnnualFee += annual;

  if (!classSummary[s.grade]) {
    classSummary[s.grade] = { count: 0, monthlyFee: cfg.monthlyFee, examFee: cfg.yearlyExamFee, examTotal: 0, tuitionTotal: 0, classTotal: 0 };
  }
  classSummary[s.grade].count++;
  classSummary[s.grade].examTotal += exam;
  classSummary[s.grade].tuitionTotal += tuition11;
  classSummary[s.grade].classTotal += annual;
});

console.log('--- CLASS-WISE 11-MONTH FEE SUMMARY (756 STUDENTS) ---');
console.table(classSummary);

console.log('------------------------------------------------------');
console.log('TOTAL STUDENTS:', totalStudents);
console.log('TOTAL YEARLY EXAM FEE (ALL CLASSES): ₹' + totalExamFee.toLocaleString());
console.log('TOTAL 11-MONTH TUITION PACKAGE: ₹' + totalTuition11Months.toLocaleString());
console.log('TOTAL SCHOOL FEE (ALL 756 STUDENTS): ₹' + totalSchoolAnnualFee.toLocaleString());
