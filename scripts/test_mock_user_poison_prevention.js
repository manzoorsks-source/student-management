const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function testPoisonPrevention() {
  console.log('================================================================');
  console.log('🧪 TESTING POISON PREVENTION & MOCK USER SANITIZATION');
  console.log('================================================================\n');

  // Simulate an old client sending the 5 legacy mock users
  const legacyPayload = [
    {
      role: 'super_admin',
      email: 'correspondent@stvenushighschool.edu.in',
      empId: 'EMP-001',
      mobile: '+91 9121833702',
      status: 'Active',
      timing: '8:30 AM – 4:30 PM',
      fullName: 'Shaik Madar (Admin / Correspondent)',
      password: 'Shaik@786',
      username: 'shaikmadar786'
    },
    {
      role: 'principal',
      fullName: 'Dr. S. K. Rao',
      username: 'principal',
      empId: 'EMP-002'
    },
    {
      role: 'admin',
      fullName: 'Mrs. P. Swathi',
      username: 'admin',
      empId: 'EMP-003'
    },
    {
      role: 'accountant',
      fullName: 'Mr. R. K. Sharma',
      username: 'sharma',
      empId: 'EMP-004'
    },
    {
      role: 'super_admin',
      fullName: 'test',
      username: 'testing',
      empId: 'EMP-005'
    }
  ];

  console.log('[STEP 1] Simulating malicious/cached client attempting to POST legacy mock users to /api/state...');
  const postRes = await request({
    host: 'localhost',
    port: 8080,
    path: '/api/state',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { key: 'users', value: legacyPayload });

  console.log('Server response:', postRes.data);

  console.log('\n[STEP 2] Fetching database state to verify backend sanitization...');
  const getRes = await request({ host: 'localhost', port: 8080, path: '/api/state', method: 'GET' });
  const users = getRes.data.data.users || [];

  console.log(`Database returned ${users.length} users:`);
  users.forEach((u, i) => {
    console.log(`  ${i+1}. [${u.role}] ${u.fullName} (@${u.username}) | EMP-ID: ${u.empId}`);
  });

  const hasMock = users.some(u => 
    u.username === 'testing' || 
    u.username === 'sharma' || 
    u.fullName === 'Dr. S. K. Rao' || 
    u.fullName === 'Mrs. P. Swathi' || 
    u.fullName === 'Mr. R. K. Sharma' || 
    u.fullName === 'test'
  );

  if (hasMock) {
    throw new Error('FAIL: Backend allowed mock users to be saved!');
  }

  if (users.length !== 3) {
    throw new Error(`FAIL: Expected exactly 3 users, but got ${users.length}!`);
  }

  console.log('\n✅ SUCCESS: Server-side and client-side sanitization rejected mock users completely!');
  console.log('✅ Exactly 3 clean users are maintained in central Aiven database!');
  console.log('================================================================');
}

testPoisonPrevention().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
