const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Login Route
router.post('/login', authController.login);

// Placeholder for current user profile
router.get('/me', (req, res) => {
  res.json({ message: 'Auth profile route placeholder.' });
});

module.exports = router;
