const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'saleiz_secret');

      // Fetch user from PostgreSQL
      const result = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authorized, user not found'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('❌ Token validation failed:', error.message);
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, token invalid or expired'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, token missing or malformed'
    });
  }
};

module.exports = { protect };
