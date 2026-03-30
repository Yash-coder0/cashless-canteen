// server/controllers/menuController.js
// ============================================================
// MENU ITEM CONTROLLER
//
// Public:      getAllItems, getItemById, searchItems
// Admin only:  createItem, updateItem, deleteItem
// Kitchen:     toggleSoldOut
// ============================================================

const { MenuItem, Category } = require("../models/MenuItem");
const { AppError } = require("../middleware/errorHandler");
const { uploadToCloudinary } = require("../utils/cloudinary");

// ─────────────────────────────────────────────
// @route   GET /api/menu
// @access  Public
// @desc    Get all available menu items.
//          Supports: category filter, veg filter,
//          sort, search, and pagination.
//
// Query params:
//   ?category=<categoryId>
//   ?isVegetarian=true
//   ?isSpicy=true
//   ?search=samosa
//   ?sort=price_asc | price_desc | rating | popular | newest
//   ?page=1&limit=20
//   ?includeSoldOut=true  (kitchen panel uses this)
// ─────────────────────────────────────────────
const getAllItems = async (req, res, next) => {
  try {
    const {
      category,
      isVegetarian,
      isSpicy,
      search,
      sort = "popular",
      page = 1,
      limit = 20,
      includeSoldOut = "false",
    } = req.query;

    // ── Build filter object ───────────────────
    const filter = { isAvailable: true };

    // Kitchen staff can see sold-out items too
    if (includeSoldOut !== "true") {
      filter.isSoldOut = false;
    }

    if (category) {
      filter.category = category;
    }

    if (isVegetarian === "true") {
      filter.isVegetarian = true;
    }

    if (isSpicy === "true") {
      filter.isSpicy = true;
    }

    // Full-text search (uses the text index on name + description)
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // ── Build sort object ─────────────────────
    const sortOptions = {
      popular:    { totalOrders: -1 },       // Most ordered first
      rating:     { averageRating: -1 },     // Highest rated first
      price_asc:  { price: 1 },              // Cheapest first
      price_desc: { price: -1 },             // Most expensive first
      newest:     { createdAt: -1 },         // Newest additions first
    };

    const sortQuery = sortOptions[sort] || sortOptions.popular;

    // ── Pagination ────────────────────────────
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Cap at 50
    const skip = (pageNum - 1) * limitNum;

    // ── Execute query ─────────────────────────
    // Run count and data fetch in parallel for performance
    const [items, total] = await Promise.all([
      MenuItem.find(filter)
        .populate("category", "name image") // Only fetch name + image from category
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MenuItem.countDocuments(filter),
    ]);

    // ── Format prices for response ────────────
    // Convert paise → rupees for the client
    const formattedItems = items.map(formatItemPrice);

    res.status(200).json({
      success: true,
      count: formattedItems.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: formattedItems,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/menu/:id
// @access  Public
// ─────────────────────────────────────────────
const getItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
      .populate("category", "name image")
      .lean();

    if (!item || !item.isAvailable) {
      throw new AppError("Menu item not found.", 404);
    }

    res.status(200).json({
      success: true,
      data: formatItemPrice(item),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/menu
// @access  Admin only
// ─────────────────────────────────────────────
const createItem = async (req, res, next) => {
  try {
    let {
      name,
      description,
      price,         // Client sends rupees — we convert to paise
      category,
      images,
      isVegetarian,
      isVegan,
      isSpicy,
      preparationTime,
      tags,
    } = req.body;

    if (!name || !price || !category) {
      throw new AppError("Name, price, and category are required.", 400);
    }

    // Parse FormData Strings automatically
    isVegetarian = isVegetarian === 'true' || isVegetarian === true;
    isVegan = isVegan === 'true' || isVegan === true;
    isSpicy = isSpicy === 'true' || isSpicy === true;
    if (typeof tags === 'string') {
      tags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    }
    
    let finalImages = images || [];
    if (req.file && req.file.buffer) {
      const uploadUrl = await uploadToCloudinary(req.file.buffer, "canteen_menu");
      finalImages = [uploadUrl];
    }

    // Verify category exists and is active
    const categoryExists = await Category.findOne({
      _id: category,
      isActive: true,
    });
    if (!categoryExists) {
      throw new AppError("Category not found or is inactive.", 404);
    }

    // Convert rupees → paise (multiply by 100)
    const priceInPaise = Math.round(parseFloat(price) * 100);
    if (priceInPaise < 100) {
      throw new AppError("Price must be at least ₹1.", 400);
    }

    const item = await MenuItem.create({
      name: name.trim(),
      description: description?.trim(),
      price: priceInPaise,
      category,
      images: finalImages,
      isVegetarian,
      isVegan,
      isSpicy,
      preparationTime: preparationTime || 10,
      tags: tags || [],
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully.",
      data: formatItemPrice(item.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/menu/:id
// @access  Admin only
// ─────────────────────────────────────────────
const updateItem = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.isVegetarian !== undefined) updates.isVegetarian = updates.isVegetarian === 'true' || updates.isVegetarian === true;
    if (updates.isVegan !== undefined) updates.isVegan = updates.isVegan === 'true' || updates.isVegan === true;
    if (updates.isSpicy !== undefined) updates.isSpicy = updates.isSpicy === 'true' || updates.isSpicy === true;
    if (typeof updates.tags === 'string') {
      updates.tags = updates.tags ? updates.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    }

    if (req.file && req.file.buffer) {
      updates.images = [await uploadToCloudinary(req.file.buffer, "canteen_menu")];
    }

    // If price is being updated, convert rupees → paise
    if (updates.price !== undefined) {
      updates.price = Math.round(parseFloat(updates.price) * 100);
      if (updates.price < 100) {
        throw new AppError("Price must be at least ₹1.", 400);
      }
    }

    // If category is being updated, verify it exists
    if (updates.category) {
      const categoryExists = await Category.findOne({
        _id: updates.category,
        isActive: true,
      });
      if (!categoryExists) {
        throw new AppError("Category not found or is inactive.", 404);
      }
    }

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("category", "name image");

    if (!item) throw new AppError("Menu item not found.", 404);

    res.status(200).json({
      success: true,
      message: "Menu item updated.",
      data: formatItemPrice(item.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/menu/:id
// @access  Admin only
// @desc    Soft delete — sets isAvailable: false
// ─────────────────────────────────────────────
const deleteItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { isAvailable: false },
      { new: true }
    );

    if (!item) throw new AppError("Menu item not found.", 404);

    res.status(200).json({
      success: true,
      message: "Menu item removed from menu.",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/menu/:id/sold-out
// @access  Kitchen + Admin
// @desc    Kitchen staff toggles sold-out status instantly.
//          This is one of our "wow factor" features.
// ─────────────────────────────────────────────
const toggleSoldOut = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) throw new AppError("Menu item not found.", 404);

    // Toggle the current value
    item.isSoldOut = !item.isSoldOut;
    await item.save();

    res.status(200).json({
      success: true,
      message: `'${item.name}' marked as ${item.isSoldOut ? "sold out" : "available"}.`,
      data: { _id: item._id, isSoldOut: item.isSoldOut },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// HELPER — Convert paise → rupees in response
// Always do this at the response layer, never in DB
// ─────────────────────────────────────────────
const formatItemPrice = (item) => ({
  ...item,
  price: item.price / 100,          // ₹ for display
  priceInPaise: item.price,         // Keep raw value too (cart needs it)
});

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  toggleSoldOut,
};
