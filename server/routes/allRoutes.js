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
