const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.patch('/:id/status', customerController.updateCustomerStatus);

module.exports = router;
