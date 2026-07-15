const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/profile', protect, adminController.getProfile);
router.patch('/profile', protect, adminController.updateProfile);
router.patch('/change-password', protect, adminController.changePassword);

module.exports = router;
