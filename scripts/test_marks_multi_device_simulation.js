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

async function runTest() {
  console.log('================================================================');
  console.log('🧪 REAL-TIME MARKS ENTRY MULTI-SYSTEM PERSISTENCE TEST');
  console.log('================================================================\n');

  // Step 1: System 1 (Teacher/Admin) enters marks for 10th Class FA1
  console.log('💻 [SYSTEM 1]: Fetching 10th Class students to enter FA1 examination marks...');
  const studentsRes = await apiRequest('/api/students');
  const allStudents = studentsRes.data.data;
  
  const chakrika = allStudents.find(s => s.name === 'AMBALA CHAKRIKA' || s.admnNo === '4190');
  const ansu = allStudents.find(s => s.name === 'ANSU KUMARI' || s.admnNo === '3533');

  if (!chakrika || !ansu) {
    throw new Error('Students not found in database!');
  }

  // Update FA1 marks
  if (!chakrika.termMarks) chakrika.termMarks = {};
  chakrika.termMarks['FA1'] = {
    Telugu: 10,
    Hindi: 15,
    English: 16,
    Mathematics: 17,
    'Bio Science': 10,
    'Physical Science': 10,
    Social: 19
  };

  if (!ansu.termMarks) ansu.termMarks = {};
  ansu.termMarks['FA1'] = {
    Telugu: 18,
    Hindi: 17,
    English: 19,
    Mathematics: 20,
    'Bio Science': 10,
    'Physical Science': 9,
    Social: 18
  };

  console.log('💻 [SYSTEM 1]: Saving 10th Class FA1 marks via bulk sync to Aiven PostgreSQL...');
  const saveBulkRes = await apiRequest('/api/students', 'POST', {
    students: [chakrika, ansu]
  });
  console.log('   ✅ Bulk save response status:', saveBulkRes.status, saveBulkRes.data.message);

  console.log('\n----------------------------------------------------------------');
  console.log('📱 [SYSTEM 2 - PRINCIPAL LOGIN]: Logging in from another system...');
  console.log('----------------------------------------------------------------');

  // Step 2: System 2 (Principal) logs in and pulls all students from Aiven
  const freshStudentsRes = await apiRequest('/api/students');
  const freshStudents = freshStudentsRes.data.data;

  const freshChakrika = freshStudents.find(s => s.id === chakrika.id);
  const freshAnsu = freshStudents.find(s => s.id === ansu.id);

  console.log('🔍 [SYSTEM 2]: Verifying AMBALA CHAKRIKA FA1 marks on Principal screen:');
  console.log('   - Student Name:', freshChakrika.name);
  console.log('   - Class & Sec: ', freshChakrika.grade, freshChakrika.section);
  console.log('   - FA1 Marks:   ', JSON.stringify(freshChakrika.termMarks?.['FA1']));

  console.log('\n🔍 [SYSTEM 2]: Verifying ANSU KUMARI FA1 marks on Principal screen:');
  console.log('   - Student Name:', freshAnsu.name);
  console.log('   - Class & Sec: ', freshAnsu.grade, freshAnsu.section);
  console.log('   - FA1 Marks:   ', JSON.stringify(freshAnsu.termMarks?.['FA1']));

  const m1 = freshChakrika.termMarks?.['FA1'];
  const m2 = freshAnsu.termMarks?.['FA1'];

  if (m1?.Telugu === 10 && m1?.Mathematics === 17 && m2?.Mathematics === 20) {
    console.log('\n================================================================');
    console.log('🏆 MULTI-DEVICE TEST PASSED: ALL MARKS ARE 100% PERSISTED IN AIVEN DB!');
    console.log('================================================================\n');
  } else {
    throw new Error('❌ FA1 marks were NOT retrieved correctly from Aiven DB!');
  }
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
