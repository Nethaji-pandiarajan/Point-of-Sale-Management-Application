const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/profile', protect, adminController.getProfile);
router.put('/profile', protect, adminController.updateProfile);
router.patch('/profile', protect, adminController.updateProfile);

module.exports = router;
