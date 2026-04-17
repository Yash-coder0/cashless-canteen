// server/models/MenuItem.js
// ============================================================
// CATEGORY MODEL — Snacks, Meals, Beverages, etc.
// ============================================================

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxlength: [30, "Category name cannot exceed 30 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },

    // Cloudinary URL for category banner/icon image
    image: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Controls display order on menu page (lower = shows first)
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ isActive: 1, sortOrder: 1 }); // Menu page query

const Category = mongoose.model("Category", categorySchema);


// ============================================================
// MENU ITEM MODEL
// This is the heart of the system — kept intentionally flat
// for performance. Avoid embedding orders here.
// ============================================================

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [80, "Item name cannot exceed 80 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Price in PAISE (₹1 = 100 paise) — consistent with wallet
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [100, "Price must be at least ₹1"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    // Array of Cloudinary URLs (first image is the primary display image)
    images: {
      type: [String],
      default: [],
    },

    // ── Availability ──────────────────────────────────
    isAvailable: {
      type: Boolean,
      default: true, // Admin toggle: hide item from menu entirely
    },

    isSoldOut: {
      type: Boolean,
      default: false, // Kitchen staff toggle: temporarily out of stock
    },

    // ── Food Type Flags ───────────────────────────────
    isVegetarian: {
      type: Boolean,
      default: true,
    },

    isVegan: {
      type: Boolean,
      default: false,
    },

    isSpicy: {
      type: Boolean,
      default: false,
    },

    // ── Preparation ───────────────────────────────────
    preparationTime: {
      type: Number, // In minutes
      default: 10,
      min: [1, "Preparation time must be at least 1 minute"],
    },

    tags: {
      type: [String], // e.g. ["bestseller", "new", "popular"]
      default: [],
    },

    // ── Denormalized Rating Fields ────────────────────
    // Updated automatically when a review is added/removed.
    // Avoids expensive aggregations on the menu listing page.
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    avgRating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    // ── Analytics ─────────────────────────────────────
    totalOrders: {
      type: Number,
      default: 0, // Incremented on every order — used for "most popular" analytics
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────
menuItemSchema.index({ category: 1, isAvailable: 1, isSoldOut: 1 }); // Menu listing
menuItemSchema.index({ name: "text", description: "text" });           // Full-text search
menuItemSchema.index({ totalOrders: -1 });                             // Most popular analytics
menuItemSchema.index({ averageRating: -1 });                           // Top-rated filter
menuItemSchema.index({ isVegetarian: 1, isAvailable: 1 });            // Veg filter

// ─────────────────────────────────────────────
// VIRTUAL — Price in rupees for display
// ─────────────────────────────────────────────
menuItemSchema.virtual("priceInRupees").get(function () {
  return (this.price / 100).toFixed(2);
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = { Category, MenuItem };
