const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/sales', reportController.getSalesReport);
router.get('/products', reportController.getProductReport);
router.get('/categories', reportController.getCategoryReport);
router.get('/tables', reportController.getTableReport);
router.get('/waiters', reportController.getWaiterReport);
router.get('/payments', reportController.getPaymentReport);

module.exports = router;
