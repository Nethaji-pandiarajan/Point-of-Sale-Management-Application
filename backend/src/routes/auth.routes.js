const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Login Route
router.post('/login', authController.login);

// Current user profile route
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user
  });
});

module.exports = router;
