const { Client } = require('pg');
const { requireAuth } = require('./authMiddleware');

global.__DEMO_APP_STATE__ = global.__DEMO_APP_STATE__ || {};

if (!process.env.DATABASE_URL && !process.env.AIVEN_DATABASE_URL) {
  try { require('dotenv').config(); } catch (e) {}
}

const { getClient } = require('./dbConfig');

const OFFICIAL_DEFAULT_USERS = [
  {
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
  },
  {
    empId: 'EMP-002',
    fullName: 'Mr. Mohd Althaf (Super Admin 2)',
    username: 'althaf',
    password: 'Althaf@786',
    passwordHash: '0b0c14407c7c87e7135a72b3af444a2a2d7fee70d585aa61d07b4767c6f75426',
    mobile: '+91 7659000786',
    email: 'principal@stvenushighschool.edu.in',
    role: 'super_admin',
    status: 'Active',
    timing: '8:00 AM – 5:00 PM',
    createdAt: '10-Jun-2026 09:00 AM',
    lastLogin: 'Never'
  },
  {
    empId: 'EMP-003',
    fullName: 'Mr. Aktharpasha (Accountant)',
    username: 'akthar',
    password: 'admin123',
    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    mobile: '+91 9121833702',
    email: 'accounts@stvenushighschool.edu.in',
    role: 'accountant',
    status: 'Active',
    timing: '8:30 AM – 4:30 PM',
    createdAt: '10-Jun-2026 09:00 AM',
    lastLogin: 'Never'
  },
  {
    empId: 'EMP-003-ALT',
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
  },
  {
    empId: 'EMP-004',
    fullName: 'stvenus',
    username: 'venus',
    password: 'admin123',
    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    mobile: '+91 9121833702',
    email: 'correspondent@stvenushighschool.edu.in',
    role: 'admin',
    status: 'Active',
    timing: '8:30 AM – 4:30 PM',
    createdAt: '07-Sep-2026 09:38 AM',
    lastLogin: 'Never'
  },
  {
    empId: 'EMP-005',
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
  }
];

function cleanUsersArray(users) {
  if (!Array.isArray(users) || users.length === 0) {
    return OFFICIAL_DEFAULT_USERS;
  }
  const seenUsernames = new Set();
  let filtered = users.filter(u => {
    if (!u) return false;
    const usr = (u.username || '').toLowerCase().trim();
    const fn = (u.fullName || '').toLowerCase().trim();
    if (usr === 'correspondent' || usr === 'testing' || usr === 'test') return false;
    if (fn.includes('demo administrator') || fn.includes('sunita sharma') || fn.includes('rajesh verma') || fn.includes('priya patel') || usr === 'teacher') {
      return false;
    }
    if (seenUsernames.has(usr)) return false;
    seenUsernames.add(usr);
    return true;
  });

  OFFICIAL_DEFAULT_USERS.forEach(defUser => {
    if (!seenUsernames.has(defUser.username.toLowerCase())) {
      filtered.push(defUser);
      seenUsernames.add(defUser.username.toLowerCase());
    }
  });

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
      if (!stateObj.users || !Array.isArray(stateObj.users) || stateObj.users.length === 0) {
        stateObj.users = OFFICIAL_DEFAULT_USERS;
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
