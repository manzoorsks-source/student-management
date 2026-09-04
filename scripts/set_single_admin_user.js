require('dotenv').config();
const { Client } = require('pg');
const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function run() {
  const connectionString = (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0];
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Aiven Cloud Database.');

  const adminPassword = 'Shaik@786';
  const adminPasswordHash = sha256(adminPassword);
  console.log(`Password Hash for "${adminPassword}": ${adminPasswordHash}`);

  const singleAdminUser = [
    {
      empId: 'EMP-001',
      fullName: 'Shaik Madar (Admin / Correspondent)',
      username: 'shaikmadar786',
      password: adminPassword,
      passwordHash: adminPasswordHash,
      mobile: '+91 9121833702',
      email: 'correspondent@stvenushighschool.edu.in',
      role: 'super_admin',
      status: 'Active',
      timing: '8:30 AM – 4:30 PM',
      createdAt: '10-Jun-2026 09:00 AM',
      lastLogin: 'Never'
    }
  ];

  // Update app_state table in Aiven DB
  await client.query(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = CURRENT_TIMESTAMP
  `, ['users', JSON.stringify(singleAdminUser)]);

  console.log('✅ Successfully saved single Admin user "shaikmadar786" into Aiven PostgreSQL app_state!');

  // Verify
  const res = await client.query(`SELECT key, value, updated_at FROM app_state WHERE key = 'users'`);
  console.log('Verification read from Aiven DB:');
  console.log(JSON.stringify(res.rows[0], null, 2));

  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
