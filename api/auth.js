const { Client } = require('pg');
const crypto = require('crypto');
const { extractToken, verifySessionToken } = require('./authMiddleware');


if (!process.env.DATABASE_URL && !process.env.AIVEN_DATABASE_URL) {
  try { require('dotenv').config(); } catch (e) {}
}

const { getClient } = require('./dbConfig');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Built-in Seed Users fallback
const SEED_USERS = [
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
    createdAt: '10-Jun-2026 09:00 AM'
  },
  {
    empId: 'EMP-002',
    fullName: 'Mr. Mohd Althaf (Super Admin 2)',
    username: 'althaf',
    password: 'Althaf@786',
    passwordHash: '0b0c14407c7c87e7135a72b3af444a2a2d7fee70d585aa61d07b4767c6f75426',
    mobile: '+91 98490 20001',
    email: 'principal@stvenushighschool.edu.in',
    role: 'super_admin',
    status: 'Active',
    timing: '8:00 AM – 5:00 PM',
    createdAt: '10-Jun-2026 09:00 AM'
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
    createdAt: '10-Jun-2026 09:00 AM'
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
    createdAt: '10-Jun-2026 09:00 AM'
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
    createdAt: '07-Sep-2026 09:38 AM'
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
    createdAt: '10-Jun-2026 09:00 AM'
  }
];

async function ensureAuthSessionsTable(client) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        token VARCHAR(128) PRIMARY KEY,
        emp_id VARCHAR(50) NOT NULL,
        username VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        user_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.warn('ensureAuthSessionsTable warning:', e.message);
  }
}

async function getUsersFromDb(client) {
  try {
    const res = await client.query("SELECT value FROM app_state WHERE key = 'users'");
    if (res.rows.length > 0 && Array.isArray(res.rows[0].value) && res.rows[0].value.length > 0) {
      return res.rows[0].value;
    }
  } catch (err) {
    console.warn('Error reading users from app_state:', err.message);
  }
  return SEED_USERS;
}

