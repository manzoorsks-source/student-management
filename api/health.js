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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getClient();
  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as server_time, current_database() as database_name');
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    
    return res.status(200).json({
      status: 'healthy',
      database: 'Aiven PostgreSQL Connected',
      studentCount: parseInt(studentCount.rows[0].count, 10),
      serverTime: result.rows[0].server_time,
      databaseName: result.rows[0].database_name
    });
  } catch (err) {
    return res.status(500).json({
      status: 'unhealthy',
      error: err.message
    });
  } finally {
    await client.end().catch(() => {});
  }
};
