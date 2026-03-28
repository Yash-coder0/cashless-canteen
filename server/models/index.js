// server/models/index.js
// ============================================================
// CENTRAL MODEL EXPORT
// Import all models from this single file throughout the app.
//
// Usage:
//   const { User, MenuItem, Order } = require('../models');
// ============================================================

const User = require("./User");
const { Wallet, WalletTransaction } = require("./Wallet");
const { Category, MenuItem } = require("./MenuItem");
const { Cart, Order } = require("./Order");
const Review = require("./Review");
const Notification = require("./Notification.JS");

module.exports = {
  User,
  Wallet,
  WalletTransaction,
  Category,
  MenuItem,
  Cart,
  Order,
  Review,
  Notification,
};


// ============================================================
// ── SCHEMA DESIGN DECISIONS & NOTES ─────────────────────────
// ============================================================
//
// 1. CURRENCY (PAISE, NOT RUPEES)
//    All monetary values (price, balance, transaction amounts)
//    are stored as integers in paise (₹1 = 100 paise).
//    This eliminates floating-point precision bugs.
//    Convert to rupees only at the API response / display layer.
//    Example: ₹49.50 → stored as 4950
//
// 2. PRICE SNAPSHOTS IN ORDERS
//    When a student places an order, we copy the name, price,
//    and image of each item into the order document.
//    This ensures order history remains accurate even if the
//    admin later changes the item's price or deletes it.
//
// 3. DENORMALIZATION (averageRating, totalOrders)
//    MenuItem stores averageRating and totalOrders so the menu
//    listing page never needs an aggregation pipeline.
//    These fields are updated via post-save hooks in Review
//    and after each order is placed. Trade-off: slight
//    inconsistency window (~ms), but acceptable for a canteen.
//
// 4. WALLET BALANCE IS SOURCE OF TRUTH
//    The Wallet.balance field is always the correct current
//    balance. WalletTransaction records are the audit log.
//    Never recompute balance by summing transactions — it's
//    too slow and risky. Update atomically using findOneAndUpdate
//    with $inc to avoid race conditions.
//
// 5. ORDER STATUS FLOW
//    placed → accepted → cooking → ready → completed
//         ↘ rejected (from placed or accepted)
//         ↘ cancelled (student cancels while still "placed")
//    Refund is triggered automatically on rejection/cancellation.
//
// 6. ONE CART PER USER
//    Cart is upserted (findOneAndUpdate with upsert: true).
//    Replacing the entire items array is simpler than patching
//    individual items and keeps the cart in sync.
//
// 7. SOFT DELETES
//    Menu items and users use isActive: false instead of hard
//    deletion. This preserves order history integrity.
//    Use { isActive: true } filter in all listing queries.
//
// 8. INDEXES STRATEGY
//    Every field used in a query filter or sort has an index.
//    Compound indexes follow the ESR rule:
//    Equality → Sort → Range
//    Example: { status: 1, createdAt: 1 } for the kitchen queue.
//
// 9. NOTIFICATIONS AUTO-EXPIRY
//    TTL index on Notification.createdAt deletes records
//    older than 30 days automatically. MongoDB runs the cleanup
//    every 60 seconds. No manual cleanup job needed.
//
// 10. QR CODE STRATEGY
//    qrCode field stores the ORDER NUMBER string (not a URL).
//    The frontend generates the QR image from this string
//    using a library like 'qrcode'. Kitchen staff scan it,
//    extract the order number, and call the pickup API.
//    This way QR codes work offline too.
//
// ============================================================