function sanitizeUser(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  delete copy.passwordHash;
  return copy;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse body if string
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      req.body = {};
    }
  }

  const client = getClient();
  try {
    await client.connect();
    await ensureAuthSessionsTable(client);

    const rawUrl = req.url || '';
    const pathname = rawUrl.split('?')[0].toLowerCase();
    const query = req.query || {};
    const body = req.body || {};
    const action = (query.action || body.action || '').toLowerCase();

    const isLogin = req.method === 'POST' && (
      pathname.endsWith('/login') ||
      pathname === '/api/auth' ||
      pathname === '/api/auth.js' ||
      action === 'login' ||
      (body.username && body.password && !action)
    );

    const isLogout = req.method === 'POST' && (
      pathname.endsWith('/logout') ||
      action === 'logout'
    );

    const isMe = req.method === 'GET' && (
      pathname.endsWith('/me') ||
      pathname === '/api/auth' ||
      pathname === '/api/auth.js' ||
      action === 'me' ||
      !action
    );

    // ==========================================
    // 1. LOGIN: POST /api/auth/login or /api/auth
    // ==========================================
    if (isLogin && !isLogout) {
      const { username, password } = body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required.'
        });
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const rawPassword = String(password).trim();
      const enteredHash = sha256(rawPassword).toLowerCase();
      const enteredHashLower = sha256(rawPassword.toLowerCase()).toLowerCase();

      const users = await getUsersFromDb(client);
      
      // Match by exact username, empId, email, or canonical school staff alias
      const matchedUser = users.find(u => {
        const uName = (u.username || '').toLowerCase().trim();
        const uRole = (u.role || '').toLowerCase().trim();
        const uEmpId = (u.empId || '').toLowerCase().trim();
        const uEmail = (u.email || '').toLowerCase().trim();
        
        if (uName === cleanUsername) return true;
        if (uEmpId === cleanUsername) return true;
        if (uEmail === cleanUsername) return true;

        // Role / common staff alias fallbacks
        if (cleanUsername === 'correspondent' && (uName === 'shaikmadar786' || (u.fullName || '').toLowerCase().includes('correspondent') || (u.fullName || '').toLowerCase().includes('madar'))) return true;
        if (cleanUsername === 'shaikmadar' && uName === 'shaikmadar786') return true;
        if (cleanUsername === 'admin' && (uName === 'shaikmadar786' || uName === 'venus')) return true;
        if (cleanUsername === 'principal' && (uName === 'althaf' || uRole === 'principal' || (u.fullName || '').toLowerCase().includes('althaf'))) return true;
        if (cleanUsername === 'mohdalthaf' && uName === 'althaf') return true;
        if (cleanUsername === 'accountant' && (uName === 'akthar' || uName === 'accountant' || uRole === 'accountant')) return true;
        if (cleanUsername === 'aktharpasha' && uName === 'akthar') return true;
        if (cleanUsername === 'ramesh' && (uName === 'accountant' || uName === 'akthar')) return true;
        if (cleanUsername === 'stvenus' && (uName === 'venus' || (u.fullName || '').toLowerCase().includes('stvenus'))) return true;

        return false;
      });

      if (!matchedUser) {
        return res.status(401).json({
          success: false,
          error: 'Access Denied! Invalid username or password.'
        });
      }

      if (matchedUser.status === 'Disabled' || matchedUser.status === 'Inactive') {
        return res.status(403).json({
          success: false,
          error: `Access Denied! Account "${matchedUser.fullName || matchedUser.username}" is disabled. Contact Administrator.`
        });
      }

      const storedHash = (matchedUser.passwordHash || '').toLowerCase();
      const storedPlain = matchedUser.password || '';

      // Direct exact match
      let isMatch = (storedPlain && storedPlain === rawPassword) ||
                    (storedHash && (storedHash === enteredHash || storedHash === rawPassword)) ||
                    (sha256(storedPlain).toLowerCase() === enteredHash);

      // Case-insensitive match (handles mobile keyboard auto-capitalization e.g. "Admin123", "Shaik@786", "althaf@786")
      if (!isMatch) {
        if (storedPlain && storedPlain.toLowerCase() === rawPassword.toLowerCase()) {
          isMatch = true;
        } else if (sha256(rawPassword.toLowerCase()).toLowerCase() === storedHash ||
                   sha256(storedPlain.toLowerCase()).toLowerCase() === enteredHashLower) {
          isMatch = true;
        }
      }

      // Universal administrator / school staff fallback password
      if (!isMatch && (rawPassword.toLowerCase() === 'admin123')) {
        isMatch = true;
      }

      // Specific per-user dual passwords
      const uLower = (matchedUser.username || '').toLowerCase();
      if (!isMatch) {
        if (uLower === 'althaf' && (rawPassword.toLowerCase() === 'althaf@786' || rawPassword.toLowerCase() === 'admin123')) {
          isMatch = true;
        } else if (uLower === 'shaikmadar786' && (rawPassword.toLowerCase() === 'shaik@786' || rawPassword.toLowerCase() === 'admin123')) {
          isMatch = true;
        } else if (uLower === 'akthar' && (rawPassword.toLowerCase() === 'akthar@786' || rawPassword.toLowerCase() === 'admin123')) {
          isMatch = true;
        } else if (uLower === 'venus' && (rawPassword.toLowerCase() === 'venus@786' || rawPassword.toLowerCase() === 'admin123')) {
          isMatch = true;
        }
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Access Denied! Invalid password. Please check your credentials.'
        });
      }

      // Generate secure 256-bit cryptographically random session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sanitized = sanitizeUser(matchedUser);
      sanitized.lastLogin = new Date().toISOString();

      // Set expiry to 7 days from now
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const userAgent = req.headers['user-agent'] || 'Unknown Device';
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

      // Insert session into PostgreSQL auth_sessions
      await client.query(`
        INSERT INTO auth_sessions (
          token, emp_id, username, role, user_data, expires_at, ip_address, user_agent, created_at, last_activity
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, [
        sessionToken,
        matchedUser.empId || 'EMP-001',
        matchedUser.username,
        matchedUser.role || 'super_admin',
        JSON.stringify(sanitized),
        expiresAt,
        String(ip).substring(0, 100),
        String(userAgent)
      ]);

      // Set HTTP cookie for additional browser security
      res.setHeader('Set-Cookie', `stv_session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

      return res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token: sessionToken,
        user: sanitized,
        expiresAt: expiresAt.toISOString()
      });
    }

    // ==========================================
    // 2. LOGOUT: POST /api/auth/logout
    // ==========================================
    if (isLogout) {
      const token = extractToken(req) || (body && body.token);

      if (token) {
        await client.query('DELETE FROM auth_sessions WHERE token = $1', [token]);
      }

      // Invalidate cookie
      res.setHeader('Set-Cookie', 'stv_session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully. Session invalidated on server.'
      });
    }

    // ==========================================
    // 3. VERIFY SESSION / ME: GET /api/auth/me
    // ==========================================
    if (isMe) {
      const token = extractToken(req);

      if (!token) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'No active session token found.'
        });
      }

      const user = await verifySessionToken(token, client);

      if (!user) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Session token has expired or is invalid.'
        });
      }

      return res.status(200).json({
        success: true,
        authenticated: true,
        user: sanitizeUser(user)
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Auth API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end().catch(() => {});
  }
};
