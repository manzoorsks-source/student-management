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

    // POST /api/attendance - Saves daily attendance register and updates student attendance histories
    if (req.method === 'POST') {
      const { attendanceMap, targetDate, studentUpdates, singleUpdate } = req.body || {};

      // 1. Single Student Attendance Update
      if (singleUpdate && singleUpdate.id && targetDate) {
        const studentId = singleUpdate.id;
        const status = singleUpdate.status || 'Present';
        const reason = singleUpdate.reason || (status === 'Absent' ? 'Absent / Sick Leave' : '');

        // Update attendanceMap in app_state
        const curMapRes = await client.query("SELECT value FROM app_state WHERE key = 'attendanceMap'");
        let curMap = curMapRes.rows.length > 0 ? curMapRes.rows[0].value : {};
        if (typeof curMap !== 'object' || curMap === null) curMap = {};
        curMap[studentId] = status;

        await client.query(`
          INSERT INTO app_state (key, value, updated_at)
          VALUES ('attendanceMap', $1, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP
        `, [JSON.stringify(curMap)]);

        // Update student record in students table
        const sRes = await client.query('SELECT data FROM students WHERE student_id = $1', [studentId]);
        if (sRes.rows.length > 0) {
          let sObj = typeof sRes.rows[0].data === 'string' ? JSON.parse(sRes.rows[0].data) : (sRes.rows[0].data || {});
          if (!sObj.attendanceHistory) sObj.attendanceHistory = {};
          sObj.attendanceHistory[targetDate] = {
            date: targetDate,
            status: status,
            reason: reason,
            leaveApproved: false,
            updatedAt: new Date().toISOString()
          };
          await client.query('UPDATE students SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2', [JSON.stringify(sObj), studentId]);
        }

        return res.status(200).json({
          success: true,
          message: `Attendance for student ${studentId} updated to ${status} in Aiven PostgreSQL`,
          attendanceMap: curMap
        });
      }

      // 2. Bulk / Register Attendance Update
      if (attendanceMap && typeof attendanceMap === 'object') {
        // Save today's attendanceMap to app_state
        await client.query(`
          INSERT INTO app_state (key, value, updated_at)
          VALUES ('attendanceMap', $1, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP
        `, [JSON.stringify(attendanceMap)]);

        // If targetDate provided, update attendanceHistory on all student records
        if (targetDate) {
          await client.query('BEGIN');
          for (const [studentId, status] of Object.entries(attendanceMap)) {
            const sRes = await client.query('SELECT data FROM students WHERE student_id = $1', [studentId]);
            if (sRes.rows.length > 0) {
              let sObj = typeof sRes.rows[0].data === 'string' ? JSON.parse(sRes.rows[0].data) : (sRes.rows[0].data || {});
              if (!sObj.attendanceHistory) sObj.attendanceHistory = {};
              sObj.attendanceHistory[targetDate] = {
                date: targetDate,
                status: status,
                reason: status === 'Absent' ? (sObj.attendanceHistory[targetDate]?.reason || 'Absent / Sick Leave') : '',
                leaveApproved: false,
                updatedAt: new Date().toISOString()
              };
              await client.query('UPDATE students SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2', [JSON.stringify(sObj), studentId]);
            }
          }
          await client.query('COMMIT');
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Attendance saved and synchronized successfully to Aiven PostgreSQL'
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Attendance API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end().catch(() => {});
  }
};
