const categoryModel = require('../models/category.model');
const productModel = require('../models/product.model');
const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const getProducts = async (req, res, next) => {
  try {
    const { category, availability, search } = req.query;

    let queryText = `
      SELECT p.id, p.category_id AS "categoryId", p.name, p.description, 
             p.price, p.is_available, p.image_url AS image, c.name AS "categoryName"
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      queryText += ` AND p.category_id = $${paramIndex++}`;
      params.push(parseInt(category, 10));
    }

    if (availability) {
      queryText += ` AND p.is_available = $${paramIndex++}`;
      params.push(availability === 'available');
    }

    if (search) {
      queryText += ` AND (LOWER(p.name) LIKE $${paramIndex} OR LOWER(p.description) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase().trim()}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY p.name ASC`;

    const result = await db.query(queryText, params);

    const mapped = result.rows.map(row => ({
      id: row.id,
      categoryId: row.categoryId,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      availability: row.is_available ? 'available' : 'out_of_stock',
      image: row.image,
      categoryName: row.categoryName || 'Unassigned'
    }));

    res.status(200).json({
      status: 'success',
      data: mapped
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, categoryId, price, availability, image } = req.body;
    let imageUrl = '🍔';
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    } else if (image) {
      imageUrl = image;
    }

    // 1. Mandatory Parameters checks
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Product name is required'
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Valid category is required'
      });
    }

    if (price === undefined || price === null || price === '') {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Price is required'
      });
    }

    // 2. Format checks (Decimals validation)
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Price must be a positive number'
      });
    }

    // 3. Verify Category exists in database
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        status: 'error',
        message: 'Selected category was not found'
      });
    }

    // 4. Confirm category is active
    if (category.status !== 'active') {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Selected category is inactive'
      });
    }

    const newProduct = await productModel.create({
      name: name.trim(),
      description: description || '',
      categoryId,
      price: numPrice,
      availability: availability || 'available',
      image: imageUrl
    });

    createNotification({
      title: 'Product Added',
      message: `Product "${newProduct.name}" created successfully.`,
      type: 'success',
      icon: 'utensils',
      reference_type: 'product',
      reference_id: newProduct.id
    });

    res.status(201).json({
      success: true,
      status: 'success',
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, price, availability, image } = req.body;

    const existingProduct = await productModel.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const updatePayload = {};

    if (name) {
      if (!name.trim()) {
        return res.status(400).json({ status: 'error', message: 'Product name cannot be empty' });
      }
      updatePayload.name = name;
    }

    if (description !== undefined) {
      updatePayload.description = description;
    }

    if (categoryId) {
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        return res.status(404).json({ status: 'error', message: 'Selected category was not found' });
      }
      if (category.status !== 'active') {
        return res.status(400).json({ status: 'error', message: 'Selected category is inactive' });
      }
      updatePayload.categoryId = categoryId;
    }

    if (price !== undefined && price !== null && price !== '') {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ status: 'error', message: 'Price must be a positive number' });
      }
      updatePayload.price = numPrice;
    }

    if (availability) updatePayload.availability = availability;
    if (req.file) {
      updatePayload.image = `/uploads/products/${req.file.filename}`;
    } else if (image !== undefined) {
      updatePayload.image = image;
    }

    const updatedProduct = await productModel.update(id, updatePayload);

    createNotification({
      title: 'Product Updated',
      message: `Product "${updatedProduct.name}" updated successfully.`,
      type: 'info',
      icon: 'utensils',
      reference_type: 'product',
      reference_id: updatedProduct.id
    });

    res.status(200).json({
      status: 'success',
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if product is referenced in historical order items
    const checkOrderResult = await db.query('SELECT COUNT(id)::integer FROM order_items WHERE product_id = $1', [parseInt(id, 10)]);
    const refCount = checkOrderResult.rows[0].count;

    if (refCount > 0) {
      // Prefer soft-delete or marking inactive status if product is used in existing orders
      await productModel.update(id, { availability: 'out_of_stock' });

      createNotification({
        title: 'Product Out of Stock',
        message: `Product ID #${id} marked as out of stock due to existing historical order references.`,
        type: 'warning',
        icon: 'utensils',
        reference_type: 'product',
        reference_id: id
      });

      return res.status(200).json({
        status: 'success',
        message: `Product is linked to historical orders. Marked as out of stock/unavailable instead of deleting.`
      });
    }

    const deleted = await productModel.remove(id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    createNotification({
      title: 'Product Deleted',
      message: `Product "${deleted.name}" deleted from menu catalog.`,
      type: 'warning',
      icon: 'trash',
      reference_type: 'product',
      reference_id: id
    });

    res.status(200).json({
      status: 'success',
      message: `Product "${deleted.name}" deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Interface exports for category deletion cascades
const getInMemoryProducts = async () => await productModel.findAll();
const deleteProductsByCategory = async (categoryId) => await productModel.deleteByCategory(categoryId);

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getInMemoryProducts,
  deleteProductsByCategory
};
