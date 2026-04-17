const Review = require("../models/Review");
const { Order } = require("../models/Order");
const { MenuItem } = require("../models/MenuItem");
const { AppError } = require("../middleware/errorHandler");

// GET /api/reviews/:menuItemId
const getReviewsByItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    
    // Fetch all approved reviews
    const reviews = await Review.find({ menuItemId, isApproved: true })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reviews
const submitReview = async (req, res, next) => {
  try {
    const { menuItemId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!menuItemId || !rating) {
      throw new AppError("menuItemId and rating are required.", 400);
    }
    if (rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5.", 400);
    }

    // 1. Check if student has a completed order containing this menuItem
    const completedOrder = await Order.findOne({
      userId,
      status: { $in: ["ready", "completed"] },
      "items.menuItem": menuItemId
    });

    if (!completedOrder) {
      throw new AppError("You can only review items you have ordered and received.", 403);
    }

    // 2. Check if student hasn't already reviewed this item (app-level check)
    const existingReview = await Review.findOne({ userId, menuItemId });
    if (existingReview) {
      throw new AppError("You have already reviewed this item.", 400);
    }

    // 3. Save review
    const review = await Review.create({
      userId,
      menuItemId,
      orderId: completedOrder._id,
      rating,
      comment: comment?.trim()
    });

    // 4. Update MenuItem's avgRating and reviewCount fields
    const stats = await Review.aggregate([
      { $match: { menuItemId: review.menuItemId, isApproved: true } },
      {
        $group: {
          _id: "$menuItemId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].avgRating * 10) / 10;
      await MenuItem.findByIdAndUpdate(menuItemId, {
        avgRating: avg,
        reviewCount: stats[0].count,
        // Update the existing fields as well to maintain consistency
        averageRating: avg,
        totalReviews: stats[0].count
      });
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      data: review
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviewsByItem,
  submitReview
};
