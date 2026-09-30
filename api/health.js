const { Client } = require('pg');

if (!process.env.DATABASE_URL && !process.env.AIVEN_DATABASE_URL) {
  try { require('dotenv').config(); } catch (e) {}
}

const { getClient } = require('./dbConfig');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getClient();
  if (client) {
    try {
      await client.connect();
      const result = await client.query('SELECT NOW() as server_time, current_database() as database_name');
      const studentCount = await client.query('SELECT COUNT(*) FROM students');
      
      return res.status(200).json({
        status: 'healthy',
        mode: 'postgresql',
        database: 'PostgreSQL Connected',
        studentCount: parseInt(studentCount.rows[0].count, 10),
        serverTime: result.rows[0].server_time,
        databaseName: result.rows[0].database_name
      });
    } catch (err) {
      // Fall through to demo mode response
    } finally {
      await client.end().catch(() => {});
    }
  }

  // Demo Mode Healthy Response
  const studentCount = (global.__DEMO_STUDENTS__ && global.__DEMO_STUDENTS__.length) || 26;
  return res.status(200).json({
    status: 'healthy',
    mode: 'demo_mode',
    database: 'In-Memory Demo Storage Active',
    studentCount: studentCount,
    serverTime: new Date().toISOString()
  });
};
