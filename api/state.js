const { Client } = require('pg');
const { requireAuth } = require('./authMiddleware');


if (!process.env.DATABASE_URL && !process.env.AIVEN_DATABASE_URL) {
  try { require('dotenv').config(); } catch (e) {}
}

function getClient() {
  const connectionString = (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0];
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

function cleanUsersArray(users, isSuperAdmin = false) {
  if (!Array.isArray(users)) return users;
  let filtered = users.filter(u => {
    if (!u) return false;
    const usr = (u.username || '').toLowerCase().trim();
    const fn = (u.fullName || '').toLowerCase().trim();
    if (usr === 'correspondent' || usr === 'testing' || usr === 'sharma') return false;
    if (fn.includes('manzoor') || fn.includes('s. k. rao') || fn.includes('swathi') || fn.includes('r. k. sharma') || fn === 'test') return false;
    return true;
  });

  const hasAdmin = filtered.some(u => (u.username || '').toLowerCase() === 'shaikmadar786');
  if (!hasAdmin) {
    filtered.unshift({
      empId: 'EMP-001',
      fullName: 'Shaik Madar (Admin / Correspondent)',
      username: 'shaikmadar786',
      password: 'Shaik@786',
      passwordHash: '9d5752ada6cd123fc7905ec6c4e89af4b4e8de924668fb33853ee1da394594f4',
      mobile: '+91 9121833702',
      email: 'correspondent@stvenushighschool.edu.in',
      role: 'super_admin',
      status: 'Active',
      timing: '8:30 AM – 4:30 PM',
      createdAt: '10-Jun-2026 09:00 AM',
      lastLogin: 'Never'
    });
  }

  const hasPrincipal = filtered.some(u => (u.username || '').toLowerCase() === 'principal' || u.role === 'principal');
  if (!hasPrincipal) {
    filtered.push({
      empId: 'EMP-002',
      fullName: 'Mrs. Sunitha Devi (Principal)',
      username: 'principal',
      password: 'admin123',
      passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      mobile: '+91 98490 20001',
      email: 'principal@stvenushighschool.edu.in',
      role: 'principal',
      status: 'Active',
      timing: '8:00 AM – 5:00 PM',
      createdAt: '10-Jun-2026 09:00 AM',
      lastLogin: 'Never'
    });
  }

  const hasAccountant = filtered.some(u => (u.username || '').toLowerCase() === 'accountant' || u.role === 'accountant');
  if (!hasAccountant) {
    filtered.push({
      empId: 'EMP-003',
      fullName: 'Mr. K. Ramesh (Accountant)',
      username: 'accountant',
      password: 'admin123',
      passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      mobile: '+91 98490 20003',
      email: 'accounts@stvenushighschool.edu.in',
      role: 'accountant',
      status: 'Active',
      timing: '8:30 AM – 4:30 PM',
      createdAt: '10-Jun-2026 09:00 AM',
      lastLogin: 'Never'
    });
  }

  return filtered;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getClient();
  try {
    await client.connect();

    // Enforce Backend Authentication Guard
    const authUser = await requireAuth(req, res, client);
    if (!authUser) return;

    if (req.method === 'GET') {
      const rows = await client.query('SELECT key, value, updated_at FROM app_state');
      const stateObj = {};
      for (const r of rows.rows) {
        if (r.key === 'users') {
          const cleaned = cleanUsersArray(r.value);
          // Strip password and passwordHash for non-super-admins
          stateObj[r.key] = cleaned.map(u => {
            if (authUser.role === 'super_admin') return u;
            const copy = { ...u };
            delete copy.password;
            delete copy.passwordHash;
            return copy;
          });
        } else {
          stateObj[r.key] = r.value;
        }
      }
      return res.status(200).json({
        success: true,
        data: stateObj
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      
      // Support single { key, value } or multiple { updates: { key: val, ... } }
      if (body.updates && typeof body.updates === 'object') {
        for (const [k, v] of Object.entries(body.updates)) {
          // If updating users, verify super_admin role
          if (k === 'users' && authUser.role !== 'super_admin') {
            continue; // Ignore unauthorized user roster edits
          }
          const valToStore = (k === 'users') ? cleanUsersArray(v) : v;
          await client.query(`
            INSERT INTO app_state (key, value, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE SET
              value = EXCLUDED.value,
              updated_at = CURRENT_TIMESTAMP
          `, [k, JSON.stringify(valToStore)]);
        }
        return res.status(200).json({ success: true, message: 'All state keys updated in Aiven DB' });
      }

      if (body.key && body.value !== undefined) {
        if (body.key === 'users' && authUser.role !== 'super_admin') {
          return res.status(403).json({ success: false, error: 'Forbidden: Only super_admin can update user accounts.' });
        }
        const valToStore = (body.key === 'users') ? cleanUsersArray(body.value) : body.value;
        await client.query(`
          INSERT INTO app_state (key, value, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP
        `, [body.key, JSON.stringify(valToStore)]);
        return res.status(200).json({ success: true, message: `Key ${body.key} saved to Aiven DB` });
      }

      return res.status(400).json({ success: false, error: 'Invalid request body. Expected { key, value } or { updates }' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('State API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end().catch(() => {});
  }
};

