require('dotenv').config();
const { Client } = require('pg');

const cleanConnectionString = (process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL).split('?')[0];

const client = new Client({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false }
});

async function fixColumns() {
  try {
    await client.connect();
    console.log('Connected to Aiven PostgreSQL to fix table columns...');

    // Academic progress columns
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academic_progress' AND column_name = 'telugu_marks') THEN
          ALTER TABLE academic_progress ADD COLUMN telugu_marks NUMERIC(5,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academic_progress' AND column_name = 'hindi_marks') THEN
          ALTER TABLE academic_progress ADD COLUMN hindi_marks NUMERIC(5,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academic_progress' AND column_name = 'updated_at') THEN
          ALTER TABLE academic_progress ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academic_progress' AND column_name = 'term_name') THEN
          ALTER TABLE academic_progress ADD COLUMN term_name VARCHAR(50) DEFAULT 'Final Term Exam';
        END IF;
      END $$;
    `);
    console.log('✅ academic_progress columns updated.');

    // Fee payments columns
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_payments' AND column_name = 'receipt_no') THEN
          ALTER TABLE fee_payments ADD COLUMN receipt_no VARCHAR(100);
        END IF;
      END $$;
    `);
    console.log('✅ fee_payments columns updated.');

  } catch (err) {
    console.error('Error fixing columns:', err);
  } finally {
    await client.end();
  }
}

fixColumns();
