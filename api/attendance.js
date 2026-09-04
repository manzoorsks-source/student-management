const { Client } = require('pg');

function getClient() {
  const connectionString = (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0];
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getClient();
  try {
    await client.connect();

    // GET /api/attendance
    if (req.method === 'GET') {
      const stateRes = await client.query("SELECT value FROM app_state WHERE key = 'attendanceMap'");
      const attendanceMap = stateRes.rows.length > 0 ? stateRes.rows[0].value : {};
      return res.status(200).json({
        success: true,
        data: attendanceMap
      });
    }

    // POST /api/attendance - Saves daily attendance register and student histories
    if (req.method === 'POST') {
      const { attendanceMap, targetDate, studentUpdates } = req.body || {};

      // Save today's/date attendance map to app_state
      if (attendanceMap) {
        await client.query(`
          INSERT INTO app_state (key, value, updated_at)
          VALUES ('attendanceMap', $1, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP
        `, [JSON.stringify(attendanceMap)]);
      }

      // If student individual attendance histories are provided
      if (Array.isArray(studentUpdates) && studentUpdates.length > 0 && targetDate) {
        for (const u of studentUpdates) {
          if (!u.id) continue;
          const sRes = await client.query('SELECT data FROM students WHERE student_id = $1', [u.id]);
          if (sRes.rows.length > 0) {
            let sObj = typeof sRes.rows[0].data === 'string' ? JSON.parse(sRes.rows[0].data) : (sRes.rows[0].data || {});
            if (!sObj.attendanceHistory) sObj.attendanceHistory = {};
            sObj.attendanceHistory[targetDate] = {
              date: targetDate,
              status: u.status || 'Present',
              reason: u.reason || '',
              leaveApproved: false,
              updatedAt: new Date().toISOString()
            };
            await client.query('UPDATE students SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2', [JSON.stringify(sObj), u.id]);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Attendance saved successfully to Aiven PostgreSQL'
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Attendance API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end().catch(() => {});
  }
};
