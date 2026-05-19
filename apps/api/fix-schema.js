require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function fix() {
  const client = await pool.connect();
  try {
    console.log('Adding creator_id column to foods table...');
    await client.query('ALTER TABLE foods ADD COLUMN IF NOT EXISTS creator_id INT;');
    console.log('Successfully added creator_id column.');
  } catch (err) {
    console.error('Error fixing schema:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
