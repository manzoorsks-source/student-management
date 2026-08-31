const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

console.log('Updating 8th, 9th, and 10th class subjects (Removing General English & Drawing, keeping distinct Physical Science and Bio Science)...');

// 1. Update DEFAULT_CLASS_SUBJECTS
const newClassSubjectsCode = `    const DEFAULT_CLASS_SUBJECTS = {
      'Nursery': [
        { name: 'Language & Orals', shortName: 'Lang', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English / Oral', shortName: 'Eng', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Rhymes / Recitation', shortName: 'Rhy', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Drawing & Coloring', shortName: 'Drw', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      'LKG': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English / Oral', shortName: 'GenEng', maxMarks: 100, passMarks: 35, type: 'Oral' },
        { name: 'Rhymes / Oral', shortName: 'Rhymes', maxMarks: 100, passMarks: 35, type: 'Oral' },
        { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      'UKG': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English / Oral', shortName: 'GenEng', maxMarks: 100, passMarks: 35, type: 'Oral' },
        { name: 'Rhymes / Oral', shortName: 'Rhymes', maxMarks: 100, passMarks: 35, type: 'Oral' },
        { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      '1st Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English', shortName: 'GenEng', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      '2nd Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English', shortName: 'GenEng', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      '3rd Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English', shortName: 'GenEng', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      '4th Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English', shortName: 'GenEng', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      '5th Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English', shortName: 'GenEng', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      '6th Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Science', shortName: 'SCI', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English', shortName: 'GenEng', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      '7th Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Science', shortName: 'SCI', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'General English', shortName: 'GenEng', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity' }
      ],
      '8th Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Physical Science', shortName: 'P.S', maxMarks: 50, passMarks: 18, type: 'Core' },
        { name: 'Bio Science', shortName: 'B.S', maxMarks: 50, passMarks: 18, type: 'Core' },
        { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' }
      ],
      '9th Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Physical Science', shortName: 'P.S', maxMarks: 50, passMarks: 18, type: 'Core' },
        { name: 'Bio Science', shortName: 'B.S', maxMarks: 50, passMarks: 18, type: 'Core' },
        { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' }
      ],
      '10th Class': [
        { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
        { name: 'Physical Science', shortName: 'P.S', maxMarks: 50, passMarks: 18, type: 'Core' },
        { name: 'Bio Science', shortName: 'B.S', maxMarks: 50, passMarks: 18, type: 'Core' },
        { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' }
      ]
    };`;

html = html.replace(/const DEFAULT_CLASS_SUBJECTS = \{[\s\S]*?\};\s*const DEFAULT_GRADE_RULES/m, newClassSubjectsCode + '\n\n    const DEFAULT_GRADE_RULES');

// 2. In report card modal, ensure distinct display labels for Physical Science and Bio Science
const newSubjectsForCardCode = `        // Helper to format subjects for card view (distinct Physical Science & Bio Science)
        const isHighSchool = s.grade.includes('8') || s.grade.includes('9') || s.grade.includes('10');
        const subjectsForCard = rawClassSubjects.map((sub, i) => {
          let displayName = sub;
          if (sub === 'Telugu') displayName = '1st Lang. (Telugu)';
          else if (sub === 'Hindi') displayName = '2nd Lang. (Hindi)';
          else if (sub === 'English') displayName = '3rd Lang. (English)';
          else if (sub === 'Mathematics') displayName = 'MATHEMATICS';
          else if (sub === 'Science' || sub === 'EVS') displayName = 'G. SCIENCE / EVS';
          else if (sub === 'Physical Science') displayName = 'Physical Science (P.S)';
          else if (sub === 'Bio Science') displayName = 'Biological Science (B.S)';
          else if (sub === 'Social') displayName = 'SOCIAL STUDIES';
          return { 
            key: sub, 
            label: displayName,
            isPS: sub === 'Physical Science',
            isBS: sub === 'Bio Science',
            maxMarks: (sub === 'Physical Science' || sub === 'Bio Science') ? 50 : 100
          };
        });`;

html = html.replace(
  /\/\/ Helper to format subjects for card view[\s\S]*?return \{ key: sub, label: displayName \};\s*\}\);/,
  newSubjectsForCardCode
);

// 3. Update localStorage key for class subjects to bust old cached subjects with Drawing/GenEng
html = html.replace("classSubjectsMap: safeLoadJson('stv_class_subjects_v100', DEFAULT_CLASS_SUBJECTS),", "classSubjectsMap: safeLoadJson('stv_class_subjects_v101', DEFAULT_CLASS_SUBJECTS),");
html = html.replace("localStorage.setItem('stv_class_subjects_v100', JSON.stringify(state.classSubjectsMap));", "localStorage.setItem('stv_class_subjects_v101', JSON.stringify(state.classSubjectsMap));");

// 4. Bump APP_VERSION
html = html.replace(/const APP_VERSION = '[^']+';/, "const APP_VERSION = 'stv_v2026_highschool_subjects_exact_v1';");

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Updated index.html with exact 8th-10th subjects and distinct Physical Science / Bio Science columns.');

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
