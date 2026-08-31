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
  const client = getClient();
  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as server_time, current_database() as database_name');
    return res.status(200).json({
      status: 'healthy',
      database: 'Aiven PostgreSQL Connected',
      details: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({
      status: 'unhealthy',
      error: err.message
    });
  } finally {
    await client.end();
  }
};
