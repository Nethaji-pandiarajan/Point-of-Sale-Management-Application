const categoryModel = require('../models/category.model');
const productModel = require('../models/product.model');

const getCategories = async (req, res, next) => {
  try {
    const categories = categoryModel.findAll();
    const products = productModel.findAll();
    
    // Dynamically calculate product count for each category
    const categoriesWithCount = categories.map(cat => {
      const count = products.filter(p => p.categoryId === cat.id).length;
      return { ...cat, productCount: count };
    });

    res.status(200).json({
      status: 'success',
      data: categoriesWithCount
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, status } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Category name is required' });
    }

    // Duplicate Check
    const exists = categoryModel.existsByName(name);
    if (exists) {
      return res.status(400).json({ status: 'error', message: `Category "${name}" already exists` });
    }

    const newCategory = categoryModel.create({
      name,
      description,
      icon,
      status
    });

    res.status(201).json({
      status: 'success',
      data: newCategory
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, status } = req.body;

    const existingCat = categoryModel.findById(id);
    if (!existingCat) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    // Duplicate Check (except self)
    if (name) {
      const duplicate = categoryModel.existsByNameExceptId(name, id);
      if (duplicate) {
        return res.status(400).json({ status: 'error', message: `Category "${name}" already exists` });
      }
    }

    const updatedCat = categoryModel.update(id, {
      name,
      description,
      icon,
      status
    });

    res.status(200).json({
      status: 'success',
      data: updatedCat
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedCat = categoryModel.remove(id);

    if (!deletedCat) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    // Delete or unassign products belonging to this category
    productModel.deleteByCategory(id);

    res.status(200).json({
      status: 'success',
      message: `Category "${deletedCat.name}" deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Interface exports for backward compatibility
const getInMemoryCategories = () => categoryModel.findAll();

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getInMemoryCategories
};
