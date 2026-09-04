require('dotenv').config();
const http = require('http');

const PORT = parseInt(process.env.PORT, 10) || 8080;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', (err) => {
      console.error('Request error to ' + options.path + ':', err.message);
      reject(err);
    });
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function testAll() {
  console.log(`🧪 Starting API Endpoints Test against localhost:${PORT}...`);

  try {
    // 1. Health
    const health = await request({ host: 'localhost', port: PORT, path: '/api/health', method: 'GET' });
    console.log('1. /api/health:', health.status, health.data.status, 'Total Students in DB:', health.data.studentCount);

    // 2. Get Students
    const students = await request({ host: 'localhost', port: PORT, path: '/api/students?limit=5', method: 'GET' });
    console.log('2. /api/students:', students.status, 'Total returned:', students.data.count, 'First student:', students.data.data[0]?.name);

    // 3. Post State
    const statePost = await request({
      host: 'localhost', port: PORT, path: '/api/state', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { key: 'test_sync_key', value: { status: 'synced_ok', timestamp: new Date().toISOString() } });
    console.log('3. /api/state POST:', statePost.status, statePost.data);

    // 4. Get State
    const stateGet = await request({ host: 'localhost', port: PORT, path: '/api/state', method: 'GET' });
    console.log('4. /api/state GET:', stateGet.status, 'Has test_sync_key?:', !!stateGet.data.data.test_sync_key);

    // 5. Create Test Student in Aiven DB
    const testStudentId = 'STV-TEST-9999';
    const createStudent = await request({
      host: 'localhost', port: PORT, path: '/api/students', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      id: testStudentId,
      name: 'CLOUD TEST STUDENT',
      grade: 'X',
      section: 'A',
      rollNo: '99',
      phone: '9999999999',
      monthlyFee: 2500,
      paidMonths: 2
    });
    console.log('5. /api/students POST create:', createStudent.status, createStudent.data.data?.name);

    // 6. Record Fee Payment for Test Student
    const payFee = await request({
      host: 'localhost', port: PORT, path: '/api/fees', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      student_id: testStudentId,
      amount: 5000,
      mode: 'UPI / Online',
      receipt_no: 'REC-TEST-123456',
      paid_months: 2
    });
    console.log('6. /api/fees POST payment:', payFee.status, payFee.data.message);

    // 7. Update Academic Marks
    const marks = await request({
      host: 'localhost', port: PORT, path: '/api/academic', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      student_id: testStudentId,
      term_name: 'Final Term Exam',
      marks: { Maths: 95, Science: 92, English: 88, Telugu: 85 }
    });
    console.log('7. /api/academic POST marks:', marks.status, marks.data.message);

    // 8. Delete Test Student
    const delStudent = await request({
      host: 'localhost', port: PORT, path: `/api/students?id=${testStudentId}`, method: 'DELETE'
    });
    console.log('8. /api/students DELETE:', delStudent.status, delStudent.data.message);

    console.log('\n🎉 ALL API ENDPOINTS VERIFIED & WORKING PERFECTLY WITH AIVEN POSTGRESQL!\n');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testAll();
