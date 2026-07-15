const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'saleiz',
  password: process.env.PGPASSWORD || 'abisurya',
  port: parseInt(process.env.PGPORT || '5432', 10),
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

const bcrypt = require('bcrypt');

// Test connection on startup and initialize schema
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed. Saleiz backend will run in offline/disconnected database mode.', err.message);
  } else {
    console.log('✅ Database connected successfully to', client.database);
    try {
      // Create user table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed default admin if table is empty
      const adminCheck = await client.query("SELECT id FROM users WHERE email = 'admin@saleiz.com'");
      if (adminCheck.rowCount === 0) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await client.query(
          "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
          ['Saleiz Admin', 'admin@saleiz.com', hashedPassword, 'admin']
        );
        console.log('👤 Default admin user seeded successfully in PostgreSQL.');
      }
    } catch (e) {
      console.error('❌ Error initializing users schema:', e.message);
    } finally {
      release();
    }
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
