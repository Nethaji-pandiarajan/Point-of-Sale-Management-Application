const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const uploadMiddleware = require('../middleware/upload.middleware');

router.get('/', productController.getProducts);
router.post('/', uploadMiddleware, productController.createProduct);
router.put('/:id', uploadMiddleware, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
