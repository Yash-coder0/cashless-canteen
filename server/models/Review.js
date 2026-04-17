// server/models/Review.js
// ============================================================
// REVIEW MODEL
// A student can only review an item if they have a "completed"
// order containing that item. Enforced at the controller level.
// One review per user per order item.
// ============================================================

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true, // Review must be tied to a real order
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
      default: "",
    },

    // True = user actually ordered this item (always true here — enforced in controller)
    isVerified: {
      type: Boolean,
      default: true,
    },

    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────
reviewSchema.index({ menuItemId: 1, createdAt: -1 });      // Reviews for an item
reviewSchema.index({ userId: 1 });                          // User's own reviews
reviewSchema.index({ orderId: 1 });                         // Reviews from a specific order

// ❗ Prevent duplicate reviews: one review per user per order per item
reviewSchema.index(
  { userId: 1, orderId: 1, menuItemId: 1 },
  { unique: true, name: "one_review_per_order_item" }
);

// ❗ Prevent duplicate reviews completely per user per menu item
reviewSchema.index(
  { menuItemId: 1, userId: 1 },
  { unique: true, name: "one_review_per_student_item" }
);

// ─────────────────────────────────────────────
// POST-SAVE HOOK — Update MenuItem's avg rating
// ─────────────────────────────────────────────
reviewSchema.post("save", async function () {
  const MenuItem = mongoose.model("MenuItem");

  const stats = await mongoose.model("Review").aggregate([
    { $match: { menuItemId: this.menuItemId } },
    {
      $group: {
        _id: "$menuItemId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await MenuItem.findByIdAndUpdate(this.menuItemId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal
      totalReviews: stats[0].count,
    });
  }
});

module.exports = mongoose.model("Review", reviewSchema);


