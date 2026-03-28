// server/controllers/categoryController.js
// ============================================================
// CATEGORY CONTROLLER
//
// Public:      getAllCategories, getCategoryById
// Admin only:  createCategory, updateCategory, deleteCategory
// ============================================================

const { Category, MenuItem } = require("../models/MenuItem");
const { AppError } = require("../middleware/errorHandler");

// ─────────────────────────────────────────────
// @route   GET /api/categories
// @access  Public
// @desc    Get all active categories (sorted by sortOrder)
// ─────────────────────────────────────────────
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean(); // .lean() returns plain JS objects — faster when you don't need Mongoose methods

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/categories/:id
// @access  Public
// ─────────────────────────────────────────────
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).lean();

    if (!category) {
      throw new AppError("Category not found.", 404);
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/categories
// @access  Admin only
// ─────────────────────────────────────────────
const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, sortOrder } = req.body;

    if (!name) throw new AppError("Category name is required.", 400);

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      image: image || null,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/categories/:id
// @access  Admin only
// ─────────────────────────────────────────────
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image, sortOrder, isActive } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(image !== undefined && { image }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true } // new: true returns the updated doc
    );

    if (!category) throw new AppError("Category not found.", 404);

    res.status(200).json({
      success: true,
      message: "Category updated.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/categories/:id
// @access  Admin only
// @desc    Soft delete — sets isActive: false.
//          Cannot delete if active menu items exist in it.
// ─────────────────────────────────────────────
const deleteCategory = async (req, res, next) => {
  try {
    // Check if any active items belong to this category
    const itemCount = await MenuItem.countDocuments({
      category: req.params.id,
      isAvailable: true,
    });

    if (itemCount > 0) {
      throw new AppError(
        `Cannot delete category — it has ${itemCount} active menu item(s). Deactivate or reassign them first.`,
        400
      );
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) throw new AppError("Category not found.", 404);

    res.status(200).json({
      success: true,
      message: "Category deactivated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
