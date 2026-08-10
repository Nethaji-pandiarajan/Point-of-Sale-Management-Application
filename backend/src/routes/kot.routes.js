const express = require('express');
const router = express.Router();
const { getKots, getKotById, updateKotStatus } = require('../controllers/kot.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getKots);
router.get('/:id', getKotById);
router.patch('/:id/status', updateKotStatus);

module.exports = router;
