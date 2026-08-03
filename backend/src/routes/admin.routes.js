const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const profileController = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');
const { handleProfileUpload } = require('../middleware/upload.middleware');

router.get('/profile', protect, adminController.getProfile);
router.patch('/profile', protect, adminController.updateProfile);
router.patch('/change-password', protect, adminController.changePassword);
router.post('/profile/upload-photo', protect, handleProfileUpload, profileController.uploadPhoto);

module.exports = router;
