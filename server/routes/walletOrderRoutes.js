// server/routes/walletRoutes.js
// ============================================================
// WALLET ROUTES — Mounted at /api/wallet
// All routes are student-only
// ============================================================

const express = require("express");
const router = express.Router();

const {
  getWallet,
  getTransactions,
  initiateTopUp,
  verifyTopUp,
  getSpendingAnalytics,
} = require("../controllers/walletController");

const { protect, authorize } = require("../middleware/auth");

const studentOnly = [protect, authorize("student")];

router.get("/",                    ...studentOnly, getWallet);
router.get("/transactions",        ...studentOnly, getTransactions);
router.get("/spending-analytics",  ...studentOnly, getSpendingAnalytics);
router.post("/topup/initiate",     ...studentOnly, initiateTopUp);
router.post("/topup/verify",       ...studentOnly, verifyTopUp);

module.exports = router;


// ============================================================
// server/routes/orderRoutes.js
// ORDER ROUTES — Mounted at /api/orders
// ============================================================

const orderRouter = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getKitchenQueue,
} = require("../controllers/orderController");

// const { protect, authorize } = require("../middleware/auth");

// ── Student routes ────────────────────────────────────────────
orderRouter.post(   "/",                protect, authorize("student"),                  placeOrder);
orderRouter.get(    "/",                protect, authorize("student"),                  getMyOrders);
orderRouter.patch(  "/:id/cancel",      protect, authorize("student"),                  cancelOrder);

// ── Kitchen + Admin routes ────────────────────────────────────
orderRouter.get(    "/kitchen/queue",   protect, authorize("kitchen", "admin"),         getKitchenQueue);
orderRouter.patch(  "/:id/status",      protect, authorize("kitchen", "admin"),         updateOrderStatus);

// ── All authenticated roles ───────────────────────────────────
orderRouter.get(    "/:id",             protect,                                        getOrderById);

module.exports = { walletRouter: router, orderRouter };
