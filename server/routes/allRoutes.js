// server/routes/kitchenRoutes.js
const { protect, authorize } = require("../middleware/auth");
const express = require("express");
const r = express.Router();
const { getQueue, getReadyOrders, updateStatus, toggleSoldOut, getTodayStats } = require("../controllers/kitchenController");
const kw = [protect, authorize("kitchen","admin")];

r.get("/queue",              ...kw, getQueue);
r.get("/ready",              ...kw, getReadyOrders);
r.get("/stats/today",        ...kw, getTodayStats);
r.patch("/orders/:id/status",...kw, updateStatus);
r.patch("/menu/:id/sold-out",...kw, toggleSoldOut);

module.exports = r;


// ============================================================
// server/routes/adminRoutes.js
// ============================================================
const adminRouter = express.Router();
const {
  getRevenueAnalytics, getOverview, getItemAnalytics,
  getAllUsers, toggleUserActive, getAllOrders,
  getStaff, removeStaff, getAllMenuItems, exportOrders, exportRevenue,
} = require("../controllers/adminController");
const aw = [protect, authorize("admin")];
const akw = [protect, authorize("admin", "kitchen")];

adminRouter.get("/analytics/overview",    ...akw, getOverview);
adminRouter.get("/analytics/revenue",     ...akw, getRevenueAnalytics);
adminRouter.get("/analytics/items",       ...aw, getItemAnalytics);
adminRouter.get("/users",                 ...aw, getAllUsers);
adminRouter.patch("/users/:id/toggle",    ...aw, toggleUserActive);
adminRouter.get("/orders",                ...aw, getAllOrders);
adminRouter.get("/staff",                 ...aw, getStaff);
adminRouter.delete("/staff/:id",          ...aw, removeStaff);
adminRouter.get("/menu",                  ...aw, getAllMenuItems);
adminRouter.get("/export/orders",         ...aw, exportOrders);
adminRouter.get("/export/revenue",        ...aw, exportRevenue);

adminRouter.get("/export/orders-pdf", ...aw, async (req, res, next) => {
  try {
    const { dateFrom, dateTo, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }
    const { Order } = require("../models/Order");
    const orders = await Order.find(filter)
      .populate("userId", "name email collegeId")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="orders-report.pdf"`);
    const { generateOrdersReportPDF } = require("../utils/pdfGenerator");
    generateOrdersReportPDF(orders, req.query, res);
  } catch (e) { next(e); }
});

adminRouter.get("/export/revenue-pdf", ...aw, async (req, res, next) => {
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
    const { Order } = require("../models/Order");
    const revQuery = await Order.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startDate } } },
      { $group: { _id: groupFmt, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const revenue = revQuery.map(r => ({ date: r._id, revenue: r.revenue/100, orders: r.orders }));
    const totalOrders = revenue.reduce((acc, curr) => acc + curr.orders, 0);
    const totalRev = revenue.reduce((acc, curr) => acc + curr.revenue, 0);

    const itemsQuery = await Order.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.menuItem",
        name: { $first: "$items.name" },
        totalOrders: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.subtotal" },
      }},
      { $sort: { totalOrders: -1 } },
    ]);
    const mostPopular = itemsQuery.slice(0,10).map(i => ({ ...i, totalRevenue: i.totalRevenue/100 }));

    const analyticsData = {
      revenue,
      overview: { totalRevenue: totalRev, totalCompletedOrders: totalOrders },
      items: { mostPopular }
    };
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="revenue-report.pdf"`);
    const { generateRevenueReportPDF } = require("../utils/pdfGenerator");
    generateRevenueReportPDF(analyticsData, period, res);
  } catch (e) { next(e); }
});

// ============================================================
// server/routes/reviewRoutes.js
// ============================================================
const reviewRouter = express.Router();
const { createReview, getItemReviews, getMyReviews } = require("../controllers/reviewNotificationController");

reviewRouter.post("/",                protect, authorize("student"), createReview);
reviewRouter.get("/my",               protect, authorize("student"), getMyReviews);
reviewRouter.get("/item/:menuItemId", getItemReviews); // public


// ============================================================
// server/routes/notificationRoutes.js
// ============================================================
const notifRouter = express.Router();
const { getNotifications, markAllRead, markOneRead } = require("../controllers/reviewNotificationController");

notifRouter.get("/",           protect, getNotifications);
notifRouter.patch("/read-all", protect, markAllRead);
notifRouter.patch("/:id/read", protect, markOneRead);


module.exports = { kitchenRouter: r, adminRouter, reviewRouter, notifRouter };
