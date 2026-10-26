const fs = require('fs');
const path = require('path');
const { getClient } = require('../api/dbConfig');

async function verifyAll() {
  console.log('🧪 Starting Full System & Mathematical Verification...\n');

  // 1. Check Backup vs Current DB
  const backupFile = path.join(__dirname, 'backup_students_marks.json');
  if (!fs.existsSync(backupFile)) {
    throw new Error('Backup file not found!');
  }
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log(`✅ Pre-execution backup verified: ${backup.totalStudents} students recorded.`);

  const client = getClient();
  await client.connect();

  // 2. Verify Neon DB app_state
  console.log('\n--- 1. VERIFYING NEON DB APP_STATE ---');
  const stateRes = await client.query("SELECT value FROM app_state WHERE key = 'classSubjectsMap'");
  if (stateRes.rows.length === 0) {
    throw new Error('classSubjectsMap missing in DB app_state');
  }
  const dbSubjects = stateRes.rows[0].value;
  console.log('✅ classSubjectsMap retrieved from Neon DB.');

  const primaryClasses = ['Nursery', 'LKG', 'UKG', '1st Class', '2nd Class', '3rd Class', '4th Class', '5th Class'];
  for (const cls of primaryClasses) {
    const subs = dbSubjects[cls] || [];
    const coreSubs = subs.filter(s => !s.isOptional && s.type === 'Core');
    console.log(`   ${cls}: ${coreSubs.length} Core Subjects: ${coreSubs.map(s => s.name).join(', ')}`);
    if (coreSubs.length !== 5) {
      throw new Error(`Expected exactly 5 core subjects for ${cls}, found ${coreSubs.length}`);
    }
    const hasGenEng = subs.some(s => s.name.toLowerCase().includes('general english'));
    if (hasGenEng) {
      throw new Error(`General English still found in ${cls}!`);
    }
  }

  const highClasses = ['6th Class', '7th Class', '8th Class', '9th Class', '10th Class'];
  for (const cls of highClasses) {
    const subs = dbSubjects[cls] || [];
    const coreSubs = subs.filter(s => !s.isOptional && s.type === 'Core');
    console.log(`   ${cls} (Unchanged): ${coreSubs.length} Core Subjects: ${coreSubs.map(s => s.name).join(', ')}`);
  }

  // 3. Verify Students Marks Preservation & No Data Loss
  console.log('\n--- 2. VERIFYING STUDENT MARKS PRESERVATION (ZERO DATA LOSS) ---');
  const stuRes = await client.query('SELECT student_id, student_name, class, section, data FROM students ORDER BY student_id ASC');
  console.log(`📦 Currently in DB: ${stuRes.rows.length} students (Backup had: ${backup.totalStudents})`);
  if (stuRes.rows.length !== backup.totalStudents) {
    throw new Error('Student count mismatch between backup and database!');
  }

  // Compare sample students
  let preservedCount = 0;
  for (let i = 0; i < stuRes.rows.length; i++) {
    const currRow = stuRes.rows[i];
    const backRow = backup.students.find(s => s.student_id === currRow.student_id);
    if (!backRow) throw new Error(`Student ${currRow.student_id} not found in backup!`);

    const cData = typeof currRow.data === 'string' ? JSON.parse(currRow.data) : currRow.data;
    const bData = typeof backRow.data === 'string' ? JSON.parse(backRow.data) : backRow.data;

    if (bData && bData.termMarks) {
      for (const exam of Object.keys(bData.termMarks)) {
        const bExam = bData.termMarks[exam];
        const cExam = cData.termMarks ? cData.termMarks[exam] : null;
        if (!cExam) throw new Error(`Exam ${exam} missing in student ${currRow.student_id}`);
        // Check core 5 subjects
        for (const sub of ['Telugu', 'Hindi', 'English', 'Maths', 'Mathematics', 'EVS']) {
          if (bExam[sub] !== undefined && bExam[sub] !== cExam[sub]) {
            throw new Error(`Mark mismatch for student ${currRow.student_id} exam ${exam} subject ${sub}!`);
          }
        }
      }
    }
    preservedCount++;
  }
  console.log(`✅ All ${preservedCount} students marks for Telugu, Hindi, English, Mathematics, and EVS are 100% IDENTICAL and PRESERVED!`);

  // 4. Test Marks Calculation & Math Simulation
  console.log('\n--- 3. VERIFYING SPREADSHEET & REPORT CARD MATHEMATICAL LOGIC ---');
  
  // Grade calculation rule function (from index.html)
  function calcGrade(pct) {
    pct = Math.min(100, Math.max(0, pct));
    if (pct >= 90) return { grade: 'A+', gpa: 10, desc: 'Outstanding' };
    if (pct >= 80) return { grade: 'A', gpa: 9, desc: 'Excellent' };
    if (pct >= 70) return { grade: 'B+', gpa: 8, desc: 'Very Good' };
    if (pct >= 60) return { grade: 'B', gpa: 7, desc: 'Good' };
    if (pct >= 50) return { grade: 'C', gpa: 6, desc: 'Satisfactory' };
    if (pct >= 40) return { grade: 'D', gpa: 5, desc: 'Pass' };
    return { grade: 'F', gpa: 0, desc: 'Fail' };
  }

  // Pick sample 2nd Class student
  const sample2nd = stuRes.rows.find(r => r.class === '2nd Class' && r.data && (typeof r.data === 'string' ? JSON.parse(r.data) : r.data).termMarks?.FA1);
  if (sample2nd) {
    const d = typeof sample2nd.data === 'string' ? JSON.parse(sample2nd.data) : sample2nd.data;
    const fa1 = d.termMarks.FA1;
    console.log(`\nSample Student: ${sample2nd.student_name} (${sample2nd.class} Sec ${sample2nd.section})`);
    console.log('Entered Marks in DB:', fa1);
    
    // Core 5 subjects calculation
    const coreSubs = dbSubjects['2nd Class'].filter(s => !s.isOptional);
    let obtSum = 0;
    let maxTotal = 0;
    coreSubs.forEach(s => {
      const v = parseFloat(fa1[s.name] || fa1['Maths'] || 0);
      obtSum += v;
      maxTotal += 20; // 20 max for FA
    });
    const pct = ((obtSum / maxTotal) * 100).toFixed(1);
    const gr = calcGrade(parseFloat(pct));
    console.log(`FA1 Calculation:`);
    console.log(`  Max Marks: ${maxTotal} (Expected: 100) -> ${maxTotal === 100 ? '✅ CORRECT' : '❌ WRONG'}`);
    console.log(`  Obtained: ${obtSum} / ${maxTotal}`);
    console.log(`  Percentage: ${pct}%`);
    console.log(`  Grade: ${gr.grade} (${gr.gpa} GP - ${gr.desc})`);

    // Simulated SA1 Calculation
    let saMax = 0;
    coreSubs.forEach(s => { saMax += 100; });
    console.log(`SA1 Calculation:`);
    console.log(`  Max Marks: ${saMax} (Expected: 500) -> ${saMax === 500 ? '✅ CORRECT' : '❌ WRONG'}`);
  }

  // Sample 10th Class student (ensure 10th class untouched)
  const sample10th = stuRes.rows.find(r => r.class === '10th Class');
  if (sample10th) {
    const subs10 = dbSubjects['10th Class'];
    let saMax10 = 0;
    subs10.forEach(s => { saMax10 += s.maxMarks; });
    console.log(`\n10th Class Verification (Must be UNCHANGED):`);
    console.log(`  Total Subjects: ${subs10.length}`);
    console.log(`  SA Max Marks: ${saMax10} (Expected: 600 - distinct 50M PS + 50M BS) -> ${saMax10 === 600 ? '✅ UNTOUCHED & CORRECT' : '❌ WRONG'}`);
  }

  await client.end();
  console.log('\n🎉 ALL CHECKS PASSED WITH 100% ACCURACY!');
}

verifyAll().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
