/**
 * Authentication Middleware for St. Venus High School Management System
 * Enforces cryptographic session token verification against PostgreSQL database
 */

function extractToken(req) {
  if (!req) return null;
  
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1].trim();
    }
    if (parts.length === 1 && parts[0].length > 10) {
      return parts[0].trim();
    }
  }

  // 2. X-Auth-Token header
  const xAuth = req.headers['x-auth-token'] || req.headers['X-Auth-Token'];
  if (xAuth) {
    return xAuth.trim();
  }

  // 3. Cookie (stv_session_token)
  const cookieHeader = req.headers['cookie'];
  if (cookieHeader) {
    const match = cookieHeader.match(/stv_session_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  // 4. Query param fallback for direct downloads/exports if token provided
  if (req.query && req.query.auth_token) {
    return req.query.auth_token.trim();
  }

  return null;
}

/**
 * Validates session token against database.
 * Returns authenticated user object or null.
 */
async function verifySessionToken(token, client) {
  if (!token || typeof token !== 'string') return null;

  try {
    const result = await client.query(`
      SELECT token, emp_id, username, role, user_data, expires_at
      FROM auth_sessions
      WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP
    `, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    const session = result.rows[0];

    // Async touch last_activity (fire and forget)
    client.query(`
      UPDATE auth_sessions
      SET last_activity = CURRENT_TIMESTAMP
      WHERE token = $1
    `, [token]).catch(() => {});

    return {
      token: session.token,
      empId: session.emp_id,
      username: session.username,
      role: session.role,
      ...(typeof session.user_data === 'string' ? JSON.parse(session.user_data) : session.user_data)
    };
  } catch (err) {
    console.error('Session verification error:', err.message);
    return null;
  }
}

/**
 * Guard helper that sends 401 response if user is unauthenticated.
 * Usage in handlers:
 * const user = await requireAuth(req, res, client);
 * if (!user) return; // Response was already sent
 */
async function requireAuth(req, res, client) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please login with valid credentials.'
    });
    return null;
  }

  const user = await verifySessionToken(token, client);
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.'
    });
    return null;
  }

  req.user = user;
  return user;
}

module.exports = {
  extractToken,
  verifySessionToken,
  requireAuth
};
