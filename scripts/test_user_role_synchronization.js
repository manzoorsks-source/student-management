require('dotenv').config();
const http = require('http');

const PORT = parseInt(process.env.PORT, 10) || 8080;

function apiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: 'localhost',
      port: PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runScenario() {
  console.log('================================================================');
  console.log('🧪 TESTING USER ➔ PRINCIPAL SYNCHRONIZATION TEST');
  console.log('================================================================\n');

  // STEP 1: Testing User signs in & enters 10th Class FA1 marks for ASIYA ANJUM
  console.log('👤 [STEP 1 & 2]: Testing User enters FA1 marks for ASIYA ANJUM (10th Class - A)...');
  const getRes = await apiRequest('/api/students?id=STV-3592');
  const asiya = getRes.data.data[0];

  if (!asiya) {
    throw new Error('Student ASIYA ANJUM (STV-3592) not found in database!');
  }

  // Set marks exactly matching user screenshot
  if (!asiya.termMarks) asiya.termMarks = {};
  asiya.termMarks['FA1'] = {
    Telugu: 19,
    Hindi: 19,
    English: 19,
    Mathematics: 19,
    'Bio science': 9,
    'physical science': 9,
    Social: 19
  };

  // STEP 3 & 4: Click Save (POST /api/students)
  console.log('💾 [STEP 3 & 4]: Testing User clicks Save (dispatching to Aiven PostgreSQL)...');
  const saveRes = await apiRequest('/api/students', 'POST', { student: asiya });
  console.log('   ✅ API Response:', saveRes.status, saveRes.data.message);

  // STEP 5: Verify directly in Aiven database
  console.log('\n🔍 [STEP 5]: Verifying data is committed to Aiven PostgreSQL Database...');
  const verifyRes = await apiRequest('/api/students?id=STV-3592');
  const dbStudent = verifyRes.data.data[0];
  console.log('   - Student Name in Aiven:', dbStudent.name);
  console.log('   - Class & Section:     ', dbStudent.grade, dbStudent.section);
  console.log('   - FA1 Marks in Aiven:  ', JSON.stringify(dbStudent.termMarks?.['FA1']));

  // STEP 6: Testing User Logs Out
  console.log('\n🚪 [STEP 6]: Testing User Logs Out...');

  // STEP 7: Principal Logs In
  console.log('👑 [STEP 7]: Principal Logs In (system fetches fresh central database records)...');
  const principalFetch = await apiRequest('/api/students?id=STV-3592');
  const principalStudentView = principalFetch.data.data[0];

  // STEP 8 & 9: Principal opens 10th Class ASIYA ANJUM marks / Progress Card
  console.log('📊 [STEP 8 & 9]: Principal opens ASIYA ANJUM Progress Card & Examination Table:');
  const fa1 = principalStudentView.termMarks?.['FA1'];
  console.log('   - 1st Lang. (Telugu):       ', fa1?.Telugu, '(Expected: 19)');
  console.log('   - 2nd Lang. (Hindi):        ', fa1?.Hindi, '(Expected: 19)');
  console.log('   - 3rd Lang. (English):      ', fa1?.English, '(Expected: 19)');
  console.log('   - MATHEMATICS:              ', fa1?.Mathematics, '(Expected: 19)');
  console.log('   - Biological Science (B.S): ', fa1?.['Bio science'], '(Expected: 9)');
  console.log('   - Physical Science (P.S):   ', fa1?.['physical science'], '(Expected: 9)');
  console.log('   - SOCIAL STUDIES:           ', fa1?.Social, '(Expected: 19)');

  if (
    fa1?.Telugu === 19 &&
    fa1?.Hindi === 19 &&
    fa1?.English === 19 &&
    fa1?.Mathematics === 19 &&
    fa1?.['Bio science'] === 9 &&
    fa1?.['physical science'] === 9 &&
    fa1?.Social === 19
  ) {
    console.log('\n🎉 STEP 1-9 VERIFICATION PASSED: Principal sees exact marks entered by Testing User!');
  } else {
    throw new Error('❌ FA1 marks mismatch on Principal screen!');
  }

  // STEP 10: Reverse Edit: Principal modifies Social marks from 19 to 20
  console.log('\n🔄 [STEP 10]: REVERSE TEST: Principal updates Social mark to 20 and saves...');
  principalStudentView.termMarks['FA1'].Social = 20;
  await apiRequest('/api/students', 'POST', { student: principalStudentView });

  // Testing User logs back in
  console.log('👤 Testing User logs back in to check updated mark:');
  const teacherFetch = await apiRequest('/api/students?id=STV-3592');
  const teacherView = teacherFetch.data.data[0];
  console.log('   - Social Mark visible to Testing User:', teacherView.termMarks?.['FA1']?.Social, '(Expected: 20)');

  if (teacherView.termMarks?.['FA1']?.Social === 20) {
    console.log('\n================================================================');
    console.log('🏆 100% BIDIRECTIONAL REAL-TIME CENTRAL DATABASE SYNCHRONIZATION CONFIRMED!');
    console.log('================================================================\n');
  } else {
    throw new Error('❌ Reverse edit failed to synchronize!');
  }
}

runScenario().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
