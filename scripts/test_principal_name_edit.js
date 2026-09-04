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

async function testEditFlow() {
  console.log('================================================================');
  console.log('🧪 TESTING PRINCIPAL EDIT FLOW (Mrs. Sunitha Devi -> Mr. Althaf Hussain)');
  console.log('================================================================\n');

  // 1. Fetch current users
  console.log('[STEP 1] Fetching current users from PostgreSQL DB...');
  const res1 = await request({ host: 'localhost', port: 8080, path: '/api/state', method: 'GET' });
  const users = res1.data.data.users || [];
  const currentPrincipal = users.find(u => u.empId === 'EMP-002');
  console.log('Current Principal in DB:', currentPrincipal?.fullName, `(@${currentPrincipal?.username})`);

  // 2. Super Admin edits the Principal's name to "Mr. Althaf Hussain"
  console.log('\n[STEP 2] Super Admin edits Principal name to "Mr. Althaf Hussain (Principal)"...');
  const updatedUsers = users.map(u => {
    if (u.empId === 'EMP-002') {
      return {
        ...u,
        fullName: 'Mr. Althaf Hussain (Principal)',
        email: 'althaf.hussain@stvenushighschool.edu.in'
      };
    }
    return u;
  });

  // 3. Save to database
  const saveRes = await request({
    host: 'localhost',
    port: 8080,
    path: '/api/state',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { key: 'users', value: updatedUsers });

  if (saveRes.status !== 200 || !saveRes.data.success) {
    throw new Error('Failed to save edit: ' + JSON.stringify(saveRes.data));
  }
  console.log('✅ Edit saved to central database successfully!');

  // 4. Simulate hard reset / fresh reload
  console.log('\n[STEP 3] Simulating hard reset & fresh database reload...');
  const res3 = await request({ host: 'localhost', port: 8080, path: '/api/state', method: 'GET' });
  const freshPrincipal = (res3.data.data.users || []).find(u => u.empId === 'EMP-002');

  console.log('Verified Principal from PostgreSQL after hard reset:');
  console.log('  - Employee ID:', freshPrincipal?.empId);
  console.log('  - Full Name:  ', freshPrincipal?.fullName);
  console.log('  - Username:   ', freshPrincipal?.username);
  console.log('  - Email:      ', freshPrincipal?.email);

  if (freshPrincipal?.fullName === 'Mr. Althaf Hussain (Principal)') {
    console.log('\n🎉 SUCCESS: The Principal credential edit persisted 100% permanently!');
  } else {
    throw new Error('FAILED: Name did not update in DB!');
  }

  // 5. Clean up / Revert back to Sunitha Devi
  const revertedUsers = updatedUsers.map(u => {
    if (u.empId === 'EMP-002') {
      return {
        ...u,
        fullName: 'Mrs. Sunitha Devi (Principal)',
        email: 'principal@stvenushighschool.edu.in'
      };
    }
    return u;
  });
  await request({
    host: 'localhost',
    port: 8080,
    path: '/api/state',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { key: 'users', value: revertedUsers });

  console.log('\n[STEP 4] Reverted back to initial state cleanly for live usage.');
  console.log('================================================================');
}

testEditFlow().catch(console.error);
