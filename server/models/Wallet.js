// server/models/Wallet.js
// ============================================================
// WALLET MODEL — One wallet per user (student only)
// Balance stored in PAISE (₹1 = 100 paise) to avoid
// floating-point precision bugs with currency arithmetic.
// ============================================================

const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One wallet per user — enforced at DB level
    },

    // ❗ Store in PAISE (integer), not rupees (float)
    // Example: ₹100.50 is stored as 10050
    balance: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
    },

    isActive: {
      type: Boolean,
      default: true, // Admin can freeze a wallet if needed
    },

    // Lifetime stats (denormalized for quick display — avoids aggregations on hot path)
    totalCredited: { type: Number, default: 0 },  // Total ever added
    totalDebited: { type: Number, default: 0 },   // Total ever spent
  },
  {
    timestamps: true,
  }
);

walletSchema.index({ userId: 1 });

// ─────────────────────────────────────────────
// VIRTUAL — Balance in rupees (for display)
// ─────────────────────────────────────────────
walletSchema.virtual("balanceInRupees").get(function () {
  return (this.balance / 100).toFixed(2);
});

module.exports = mongoose.model("Wallet", walletSchema);


// ============================================================
// WALLET TRANSACTION MODEL
// Every credit (top-up) and debit (order payment) is recorded.
// This is your audit trail — never delete transactions.
// ============================================================

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The order this debit was for (null for top-ups)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    type: {
      type: String,
      enum: ["credit", "debit", "refund"],
      required: true,
    },

    // Amount in PAISE
    amount: {
      type: Number,
      required: true,
      min: [1, "Transaction amount must be at least 1 paise"],
    },

    description: {
      type: String,
      required: true,
      // Examples: "Wallet top-up via Razorpay", "Order #CC-001234 payment", "Refund for rejected order"
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    // Razorpay fields — populated for top-up transactions
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null, select: false },

    // Balance snapshot AFTER this transaction (useful for statements)
    balanceAfter: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────
walletTransactionSchema.index({ userId: 1, createdAt: -1 }); // User transaction history
walletTransactionSchema.index({ walletId: 1 });
walletTransactionSchema.index({ orderId: 1 });
walletTransactionSchema.index({ razorpayOrderId: 1 });       // Razorpay webhook lookup
walletTransactionSchema.index({ status: 1, createdAt: -1 }); // Admin pending list

// At the bottom of server/models/Wallet.js
const Wallet = mongoose.model("Wallet", walletSchema);
const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);

module.exports = { Wallet, WalletTransaction };