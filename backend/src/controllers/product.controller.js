const categoryModel = require('../models/category.model');
const productModel = require('../models/product.model');

const getProducts = async (req, res, next) => {
  try {
    const { category, availability, search } = req.query;
    let filteredList = productModel.findAll();

    // Filter by Category ID
    if (category) {
      filteredList = filteredList.filter(p => p.categoryId === category);
    }

    // Filter by Availability Status
    if (availability) {
      filteredList = filteredList.filter(p => p.availability === availability);
    }

    // Filter by Search Query
    if (search) {
      const term = search.toLowerCase().trim();
      filteredList = filteredList.filter(
        p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
    }

    // Attach Category Name
    const categoriesList = categoryModel.findAll();
    const result = filteredList.map(p => {
      const cat = categoriesList.find(c => c.id === p.categoryId);
      return { ...p, categoryName: cat ? cat.name : 'Unassigned' };
    });

    res.status(200).json({
      status: 'success',
      data: result
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

    // 3. Verify Category exists in database/mock models
    const category = categoryModel.findById(categoryId);
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

    const newProduct = productModel.create({
      name: name.trim(),
      description: description || '',
      categoryId,
      price: numPrice,
      availability: availability || 'available',
      image: imageUrl
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

    const existingProduct = productModel.findById(id);
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
      const category = categoryModel.findById(categoryId);
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

    const updatedProduct = productModel.update(id, updatePayload);

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
    const deleted = productModel.remove(id);

    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    res.status(200).json({
      status: 'success',
      message: `Product "${deleted.name}" deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Interface exports for category deletion cascades
const getInMemoryProducts = () => productModel.findAll();
const deleteProductsByCategory = (categoryId) => productModel.deleteByCategory(categoryId);

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getInMemoryProducts,
  deleteProductsByCategory
};
