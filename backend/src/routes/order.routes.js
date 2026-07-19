const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', protect, orderController.createOrder);
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;
