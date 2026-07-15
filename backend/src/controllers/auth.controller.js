const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Find user by email in PostgreSQL
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim()]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials. User not found.'
      });
    }

    // Verify hashed password using bcrypt.compare()
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'saleiz_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role === 'admin' ? 'Owner' : user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login
};
