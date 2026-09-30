const { Client } = require('pg');
const { requireAuth } = require('./authMiddleware');

global.__DEMO_APP_STATE__ = global.__DEMO_APP_STATE__ || {};

if (!process.env.DATABASE_URL && !process.env.AIVEN_DATABASE_URL) {
  try { require('dotenv').config(); } catch (e) {}
}

const { getClient } = require('./dbConfig');

function cleanUsersArray(users, isSuperAdmin = false) {
  if (!Array.isArray(users)) return users;
  let filtered = users.filter(u => {
    if (!u) return false;
    const usr = (u.username || '').toLowerCase().trim();
    if (usr === 'correspondent' || usr === 'testing' || usr === 'test') return false;
    if (fn.includes('test') || fn.includes('mock')) return false;
    return true;
  });

  const hasAdmin = filtered.some(u => (u.username || '').toLowerCase() === 'admin');
  if (!hasAdmin) {
    filtered.unshift({
      empId: 'EMP-001',
      fullName: 'Demo Administrator (Correspondent)',
      username: 'admin',
      password: 'demo123',
      passwordHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
      mobile: '+91 98765 43210',
      email: 'admin@demoschool.edu',
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
      fullName: 'Dr. Sunita Sharma (Principal)',
      username: 'principal',
      password: 'demo123',
      passwordHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
      mobile: '+91 98765 43211',
      email: 'principal@demoschool.edu',
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
      fullName: 'Mr. Rajesh Verma (Accountant)',
      username: 'accountant',
      password: 'demo123',
      passwordHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
      mobile: '+91 98765 43212',
      email: 'accounts@demoschool.edu',
      role: 'accountant',
      status: 'Active',
      timing: '8:30 AM – 4:30 PM',
      createdAt: '10-Jun-2026 09:00 AM',
      lastLogin: 'Never'
    });
  }

  const hasTeacher = filtered.some(u => (u.username || '').toLowerCase() === 'teacher' || u.role === 'teacher');
  if (!hasTeacher) {
    filtered.push({
      empId: 'EMP-004',
      fullName: 'Mrs. Priya Patel (Senior Faculty)',
      username: 'teacher',
      password: 'demo123',
      passwordHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
      mobile: '+91 98765 43213',
      email: 'teacher@demoschool.edu',
      role: 'teacher',
      status: 'Active',
      timing: '8:30 AM – 4:00 PM',
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

  let client = null;
  let dbConnected = false;

  try {
    client = getClient();
    if (client) {
      await client.connect();
      dbConnected = true;
    }
  } catch (e) {
    client = null;
    dbConnected = false;
  }

  try {
    // Enforce Authentication Guard (supports demo sessions & DB)
    const authUser = await requireAuth(req, res, dbConnected ? client : null);
    if (!authUser) return;

    if (req.method === 'GET') {
      let stateObj = {};

      if (dbConnected && client) {
        try {
          const rows = await client.query('SELECT key, value, updated_at FROM app_state');
          for (const r of rows.rows) {
            if (r.key === 'users') {
              const cleaned = cleanUsersArray(r.value);
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
        } catch (dbErr) {
          stateObj = { ...global.__DEMO_APP_STATE__ };
        }
      } else {
        stateObj = { ...global.__DEMO_APP_STATE__ };
      }

      // Ensure users key exists
      if (!stateObj.users) {
        stateObj.users = cleanUsersArray([]);
      }

      // Ensure website key never returns legacy school data
      if (stateObj.website && (typeof stateObj.website !== 'object' || /venus/i.test(JSON.stringify(stateObj.website)))) {
        delete stateObj.website;
      }

      return res.status(200).json({
        success: true,
        data: stateObj
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      
      if (body.updates && typeof body.updates === 'object') {
        for (const [k, v] of Object.entries(body.updates)) {
          if (k === 'users' && authUser.role !== 'super_admin') continue;
          const valToStore = (k === 'users') ? cleanUsersArray(v) : v;
          global.__DEMO_APP_STATE__[k] = valToStore;

          if (dbConnected && client) {
            try {
              await client.query(`
                INSERT INTO app_state (key, value, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (key) DO UPDATE SET
                  value = EXCLUDED.value,
                  updated_at = CURRENT_TIMESTAMP
              `, [k, JSON.stringify(valToStore)]);
            } catch (e) {}
          }
        }
        return res.status(200).json({ success: true, message: 'All state keys updated successfully' });
      }

      if (body.key && body.value !== undefined) {
        if (body.key === 'users' && authUser.role !== 'super_admin') {
          return res.status(403).json({ success: false, error: 'Forbidden: Only super_admin can update user accounts.' });
        }
        const valToStore = (body.key === 'users') ? cleanUsersArray(body.value) : body.value;
        global.__DEMO_APP_STATE__[body.key] = valToStore;

        if (dbConnected && client) {
          try {
            await client.query(`
              INSERT INTO app_state (key, value, updated_at)
              VALUES ($1, $2, CURRENT_TIMESTAMP)
              ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                updated_at = CURRENT_TIMESTAMP
            `, [body.key, JSON.stringify(valToStore)]);
          } catch (e) {}
        }
        return res.status(200).json({ success: true, message: `Key ${body.key} saved successfully` });
      }

      return res.status(400).json({ success: false, error: 'Invalid request body.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('State API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client && dbConnected) {
      await client.end().catch(() => {});
    }
  }
};
