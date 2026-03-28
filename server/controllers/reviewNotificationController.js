// server/controllers/reviewController.js
const Review = require("../models/Review");
const { Order } = require("../models/Order");
const { AppError } = require("../middleware/errorHandler");

// POST /api/reviews
const createReview = async (req, res, next) => {
  try {
    const { orderId, menuItemId, rating, comment } = req.body;
    if (!orderId || !menuItemId || !rating) throw new AppError("orderId, menuItemId, and rating are required.", 400);
    if (rating < 1 || rating > 5) throw new AppError("Rating must be between 1 and 5.", 400);

    // Verify order belongs to user and is completed
    const order = await Order.findOne({ _id: orderId, userId: req.user._id, status: "completed" });
    if (!order) throw new AppError("Order not found or not yet completed.", 404);

    // Verify item was in the order
    const ordered = order.items.some(i => i.menuItem.toString() === menuItemId);
    if (!ordered) throw new AppError("This item was not in your order.", 400);

    const review = await Review.create({ userId: req.user._id, menuItemId, orderId, rating, comment: comment?.trim() });
    res.status(201).json({ success: true, message: "Review submitted. Thank you!", data: review });
  } catch (e) { next(e); }
};

// GET /api/reviews/item/:menuItemId
const getItemReviews = async (req, res, next) => {
  try {
    const { page=1, limit=10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, parseInt(limit));
    const [reviews, total] = await Promise.all([
      Review.find({ menuItemId: req.params.menuItemId })
        .populate("userId","name avatar")
        .sort({ createdAt:-1 }).skip((pageNum-1)*limitNum).limit(limitNum).lean(),
      Review.countDocuments({ menuItemId: req.params.menuItemId }),
    ]);
    res.status(200).json({ success: true, total, page: pageNum, totalPages: Math.ceil(total/limitNum), data: reviews });
  } catch (e) { next(e); }
};

// GET /api/reviews/my
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate("menuItemId","name images").sort({ createdAt:-1 }).lean();
    res.status(200).json({ success: true, data: reviews });
  } catch (e) { next(e); }
};

// module.exports = { createReview, getItemReviews, getMyReviews };


// ============================================================
// server/controllers/notificationController.js
// ============================================================
const Notification = require("../models/Notification");

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page=1, limit=20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id }).sort({ createdAt:-1 }).skip((pageNum-1)*limitNum).limit(limitNum).lean(),
      Notification.countDocuments({ userId: req.user._id }),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);
    res.status(200).json({ success: true, total, unreadCount, data: notifications });
  } catch (e) { next(e); }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (e) { next(e); }
};

// PATCH /api/notifications/:id/read
const markOneRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true });
    res.status(200).json({ success: true });
  } catch (e) { next(e); }
};

// Helper — create and push notification (used internally by other controllers)
const createNotification = async (userId, title, message, type, data = {}) => {
  try {
    await Notification.create({ userId, title, message, type, data });
  } catch { /* non-critical — never break the main flow */ }
};

// module.exports = { getNotifications, markAllRead, markOneRead, createNotification };

module.exports = { 
  createReview, 
  getItemReviews, 
  getMyReviews, 
  getNotifications, 
  markAllRead, 
  markOneRead, 
  createNotification 
};