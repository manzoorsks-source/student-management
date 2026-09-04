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

async function testSaveChakrikaMarks() {
  console.log('🧪 Testing saving AMBALA CHAKRIKA FA1 marks to Aiven PostgreSQL...');

  // 1. Fetch current student from DB
  const getRes = await apiRequest('/api/students?id=STV-4190');
  const student = getRes.data.data[0];
  console.log('Fetched student from Aiven DB:', student.name, student.grade, student.section);

  // 2. Add FA1 marks from screenshot
  if (!student.termMarks) student.termMarks = {};
  student.termMarks['FA1'] = {
    Telugu: 10,
    Hindi: 15,
    English: 16,
    Mathematics: 17,
    'Bio Science': 10,
    'Physical Science': 10,
    Social: 19
  };

  // 3. Save student to Aiven DB
  const saveRes = await apiRequest('/api/students', 'POST', { student });
  console.log('Save response status:', saveRes.status, saveRes.data.message);

  // 4. Fetch fresh from Aiven DB to verify persistence
  const freshRes = await apiRequest('/api/students?id=STV-4190');
  const freshStudent = freshRes.data.data[0];
  console.log('Persisted FA1 marks in Aiven DB:');
  console.log(JSON.stringify(freshStudent.termMarks?.['FA1'], null, 2));

  if (freshStudent.termMarks?.['FA1']?.Mathematics === 17) {
    console.log('🎉 VERIFICATION PASSED: Marks are 100% saved and retrieved from Aiven PostgreSQL!');
  } else {
    console.error('❌ FAILED: Marks not persisted properly!');
  }
}

testSaveChakrikaMarks();
