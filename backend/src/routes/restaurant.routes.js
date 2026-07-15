const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');

router.get('/settings', restaurantController.getSettings);
router.patch('/settings', restaurantController.updateSettings);

module.exports = router;
