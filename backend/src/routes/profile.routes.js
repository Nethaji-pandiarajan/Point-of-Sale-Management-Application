const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { handleProfileUpload } = require('../middleware/upload.middleware');

router.get('/', protect, adminController.getProfile);
router.put('/', protect, adminController.updateProfile);
router.patch('/', protect, adminController.updateProfile);
router.post('/upload-photo', protect, handleProfileUpload, profileController.uploadPhoto);

module.exports = router;
