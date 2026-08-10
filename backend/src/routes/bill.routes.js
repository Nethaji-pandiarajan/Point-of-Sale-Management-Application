const express = require('express');
const router = express.Router();
const { generateBill, getBillByOrderId, processPayment } = require('../controllers/bill.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/generate', generateBill);
router.get('/order/:orderId', getBillByOrderId);
router.post('/:id/pay', processPayment);

module.exports = router;
