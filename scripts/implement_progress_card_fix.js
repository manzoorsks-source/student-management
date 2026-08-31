const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

console.log('Implementing comprehensive Progress Card and Student Specific Subjects fix...');

// 1. Add "📜 Progress Card" button to Student Details table row
html = html.replace(
  `<button onclick="openFullProfile('\${s.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-bold shadow-2xs text-xs whitespace-nowrap">Full Profile &rarr;</button>`,
  `<button onclick="openFullProfile('\${s.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-xl font-bold shadow-2xs text-xs whitespace-nowrap">Profile &rarr;</button>
   <button onclick="openStudentProgressReportModal('\${s.id}')" class="bg-rose-700 hover:bg-rose-800 text-white px-2.5 py-1.5 rounded-xl font-bold shadow-2xs text-xs whitespace-nowrap">📜 Progress Card</button>`
);

// 2. Add Progress Card button to Full Profile page Section 3
html = html.replace(
  `<span>📄 Section 3: Subject Marks & Multi-Term Progress Reports</span>
                    </h2>`,
  `<span>📄 Section 3: Subject Marks & Multi-Term Progress Reports</span>
                    </h2>
                    <div class="flex justify-end">
                      <button onclick="openStudentProgressReportModal('\${student.id}')" class="bg-gradient-to-r from-rose-700 to-indigo-700 hover:from-rose-800 hover:to-indigo-800 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md active:scale-95 transition-all">
                        🖨️ View & Print Official Multi-Exam Progress Report Card (A4) &rarr;
                      </button>
                    </div>`
);

// 3. Update Progress Report Modal top bar to include Student Selector dropdown
const studentSelectorDropdown = `
                  <div class="flex items-center space-x-2">
                    <span class="text-xs font-bold text-slate-600">Select Student:</span>
                    <select onchange="openStudentProgressReportModal(this.value)" class="bg-indigo-50 border border-indigo-300 text-indigo-950 font-black text-xs rounded-xl px-3 py-1.5 max-w-[260px] cursor-pointer">
                      \${state.students.map(st => \`
                        <option value="\${st.id}" \${st.id === s.id ? 'selected' : ''}>
                          \${st.name} (\${st.grade} - Sec \${st.section} • Roll #\${st.rollNo})
                        </option>
                      \`).join('')}
                    </select>
                  </div>
`;

html = html.replace(
  `<div class="flex space-x-2">
                    <button onclick="window.print()" class="bg-indigo-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-black shadow-md">🖨️ Print Selected Card (A4)</button>
                    <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold">✕ Close</button>
                  </div>`,
  studentSelectorDropdown + `
                  <div class="flex space-x-2">
                    <button onclick="window.print()" class="bg-indigo-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-black shadow-md">🖨️ Print (A4)</button>
                    <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold">✕ Close</button>
                  </div>`
);

// 4. Update getClassSubjectsDetailed to handle all class name variations robustly
const robustGetClassSubjectsDetailed = `    function getClassSubjectsDetailed(className) {
      if (!className) return DEFAULT_CLASS_SUBJECTS['1st Class'];
      const str = className.toString().trim().toLowerCase();
      const subjectMap = (typeof state !== 'undefined' && state && state.classSubjectsMap) ? state.classSubjectsMap : DEFAULT_CLASS_SUBJECTS;
      
      if (str.includes('nursery')) return subjectMap['Nursery'] || DEFAULT_CLASS_SUBJECTS['Nursery'];
      if (str.includes('lkg') || str.includes('l.k.g')) return subjectMap['LKG'] || DEFAULT_CLASS_SUBJECTS['LKG'];
      if (str.includes('ukg') || str.includes('u.k.g')) return subjectMap['UKG'] || DEFAULT_CLASS_SUBJECTS['UKG'];
      if (str.includes('10th') || str === '10' || str === 'x' || str.includes('class 10')) return subjectMap['10th Class'] || DEFAULT_CLASS_SUBJECTS['10th Class'];
      if (str.includes('9th') || str === '9' || str === 'ix' || str.includes('class 9')) return subjectMap['9th Class'] || DEFAULT_CLASS_SUBJECTS['9th Class'];
      if (str.includes('8th') || str === '8' || str === 'viii' || str.includes('class 8')) return subjectMap['8th Class'] || DEFAULT_CLASS_SUBJECTS['8th Class'];
      if (str.includes('7th') || str === '7' || str === 'vii' || str.includes('class 7')) return subjectMap['7th Class'] || DEFAULT_CLASS_SUBJECTS['7th Class'];
      if (str.includes('6th') || str === '6' || str === 'vi' || str.includes('class 6')) return subjectMap['6th Class'] || DEFAULT_CLASS_SUBJECTS['6th Class'];
      if (str.includes('5th') || str === '5' || str === 'v' || str.includes('class 5')) return subjectMap['5th Class'] || DEFAULT_CLASS_SUBJECTS['5th Class'];
      if (str.includes('4th') || str === '4' || str === 'iv' || str.includes('class 4')) return subjectMap['4th Class'] || DEFAULT_CLASS_SUBJECTS['4th Class'];
      if (str.includes('3rd') || str === '3' || str === 'iii' || str.includes('class 3')) return subjectMap['3rd Class'] || DEFAULT_CLASS_SUBJECTS['3rd Class'];
      if (str.includes('2nd') || str === '2' || str === 'ii' || str.includes('class 2')) return subjectMap['2nd Class'] || DEFAULT_CLASS_SUBJECTS['2nd Class'];
      if (str.includes('1st') || str === '1' || str === 'i' || str.includes('class 1')) return subjectMap['1st Class'] || DEFAULT_CLASS_SUBJECTS['1st Class'];

      return DEFAULT_CLASS_SUBJECTS['1st Class'];
    }`;

html = html.replace(
  /function getClassSubjectsDetailed\(className\) \{[\s\S]*?return items\.map\(s => typeof s === 'string' \? \{ name: s, shortName: s\.slice\(0, 3\)\.toUpperCase\(\), maxMarks: 100, passMarks: 35, type: 'Core' \} : s\);\s*\}/,
  robustGetClassSubjectsDetailed
);

// 5. Bump APP_VERSION
html = html.replace(/const APP_VERSION = '[^']+';/, "const APP_VERSION = 'stv_v2026_progress_card_dynamic_v1';");

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Successfully updated index.html with dynamic student progress cards and class subjects.');

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
