const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, tableController.getTables);
router.get('/:id', protect, tableController.getTableById);
router.post('/', protect, tableController.createTable);
router.put('/:id', protect, tableController.updateTable);
router.delete('/:id', protect, tableController.deleteTable);

module.exports = router;
