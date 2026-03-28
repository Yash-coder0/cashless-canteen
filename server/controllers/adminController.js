// server/controllers/adminController.js
const mongoose = require("mongoose");
const User = require("../models/User");
const { Order } = require("../models/Order");
const { MenuItem, Category } = require("../models/MenuItem");
const WalletTransaction = require("../models/WalletTransaction");
const { AppError } = require("../middleware/errorHandler");

const WalletTxModel = WalletTransaction.WalletTransaction || WalletTransaction;

// ── Revenue Dashboard ─────────────────────────────────────────

// GET /api/admin/analytics/revenue?period=daily|weekly|monthly|yearly
const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = "monthly" } = req.query;
    const now = new Date();
    let startDate, groupFmt;

    switch (period) {
      case "daily":   startDate = new Date(now - 24*60*60*1000); groupFmt = { $dateToString: { format: "%H:00", date: "$createdAt" } }; break;
      case "weekly":  startDate = new Date(now - 7*24*60*60*1000); groupFmt = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }; break;
      case "yearly":  startDate = new Date(now.getFullYear()-1, now.getMonth(), 1); groupFmt = { $dateToString: { format: "%Y-%m", date: "$createdAt" } }; break;
      default:        startDate = new Date(now - 30*24*60*60*1000); groupFmt = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    const revenue = await Order.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startDate } } },
      { $group: { _id: groupFmt, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true, period,
      data: revenue.map(r => ({ date: r._id, revenue: r.revenue/100, orders: r.orders })),
    });
  } catch (e) { next(e); }
};

// GET /api/admin/analytics/overview
const getOverview = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);

    const [totalUsers, totalOrders, todayOrders, revenueAgg, topItems, peakHours] = await Promise.all([
      User.countDocuments({ role: "student", isActive: true }),
      Order.countDocuments({ status: "completed" }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      // Most ordered items
      Order.aggregate([
        { $match: { status: "completed" } },
        { $unwind: "$items" },
        { $group: { _id: "$items.menuItem", name: { $first: "$items.name" }, totalQty: { $sum: "$items.quantity" }, revenue: { $sum: "$items.subtotal" } } },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
      ]),
      // Peak hours
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: { $hour: "$createdAt" }, orders: { $sum: 1 } } },
        { $sort: { orders: -1 } },
        { $limit: 3 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents: totalUsers,
        totalCompletedOrders: totalOrders,
        todayOrders,
        totalRevenue: (revenueAgg[0]?.total || 0) / 100,
        topItems: topItems.map(i => ({ ...i, revenue: i.revenue/100 })),
        peakHours: peakHours.map(h => ({ hour: `${h._id}:00`, orders: h.orders })),
      },
    });
  } catch (e) { next(e); }
};

// GET /api/admin/analytics/items — most/least popular
const getItemAnalytics = async (req, res, next) => {
  try {
    const items = await Order.aggregate([
      { $match: { status: "completed" } },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.menuItem",
        name: { $first: "$items.name" },
        totalOrders: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.subtotal" },
      }},
      { $sort: { totalOrders: -1 } },
    ]);

    res.status(200).json({
      success: true,
      mostPopular: items.slice(0,5).map(i => ({ ...i, totalRevenue: i.totalRevenue/100 })),
      slowMoving:  items.slice(-5).reverse().map(i => ({ ...i, totalRevenue: i.totalRevenue/100 })),
    });
  } catch (e) { next(e); }
};

// ── User Management ───────────────────────────────────────────

// GET /api/admin/users?role=student&page=1&limit=20&search=
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page=1, limit=20, search, isActive } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { collegeId: { $regex: search, $options: "i" } },
    ];

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip((pageNum-1)*limitNum).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: pageNum, totalPages: Math.ceil(total/limitNum), data: users });
  } catch (e) { next(e); }
};

// PATCH /api/admin/users/:id/toggle-active
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError("User not found.", 404);
    if (user._id.toString() === req.user._id.toString()) throw new AppError("Cannot deactivate your own account.", 400);
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, message: `Account ${user.isActive ? "activated" : "deactivated"}.`, data: { isActive: user.isActive } });
  } catch (e) { next(e); }
};

// ── Order Management ──────────────────────────────────────────

// GET /api/admin/orders?status=&page=&userId=&dateFrom=&dateTo=
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page=1, limit=20, userId, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const [orders, total] = await Promise.all([
      Order.find(filter).populate("userId","name email collegeId").sort({ createdAt:-1 }).skip((pageNum-1)*limitNum).limit(limitNum).lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true, total, page: pageNum, totalPages: Math.ceil(total/limitNum),
      data: orders.map(o => ({ ...o, totalAmount: o.totalAmount/100, items: o.items.map(i => ({...i, price: i.price/100, subtotal: i.subtotal/100 })) })),
    });
  } catch (e) { next(e); }
};

// ── Staff Management ──────────────────────────────────────────

// GET /api/admin/staff
const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ["kitchen","admin"] } }).select("-password").sort({ role:1, createdAt:-1 }).lean();
    res.status(200).json({ success: true, data: staff });
  } catch (e) { next(e); }
};

// DELETE /api/admin/staff/:id — soft delete staff
const removeStaff = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: { $in: ["kitchen","admin"] } });
    if (!user) throw new AppError("Staff member not found.", 404);
    if (user._id.toString() === req.user._id.toString()) throw new AppError("Cannot remove yourself.", 400);
    user.isActive = false;
    await user.save();
    res.status(200).json({ success: true, message: "Staff account deactivated." });
  } catch (e) { next(e); }
};

// ── Menu Management (admin wrappers) ──────────────────────────

// GET /api/admin/menu — includes inactive items (unlike public /api/menu)
const getAllMenuItems = async (req, res, next) => {
  try {
    const items = await MenuItem.find({}).populate("category","name").sort({ isAvailable:-1, createdAt:-1 }).lean();
    res.status(200).json({ success: true, count: items.length, data: items.map(i => ({ ...i, price: i.price/100 })) });
  } catch (e) { next(e); }
};

// GET /api/admin/export/orders — CSV-ready order data
const exportOrders = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(filter)
      .populate("userId","name email collegeId")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    // Build CSV
    const headers = "Order Number,Student Name,College ID,Email,Items,Total (₹),Status,Date\n";
    const rows = orders.map(o => {
      const itemSummary = o.items.map(i => `${i.name}×${i.quantity}`).join("; ");
      return `${o.orderNumber},${o.userId?.name || ""},${o.userId?.collegeId || ""},${o.userId?.email || ""},"${itemSummary}",${o.totalAmount/100},${o.status},${new Date(o.createdAt).toLocaleString("en-IN")}`;
    }).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=orders-${Date.now()}.csv`);
    res.status(200).send(headers + rows);
  } catch (e) { next(e); }
};

// GET /api/admin/export/revenue — revenue summary CSV
const exportRevenue = async (req, res, next) => {
  try {
    const revenue = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const headers = "Date,Total Orders,Revenue (₹)\n";
    const rows = revenue.map(r => `${r._id},${r.orders},${r.revenue/100}`).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=revenue-${Date.now()}.csv`);
    res.status(200).send(headers + rows);
  } catch (e) { next(e); }
};

module.exports = {
  getRevenueAnalytics, getOverview, getItemAnalytics,
  getAllUsers, toggleUserActive,
  getAllOrders, getStaff, removeStaff,
  getAllMenuItems, exportOrders, exportRevenue,
};
