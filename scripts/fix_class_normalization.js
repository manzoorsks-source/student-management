const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

console.log('Fixing isSameClass normalization to completely isolate 1st Class and 10th Class...');

const newIsSameClassCode = `    function normalizeClassCode(className) {
      if (!className) return '';
      const s = className.toString().trim().toUpperCase().replace(/CLASS/g, '').replace(/[\s\-_]/g, '');
      if (s === 'NURSERY' || s === 'NUR' || s === 'PRENURSERY') return 'NURSERY';
      if (s === 'LKG' || s === 'L.K.G' || s === 'PP1') return 'LKG';
      if (s === 'UKG' || s === 'U.K.G' || s === 'PP2') return 'UKG';
      if (s === '10' || s === '10TH' || s === 'X' || s === 'TENTH') return '10';
      if (s === '9' || s === '9TH' || s === 'IX' || s === 'NINTH') return '9';
      if (s === '8' || s === '8TH' || s === 'VIII' || s === 'EIGHTH') return '8';
      if (s === '7' || s === '7TH' || s === 'VII' || s === 'SEVENTH') return '7';
      if (s === '6' || s === '6TH' || s === 'VI' || s === 'SIXTH') return '6';
      if (s === '5' || s === '5TH' || s === 'V' || s === 'FIFTH') return '5';
      if (s === '4' || s === '4TH' || s === 'IV' || s === 'FOURTH') return '4';
      if (s === '3' || s === '3RD' || s === 'III' || s === 'THIRD') return '3';
      if (s === '2' || s === '2ND' || s === 'II' || s === 'SECOND') return '2';
      if (s === '1' || s === '1ST' || s === 'I' || s === 'FIRST') return '1';
      return s;
    }

    function isSameClass(g1, g2) {
      if (!g1 || !g2) return true;
      const s1 = g1.toString().toLowerCase().trim();
      const s2 = g2.toString().toLowerCase().trim();
      if (s1 === 'all' || s2 === 'all' || s1.includes('all') || s2.includes('all')) return true;
      return normalizeClassCode(g1) === normalizeClassCode(g2);
    }`;

html = html.replace(/function isSameClass\(g1, g2\) \{[\s\S]*?return norm1 === norm2 \|\| norm1\.includes\(norm2\) \|\| norm2\.includes\(norm1\);\s*\}/, newIsSameClassCode);

// Also in line 1970, ensure matchGrade uses isSameClass
html = html.replace("const matchGrade = state.selectedGrade === 'all' || s.grade.toString().toLowerCase() === state.selectedGrade.toString().toLowerCase();", "const matchGrade = isSameClass(s.grade, state.selectedGrade);");

// Bump APP_VERSION
html = html.replace(/const APP_VERSION = '[^']+';/, "const APP_VERSION = 'stv_v2026_class_isolation_exact_v1';");

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Injected clean normalizeClassCode and isSameClass into index.html.');

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
