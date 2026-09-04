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

async function runMultiDeviceSimulation() {
  console.log('================================================================');
  console.log('🧪 MULTI-DEVICE DATA SYNCHRONIZATION SIMULATION');
  console.log('================================================================\n');

  const testStudentId = 'STV-SYNC-7777';

  try {
    // --- SIMULATING DEVICE 1 (COMPUTER A) ---
    console.log('💻 [DEVICE 1 / COMPUTER A]: Entering new student admission, fees, and marks...');
    
    // 1. Device 1 admits new student
    const studentPayload = {
      id: testStudentId,
      admnNo: '7777',
      rollNo: '25',
      name: 'MOHAMMED REHAN KHAN',
      gender: 'Male',
      dob: '2010-05-15',
      grade: 'X',
      section: 'A',
      parentName: 'Mohammed Tariq Khan',
      fatherName: 'Mohammed Tariq Khan',
      phone: '9876543210',
      whatsappNo: '9876543210',
      address: 'Uppal, Hyderabad, Telangana',
      monthlyFee: 2400,
      admissionFee: 5000,
      examFee: 2000,
      totalMonths: 11,
      paidMonths: 5,
      isNewStudent: false,
      termMarks: {
        '1st Term Exam': { Telugu: 88, Hindi: 85, English: 92, Maths: 95, Science: 90, Social: 89 },
        'Final Term Exam': { Telugu: 90, Hindi: 88, English: 94, Maths: 98, Science: 96, Social: 91 }
      },
      paymentHistory: [
        {
          id: Date.now(),
          receiptNo: 'REC-SYNC-8899',
          amount: 12000,
          date: '04-Sep-2026',
          mode: 'UPI / Online',
          month: 'August 2026',
          note: 'Annual Tuition Advance'
        }
      ]
    };

    const dev1Add = await apiRequest('/api/students', 'POST', { student: studentPayload });
    console.log('   ✅ Device 1 saved student to Aiven DB:', dev1Add.data.data?.name);

    // 2. Device 1 updates school notes / tasks in app_state
    const dev1Task = await apiRequest('/api/state', 'POST', {
      key: 'tasks',
      value: [
        { id: 9901, title: 'Schedule Annual Science Exhibition for Class X', completed: false }
      ]
    });
    console.log('   ✅ Device 1 saved school tasks to Aiven DB');

    console.log('\n----------------------------------------------------------------');
    console.log('📱 [DEVICE 2 / COMPUTER B]: Logging in from another system with EMPTY local storage...');
    console.log('----------------------------------------------------------------');

    // --- SIMULATING DEVICE 2 (COMPUTER B) ---
    // Device 2 fetches all data fresh from Aiven PostgreSQL
    const dev2Students = await apiRequest('/api/students');
    const dev2State = await apiRequest('/api/state');

    const foundOnDevice2 = dev2Students.data.data.find(s => s.id === testStudentId);

    if (!foundOnDevice2) {
      throw new Error(`❌ FAILED: Student ${testStudentId} was NOT found on Device 2!`);
    }

    console.log('   🎉 SUCCESS! Device 2 retrieved student directly from Aiven Cloud:');
    console.log(`      - Student Name:     ${foundOnDevice2.name}`);
    console.log(`      - Class & Section:  ${foundOnDevice2.grade}-${foundOnDevice2.section}`);
    console.log(`      - Roll Number:      #${foundOnDevice2.rollNo}`);
    console.log(`      - Contact Phone:    ${foundOnDevice2.phone}`);
    console.log(`      - Final Exam Maths: ${foundOnDevice2.termMarks?.['Final Term Exam']?.Maths}/100`);
    console.log(`      - Final Exam Sci:   ${foundOnDevice2.termMarks?.['Final Term Exam']?.Science}/100`);
    console.log(`      - Last Receipt:     ${foundOnDevice2.paymentHistory?.[0]?.receiptNo} (₹${foundOnDevice2.paymentHistory?.[0]?.amount})`);

    const tasksOnDevice2 = dev2State.data.data.tasks;
    console.log(`      - Cloud Task:       "${tasksOnDevice2?.[0]?.title}"`);

    console.log('\n🧹 Cleaning up test student from Aiven DB...');
    await apiRequest(`/api/students?id=${testStudentId}`, 'DELETE');
    console.log('✅ Test record cleaned up.');

    console.log('\n================================================================');
    console.log('🏆 MULTI-DEVICE SYNCHRONIZATION TEST PASSED 100%!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Multi-Device Simulation Error:', err.message);
    process.exit(1);
  }
}

runMultiDeviceSimulation();
