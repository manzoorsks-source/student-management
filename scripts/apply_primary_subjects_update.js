const fs = require('fs');
const path = require('path');
const { getClient } = require('../api/dbConfig');
const vm = require('vm');

const NEW_CLASS_SUBJECTS = {
  'Nursery': [
    { name: 'English (Oral)', shortName: 'ENG(O)', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English (writing)', shortName: 'ENG(W)', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Number Work', shortName: 'NUM', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Rhymes', shortName: 'RHY', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Social / G K', shortName: 'SOC/GK', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity', isOptional: true }
  ],
  'LKG': [
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Rhymes (Oral)', shortName: 'RHY', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity', isOptional: true }
  ],
  'UKG': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Drawing', shortName: 'DRW', maxMarks: 100, passMarks: 35, type: 'Activity', isOptional: true }
  ],
  '1st Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' }
  ],
  '2nd Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' }
  ],
  '3rd Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' }
  ],
  '4th Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' }
  ],
  '5th Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'EVS', shortName: 'EVS', maxMarks: 100, passMarks: 35, type: 'Core' }
  ],
  '6th Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Science', shortName: 'SCI', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' }
  ],
  '7th Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Science', shortName: 'SCI', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' }
  ],
  '8th Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Science', shortName: 'SCI', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' }
  ],
  '9th Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Bio science', shortName: 'B.S', maxMarks: 50, passMarks: 18, type: 'Core' },
    { name: 'physical science', shortName: 'P.S', maxMarks: 50, passMarks: 18, type: 'Core' },
    { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' }
  ],
  '10th Class': [
    { name: 'Telugu', shortName: 'TEL', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Hindi', shortName: 'HIN', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'English', shortName: 'ENG', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Mathematics', shortName: 'MAT', maxMarks: 100, passMarks: 35, type: 'Core' },
    { name: 'Bio science', shortName: 'B.S', maxMarks: 50, passMarks: 18, type: 'Core' },
    { name: 'physical science', shortName: 'P.S', maxMarks: 50, passMarks: 18, type: 'Core' },
    { name: 'Social', shortName: 'SOC', maxMarks: 100, passMarks: 35, type: 'Core' }
  ]
};

async function applyChanges() {
  console.log('🚀 Starting Application of Primary Subjects Update (5 Subjects, General English Removed)...');

  // 1. Update Neon PostgreSQL Database app_state
  console.log('📡 Updating Neon DB app_state (classSubjectsMap)...');
  const client = getClient();
  await client.connect();

  await client.query(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = CURRENT_TIMESTAMP
  `, ['classSubjectsMap', JSON.stringify(NEW_CLASS_SUBJECTS)]);

  console.log('✅ Neon DB app_state key "classSubjectsMap" updated successfully!');
  await client.end();

  // 2. Update index.html
  console.log('📝 Updating index.html with new DEFAULT_CLASS_SUBJECTS & cache-busting keys...');
  const htmlPath = path.join(__dirname, '..', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf-8');

  // Replace DEFAULT_CLASS_SUBJECTS block
  const subjectsString = '    const DEFAULT_CLASS_SUBJECTS = ' + JSON.stringify(NEW_CLASS_SUBJECTS, null, 6) + ';';
  
  const subjectsRegex = /const DEFAULT_CLASS_SUBJECTS = \{[\s\S]*?\n    \};/;
  if (!subjectsRegex.test(html)) {
    throw new Error('Could not find const DEFAULT_CLASS_SUBJECTS in index.html');
  }
  html = html.replace(subjectsRegex, subjectsString.trim());

  // Bump cache keys in index.html to bust old local storage in users' browsers
  html = html.replace(/stv_class_subjects_v105/g, 'stv_class_subjects_v106');
  html = html.replace(/const APP_VERSION = '[^']+';/, "const APP_VERSION = 'stv_v2026_primary_5subjects_exact_v2';");

  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log('✅ index.html updated successfully with new 5-subject schema!');

  // 3. Syntax Verification
  console.log('🔍 Verifying index.html script syntax...');
  const scriptMatches = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
  let allOk = true;

  scriptMatches.forEach((s, sIdx) => {
    const cleanScript = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    try {
      new vm.Script(cleanScript);
    } catch (err) {
      allOk = false;
      console.error(`❌ Script ${sIdx + 1} Syntax Error:`, err.message);
    }
  });

  if (allOk) {
    console.log('🎉 index.html JavaScript syntax is 100% VALID and ERROR-FREE!');
  } else {
    throw new Error('Syntax error detected in index.html scripts');
  }
}

applyChanges().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
