// server/models/Order.js
// ============================================================
// CART MODEL — Temporary, per-user shopping cart.
// One cart per user; replaced on each update.
// NOTE: Prices are SNAPSHOTTED at add-to-cart time to prevent
// price changes from silently affecting the cart.
// ============================================================

const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      max: [10, "Cannot order more than 10 of a single item"],
    },

    // ❗ Price snapshot (in paise) — locked at the time item was added to cart
    // If the admin changes the item price, existing carts are not affected.
    price: {
      type: Number,
      required: true,
    },

    specialInstructions: {
      type: String,
      maxlength: [200, "Instructions cannot exceed 200 characters"],
      trim: true,
      default: "",
    },
  },
  { _id: false } // No separate _id for sub-documents — keeps it lean
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One cart per user
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },

    // Computed total (in paise) — store for quick reads without summing every time
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// cartSchema.index({ userId: 1 }); // Already defined by unique: true

const Cart = mongoose.model("Cart", cartSchema);


// ============================================================
// ORDER MODEL
// The most critical collection — once placed, order data is
// immutable (prices, item names). We snapshot everything.
// ============================================================

// Sub-schema: each item inside an order
const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    // ❗ Snapshots — stored so order history is accurate even if item changes
    name: { type: String, required: true },      // Item name at time of order
    price: { type: Number, required: true },      // Price (paise) at time of order
    imageUrl: { type: String, default: null },    // Primary image at time of order

    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },

    specialInstructions: {
      type: String,
      default: "",
      maxlength: 200,
    },

    // Line total (paise): price × quantity — precomputed to avoid runtime math
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

// Sub-schema: tracks each status change with a timestamp
const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system-triggered changes
    },
    note: { type: String, default: "" }, // e.g., rejection reason
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Human-readable order number (shown on QR code & receipts)
    // Format: CC-YYYYMMDD-XXXXX (e.g. CC-20241225-00042)
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Order must have at least one item",
      },
    },

    // Total in paise
    totalAmount: {
      type: Number,
      required: true,
      min: [1, "Order amount must be greater than 0"],
    },

    // ── Status ────────────────────────────────────────
    status: {
      type: String,
      enum: [
        "placed",     // Student placed the order
        "accepted",   // Kitchen accepted
        "cooking",    // Kitchen started cooking
        "ready",      // Ready for pickup
        "completed",  // Student picked up (QR scanned)
        "rejected",   // Kitchen rejected
        "cancelled",  // Student cancelled (before accepted)
      ],
      default: "placed",
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // Kitchen notes (visible to kitchen staff only)
    kitchenNote: {
      type: String,
      default: "",
      maxlength: 300,
    },

    // Reason when rejected (shown to student)
    rejectionReason: {
      type: String,
      default: null,
    },

    // ── QR Code ───────────────────────────────────────
    // Contains the orderNumber — frontend generates the QR image from this string.
    // Kitchen scans it to mark the order as "completed".
    qrCode: {
      type: String,
      required: true, // Generated on order creation
    },

    isPickedUp: {
      type: Boolean,
      default: false,
    },

    pickedUpAt: {
      type: Date,
      default: null,
    },

    // ── Payment ───────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: ["paid", "refunded", "partially_refunded"],
      default: "paid", // Payment is deducted before order is placed
    },

    walletTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
      required: true,
    },

    // Estimated preparation time in minutes (kitchen sets this on accept)
    estimatedTime: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────
orderSchema.index({ userId: 1, createdAt: -1 });        // Student order history
orderSchema.index({ status: 1, createdAt: 1 });         // Kitchen queue (FIFO)
// orderSchema.index({ orderNumber: 1 });                   // QR code lookup (Already defined by unique: true)
orderSchema.index({ createdAt: -1 });                    // Admin date filters
orderSchema.index({ "items.menuItem": 1 });              // Analytics: per-item sales

// ─────────────────────────────────────────────
// STATICS
// ─────────────────────────────────────────────

// Generate unique order number: CC-YYYYMMDD-NNNNN
orderSchema.statics.generateOrderNumber = async function () {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `CC-${datePart}-`;

  // Count today's orders to get the next sequence number
  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lt: new Date(today.setHours(23, 59, 59, 999)),
    },
  });

  const seq = String(count + 1).padStart(5, "0");
  return `${prefix}${seq}`;
};

const Order = mongoose.model("Order", orderSchema);

module.exports = { Cart, Order };
