const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, staffController.getStaff);
router.get('/:id', protect, staffController.getStaffById);
router.post('/', protect, staffController.createStaff);
router.put('/:id', protect, staffController.updateStaff);
router.patch('/:id/password', protect, staffController.resetStaffPassword);
router.delete('/:id', protect, staffController.deleteStaff);

module.exports = router;
