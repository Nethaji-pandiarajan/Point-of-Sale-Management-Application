// User database model methods placeholder
const db = require('../config/db');

const findByEmail = async (email) => {
  // Query users from database
  // const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  // return result.rows[0];
  return null;
};

const create = async (userData) => {
  // Create user in database
  return null;
};

module.exports = {
  findByEmail,
  create
};
