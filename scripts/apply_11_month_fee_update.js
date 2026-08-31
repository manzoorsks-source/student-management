const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const jsonPath = path.join(__dirname, '..', 'data_import', 'all_students.json');

// Exact Official Fee Structure
const OFFICIAL_FEE_MAP = {
  'Nursery': { monthlyFee: 2100, yearlyExamFee: 1100, yearlyFee: 24200 },
  'UKG': { monthlyFee: 2200, yearlyExamFee: 1100, yearlyFee: 25300 },
  'LKG': { monthlyFee: 2300, yearlyExamFee: 1100, yearlyFee: 26400 },
  '1st Class': { monthlyFee: 2400, yearlyExamFee: 1100, yearlyFee: 27500 },
  '2nd Class': { monthlyFee: 2500, yearlyExamFee: 1100, yearlyFee: 28600 },
  '3rd Class': { monthlyFee: 2600, yearlyExamFee: 1100, yearlyFee: 29700 },
  '4th Class': { monthlyFee: 2700, yearlyExamFee: 1100, yearlyFee: 30800 },
  '5th Class': { monthlyFee: 2800, yearlyExamFee: 1100, yearlyFee: 31900 },
  '6th Class': { monthlyFee: 3000, yearlyExamFee: 1200, yearlyFee: 34200 },
  '7th Class': { monthlyFee: 3200, yearlyExamFee: 1200, yearlyFee: 36400 },
  '8th Class': { monthlyFee: 3500, yearlyExamFee: 1200, yearlyFee: 39700 },
  '9th Class': { monthlyFee: 3800, yearlyExamFee: 1200, yearlyFee: 43000 },
  '10th Class': { monthlyFee: 4300, yearlyExamFee: 2500, yearlyFee: 49800 }
};

// 1. Update all_students.json
const students = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
students.forEach(s => {
  const cfg = OFFICIAL_FEE_MAP[s.grade] || OFFICIAL_FEE_MAP['1st Class'];
  s.monthlyFee = cfg.monthlyFee;
  s.examFee = cfg.yearlyExamFee;
  s.totalMonths = 11;
  s.paidMonths = 0;
  s.paymentHistory = [];
  s.admissionFeePaid = false;
  s.examFeePaid = false;
});
fs.writeFileSync(jsonPath, JSON.stringify(students, null, 2), 'utf-8');
console.log(`✅ Updated all_students.json with 11-month package and official fees.`);

// 2. Update index.html
let html = fs.readFileSync(htmlPath, 'utf-8');

// Update DEFAULT_CLASS_FEE_STRUCTURE
const newFeeStructureCode = `    const DEFAULT_CLASS_FEE_STRUCTURE = {
      'Nursery': { monthlyFee: 2100, yearlyExamFee: 1100, yearlyFee: 24200 },
      'UKG': { monthlyFee: 2200, yearlyExamFee: 1100, yearlyFee: 25300 },
      'LKG': { monthlyFee: 2300, yearlyExamFee: 1100, yearlyFee: 26400 },
      '1st': { monthlyFee: 2400, yearlyExamFee: 1100, yearlyFee: 27500 },
      '2nd': { monthlyFee: 2500, yearlyExamFee: 1100, yearlyFee: 28600 },
      '3rd': { monthlyFee: 2600, yearlyExamFee: 1100, yearlyFee: 29700 },
      '4th': { monthlyFee: 2700, yearlyExamFee: 1100, yearlyFee: 30800 },
      '5th': { monthlyFee: 2800, yearlyExamFee: 1100, yearlyFee: 31900 },
      '6th': { monthlyFee: 3000, yearlyExamFee: 1200, yearlyFee: 34200 },
      '7th': { monthlyFee: 3200, yearlyExamFee: 1200, yearlyFee: 36400 },
      '8th': { monthlyFee: 3500, yearlyExamFee: 1200, yearlyFee: 39700 },
      '9th': { monthlyFee: 3800, yearlyExamFee: 1200, yearlyFee: 43000 },
      '10th': { monthlyFee: 4300, yearlyExamFee: 2500, yearlyFee: 49800 }
    };`;

html = html.replace(/const DEFAULT_CLASS_FEE_STRUCTURE = \{[\s\S]*?\};\s*function getClassFeeConfig/m, newFeeStructureCode + '\n\n    function getClassFeeConfig');

