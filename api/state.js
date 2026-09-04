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

    if (req.method === 'GET') {
      const rows = await client.query('SELECT key, value, updated_at FROM app_state');
      const stateObj = {};
      for (const r of rows.rows) {
        stateObj[r.key] = r.value;
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
          await client.query(`
            INSERT INTO app_state (key, value, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE SET
              value = EXCLUDED.value,
              updated_at = CURRENT_TIMESTAMP
          `, [k, JSON.stringify(v)]);
        }
        return res.status(200).json({ success: true, message: 'All state keys updated in Aiven DB' });
      }

      if (body.key && body.value !== undefined) {
        await client.query(`
          INSERT INTO app_state (key, value, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP
        `, [body.key, JSON.stringify(body.value)]);
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
