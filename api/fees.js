const { Client } = require('pg');

function getClient() {
  const connectionString = (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0];
  return new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = getClient();

  try {
    await client.connect();
    
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM fee_payments ORDER BY id ASC');
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Database Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end();
  }
};