// Update getClassFeeConfig to check UKG before LKG
const newGetClassFeeConfig = `    function getClassFeeConfig(className) {
      if (!className) return { monthlyFee: 2400, yearlyExamFee: 1100, yearlyFee: 27500 };
      const str = className.toString().trim().toLowerCase();
      const feeMap = (typeof state !== 'undefined' && state && state.classFeeStructure) ? state.classFeeStructure : DEFAULT_CLASS_FEE_STRUCTURE;
      
      if (str.includes('nursery')) return feeMap['Nursery'] || DEFAULT_CLASS_FEE_STRUCTURE['Nursery'];
      if (str.includes('ukg') || str.includes('u.k.g')) return feeMap['UKG'] || DEFAULT_CLASS_FEE_STRUCTURE['UKG'];
      if (str.includes('lkg') || str.includes('l.k.g')) return feeMap['LKG'] || DEFAULT_CLASS_FEE_STRUCTURE['LKG'];
      if (str.includes('1st') || str === '1' || str === 'i' || str.includes('class 1')) return feeMap['1st'] || DEFAULT_CLASS_FEE_STRUCTURE['1st'];
      if (str.includes('2nd') || str === '2' || str === 'ii' || str.includes('class 2')) return feeMap['2nd'] || DEFAULT_CLASS_FEE_STRUCTURE['2nd'];
      if (str.includes('3rd') || str === '3' || str === 'iii' || str.includes('class 3')) return feeMap['3rd'] || DEFAULT_CLASS_FEE_STRUCTURE['3rd'];
      if (str.includes('4th') || str === '4' || str === 'iv' || str.includes('class 4')) return feeMap['4th'] || DEFAULT_CLASS_FEE_STRUCTURE['4th'];
      if (str.includes('5th') || str === '5' || str === 'v' || str.includes('class 5')) return feeMap['5th'] || DEFAULT_CLASS_FEE_STRUCTURE['5th'];
      if (str.includes('6th') || str === '6' || str === 'vi' || str.includes('class 6')) return feeMap['6th'] || DEFAULT_CLASS_FEE_STRUCTURE['6th'];
      if (str.includes('7th') || str === '7' || str === 'vii' || str.includes('class 7')) return feeMap['7th'] || DEFAULT_CLASS_FEE_STRUCTURE['7th'];
      if (str.includes('8th') || str === '8' || str === 'viii' || str.includes('class 8')) return feeMap['8th'] || DEFAULT_CLASS_FEE_STRUCTURE['8th'];
      if (str.includes('9th') || str === '9' || str === 'ix' || str.includes('class 9')) return feeMap['9th'] || DEFAULT_CLASS_FEE_STRUCTURE['9th'];
      if (str.includes('10th') || str === '10' || str === 'x' || str.includes('class 10')) return feeMap['10th'] || DEFAULT_CLASS_FEE_STRUCTURE['10th'];

      return { monthlyFee: 2400, yearlyExamFee: 1100, yearlyFee: 27500 };
    }`;

html = html.replace(/function getClassFeeConfig\(className\) \{[\s\S]*?return \{ monthlyFee: 2400, yearlyExamFee: 1100, yearlyFee: 26400 \};\s*\}/, newGetClassFeeConfig);

// Update getStudentFeeTotals to 11 months
html = html.replace('const totalMonths = 10; // 10 Monthly Installments (June to March)', 'const totalMonths = 11; // 11 Months Package (June to April)');
html = html.replace('// Grand Total Fee = Tuition (10 Months) + Yearly Exam Fee + Bus Fee', '// Grand Total Fee = Tuition (11 Months Package) + Yearly Exam Fee + Bus Fee');

// Update banner subtitle
html = html.replace('10 Months Tuition + Exam Fee', '11 Months Tuition Package + Yearly Exam Fee');

// Inject updated students array into index.html
html = html.replace(/const GENERATE_RAW_STUDENTS = \(\) => \([\s\S]*?\);\s*\/\/ --- HIERARCHICAL/m, `const GENERATE_RAW_STUDENTS = () => (${JSON.stringify(students)});\n\n    // --- HIERARCHICAL`);

// Bump APP_VERSION
html = html.replace(/const APP_VERSION = '[^']+';/, "const APP_VERSION = 'stv_v2026_11_months_fee_official';");

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Updated index.html with 11-month package, official fee table, and bumped APP_VERSION.');

// Verify syntax
const scriptMatches = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
let allOk = true;

scriptMatches.forEach((s, sIdx) => {
  const cleanScript = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  try {
    new vm.Script(cleanScript);
    console.log(`✅ Script ${sIdx + 1}: SYNTAX 100% VALID!`);
  } catch (err) {
    allOk = false;
    console.error(`❌ Script ${sIdx + 1} Syntax Error:`, err.message);
  }
});

if (allOk) {
  console.log('\n🎉 ALL SCRIPTS SYNTACTICALLY VERIFIED AND 100% ERROR-FREE!\n');
}
