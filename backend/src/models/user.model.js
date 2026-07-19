const db = require('../config/db');

const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim()]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const create = async (userData) => {
  const { name, email, password, phone, role, status } = userData;
  const result = await db.query(`
    INSERT INTO users (name, email, password, phone, role, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, email, phone, role, status, created_at
  `, [
    name.trim(),
    email.trim(),
    password,
    phone || '',
    role || 'customer',
    status || 'active'
  ]);
  return result.rows[0];
};

module.exports = {
  findByEmail,
  findById,
  create
};
