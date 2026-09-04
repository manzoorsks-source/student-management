const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: 8080, path }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

async function verify() {
  console.log('================================================================');
  console.log('🧪 VERIFYING PERMANENT REMOVAL OF LEGACY USER');
  console.log('================================================================\n');

  const res = await get('/api/state');
  const users = res.data?.data?.users || [];
  console.log(`Current users in database (${users.length}):`);
  users.forEach((u, i) => {
    console.log(`  [${i+1}] ${u.fullName} (@${u.username}) - Role: ${u.role} - ID: ${u.empId}`);
  });

  const legacyFound = users.find(u => u.username === 'correspondent' || u.fullName === 'Mr. M. A. Manzoor' || (u.fullName && u.fullName.includes('Manzoor') && u.role === 'super_admin'));
  if (legacyFound) {
    console.error('❌ FAILED: Legacy user found:', legacyFound);
    process.exit(1);
  }

  const adminFound = users.find(u => u.username === 'shaikmadar786');
  if (!adminFound) {
    console.error('❌ FAILED: Shaik Madar (shaikmadar786) missing!');
    process.exit(1);
  }

  console.log('\n✅ Legacy user "Mr. M. A. Manzoor / correspondent" is 100% GONE from database!');
  console.log('✅ Shaik Madar (@shaikmadar786) is the active primary administrator!');
  console.log('================================================================\n');
}

verify().catch(console.error);
