const mongoose = require("mongoose");

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
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    type: {
      type: String,
      enum: ["credit", "debit", "refund"],
      required: true,
    },
    amount: {
      type: Number, // Stored in Paise
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    balanceAfter: Number,
  },
  { timestamps: true }
);

// This checks if the model already exists before creating a new one
module.exports = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);