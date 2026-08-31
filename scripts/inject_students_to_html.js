const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const jsonPath = path.join(__dirname, '..', 'data_import', 'all_students.json');

const students = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
let html = fs.readFileSync(htmlPath, 'utf-8');

console.log(`Injecting ${students.length} clean students (0 initial payments) into index.html...`);

// Replace existing GENERATE_RAW_STUDENTS declaration
html = html.replace(/const GENERATE_RAW_STUDENTS = \(\) => \([\s\S]*?\);\s*\/\/ --- HIERARCHICAL/m, `const GENERATE_RAW_STUDENTS = () => (${JSON.stringify(students)});\n\n    // --- HIERARCHICAL`);

// If not matched, try direct replacement
if (!html.includes('stv_v2026_clean_zero_payments_789')) {
  html = html.replace(/const APP_VERSION = '[^']+';/, "const APP_VERSION = 'stv_v2026_clean_zero_payments_789';");
}

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Successfully injected clean students into index.html and set APP_VERSION to stv_v2026_clean_zero_payments_789!');
