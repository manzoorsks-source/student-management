const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const jsonPath = path.join(__dirname, '..', 'data_import', 'all_students.json');

const students = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
let html = fs.readFileSync(htmlPath, 'utf-8');

console.log(`Injecting ${students.length} students into index.html...`);

// Replace GENERATE_RAW_STUDENTS = () => [];
const targetDeclaration = 'const GENERATE_RAW_STUDENTS = () => [];';
const replacementDeclaration = `const GENERATE_RAW_STUDENTS = () => (${JSON.stringify(students)});`;

if (!html.includes(targetDeclaration)) {
  console.error('Could not find target declaration in index.html');
  process.exit(1);
}

html = html.replace(targetDeclaration, replacementDeclaration);

// Bump APP_VERSION
html = html.replace(/const APP_VERSION = '[^']+';/, "const APP_VERSION = 'stv_v2026_excel_full_roster_789';");

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Successfully updated index.html with all 789 students and bumped APP_VERSION!');
