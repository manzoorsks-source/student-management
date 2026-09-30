const { Client } = require('pg');
const { requireAuth } = require('./authMiddleware');

global.__DEMO_ATTENDANCE__ = global.__DEMO_ATTENDANCE__ || {};

if (!process.env.DATABASE_URL && !process.env.AIVEN_DATABASE_URL) {
  try { require('dotenv').config(); } catch (e) {}
}

const { getClient } = require('./dbConfig');

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
    const authUser = await requireAuth(req, res, dbConnected ? client : null);
    if (!authUser) return;

    // GET /api/attendance
    if (req.method === 'GET') {
      let attendanceMap = global.__DEMO_ATTENDANCE__;

      if (dbConnected && client) {
        try {
          const stateRes = await client.query("SELECT value FROM app_state WHERE key = 'attendanceMap'");
          if (stateRes.rows.length > 0) {
            attendanceMap = stateRes.rows[0].value;
          }
        } catch (dbErr) {}
      }

      return res.status(200).json({
        success: true,
        data: attendanceMap
      });
    }

    // POST /api/attendance
    if (req.method === 'POST') {
      const { attendanceMap, targetDate, studentUpdates, singleUpdate } = req.body || {};

      if (singleUpdate && singleUpdate.id && targetDate) {
        const studentId = singleUpdate.id;
        const status = singleUpdate.status || 'Present';
        global.__DEMO_ATTENDANCE__[studentId] = status;

        if (global.__DEMO_STUDENTS__) {
          const s = global.__DEMO_STUDENTS__.find(item => item.id === studentId);
          if (s) {
            if (!s.attendanceHistory) s.attendanceHistory = {};
            s.attendanceHistory[targetDate] = status;
          }
        }

        if (dbConnected && client) {
          try {
            await client.query(`
              INSERT INTO app_state (key, value, updated_at)
              VALUES ('attendanceMap', $1, CURRENT_TIMESTAMP)
              ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify(global.__DEMO_ATTENDANCE__)]);
          } catch (e) {}
        }

        return res.status(200).json({ success: true, message: `Attendance updated for ${studentId}` });
      }

      if (attendanceMap && typeof attendanceMap === 'object') {
        global.__DEMO_ATTENDANCE__ = { ...global.__DEMO_ATTENDANCE__, ...attendanceMap };

        if (dbConnected && client) {
          try {
            await client.query(`
              INSERT INTO app_state (key, value, updated_at)
              VALUES ('attendanceMap', $1, CURRENT_TIMESTAMP)
              ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify(global.__DEMO_ATTENDANCE__)]);
          } catch (e) {}
        }

        return res.status(200).json({ success: true, message: 'Attendance register saved successfully' });
      }

      return res.status(400).json({ success: false, error: 'Invalid attendance update payload' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Attendance API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client && dbConnected) {
      await client.end().catch(() => {});
    }
  }
};
