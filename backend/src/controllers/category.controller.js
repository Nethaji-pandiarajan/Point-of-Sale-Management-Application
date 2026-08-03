const categoryModel = require('../models/category.model');
const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const getCategories = async (req, res, next) => {
  try {
    const categoriesWithCount = await categoryModel.findAll();
    
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
    const duplicate = await categoryModel.existsByName(name);
    if (duplicate) {
      return res.status(400).json({ status: 'error', message: `Category "${name}" already exists` });
    }

    const newCategory = await categoryModel.create({
      name,
      description,
      icon,
      status
    });

    createNotification({
      title: 'Category Added',
      message: `Category "${newCategory.name}" created successfully.`,
      type: 'success',
      icon: 'tags',
      reference_type: 'category',
      reference_id: newCategory.id
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

    const existingCat = await categoryModel.findById(id);
    if (!existingCat) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    // Duplicate Check (except self)
    if (name) {
      const duplicate = await categoryModel.existsByNameExceptId(name, id);
      if (duplicate) {
        return res.status(400).json({ status: 'error', message: `Category "${name}" already exists` });
      }
    }

    const updatedCat = await categoryModel.update(id, {
      name,
      description,
      icon,
      status
    });

    createNotification({
      title: 'Category Updated',
      message: `Category "${updatedCat.name}" updated successfully.`,
      type: 'info',
      icon: 'tags',
      reference_type: 'category',
      reference_id: updatedCat.id
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

    // Check if there are active products belonging to this category
    const productCountResult = await db.query('SELECT COUNT(id)::integer FROM products WHERE category_id = $1', [parseInt(id, 10)]);
    const count = productCountResult.rows[0].count;

    if (count > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete category that still contains products. Please delete or reassign all products first.'
      });
    }

    const deletedCat = await categoryModel.remove(id);
    if (!deletedCat) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    createNotification({
      title: 'Category Deleted',
      message: `Category "${deletedCat.name}" deleted successfully.`,
      type: 'warning',
      icon: 'trash',
      reference_type: 'category',
      reference_id: id
    });

    res.status(200).json({
      status: 'success',
      message: `Category "${deletedCat.name}" deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Interface exports for backward compatibility
const getInMemoryCategories = async () => await categoryModel.findAll();

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getInMemoryCategories
};
