const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["order_update", "wallet_credit", "wallet_debit", "system"],
      default: "system",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Object, // To store orderId or transactionId if needed
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);