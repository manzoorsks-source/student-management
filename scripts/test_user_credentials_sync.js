const http = require('http');
const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port || 8080,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  console.log('Testing /api/state user credentials persistence against Aiven DB...');
  
  // 1. Fetch current state
  const stateRes = await fetchJson('http://localhost:8080/api/state');
  if (!stateRes.data || !stateRes.data.success) {
    console.error('Failed to get state:', stateRes);
    process.exit(1);
  }
  
  const currentUsers = stateRes.data.data.users || [];
  console.log(`Current users count: ${currentUsers.length}`);
  
  // Find EMP-004 (sharma)
  const targetUser = currentUsers.find(u => u.empId === 'EMP-004');
  console.log('Target user before:', targetUser?.username, targetUser?.password);
  
  // Update target user
  const newUsername = 'sharma_updated';
  const newPassword = 'newSecretPassword2026!';
  const updatedUsers = currentUsers.map(u => {
    if (u.empId === 'EMP-004') {
      return {
        ...u,
        username: newUsername,
        password: newPassword,
        passwordHash: sha256(newPassword)
      };
    }
    return u;
  });
  
  // Save to Aiven DB
  const saveRes = await fetchJson('http://localhost:8080/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'users', value: updatedUsers })
  });
  console.log('Save response:', saveRes.data);
  
  // Re-fetch from Aiven DB
  const verifyRes = await fetchJson('http://localhost:8080/api/state');
  const verifiedUsers = verifyRes.data.data.users || [];
  const verifiedTarget = verifiedUsers.find(u => u.empId === 'EMP-004');
  console.log('Verified user after from Aiven DB:', verifiedTarget?.username, verifiedTarget?.password);
  
  if (verifiedTarget?.username === newUsername && verifiedTarget?.password === newPassword) {
    console.log('✅ User credentials successfully saved and persisted in Aiven PostgreSQL!');
  } else {
    console.error('❌ User credentials failed to persist!');
    process.exit(1);
  }
  
  // Revert back to original
  const revertedUsers = verifiedUsers.map(u => {
    if (u.empId === 'EMP-004') {
      return {
        ...u,
        username: 'sharma',
        password: 'sharma@2026',
        passwordHash: sha256('sharma@2026')
      };
    }
    return u;
  });
  await fetchJson('http://localhost:8080/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'users', value: revertedUsers })
  });
  console.log('✅ Reverted test credentials cleanly.');
}

run().catch(console.error);
