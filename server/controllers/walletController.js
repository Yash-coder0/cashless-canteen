// server/controllers/walletController.js
// ============================================================
// WALLET CONTROLLER
//
// The Razorpay top-up flow has 3 steps:
//
//  STEP 1 — POST /api/wallet/topup/initiate
//    Student says "I want to add ₹200"
//    → We create a Razorpay order and return the order ID
//    → We pre-create a WalletTransaction with status "pending"
//
//  STEP 2 — (Frontend)
//    Student sees the Razorpay payment popup
//    Student completes payment (UPI, card, netbanking, etc.)
//    Razorpay returns: razorpayOrderId, razorpayPaymentId, razorpaySignature
//
//  STEP 3 — POST /api/wallet/topup/verify
//    We verify the signature cryptographically
//    → If valid: credit wallet, mark transaction "completed"
//    → If invalid: mark transaction "failed", throw error
//
// ❗ ATOMIC WALLET UPDATES
//    Always use $inc to update balance — never read-then-write.
//    Read-then-write: read balance (₹100), add ₹200, write ₹300
//    Race condition: two requests both read ₹100 → both write ₹300 (₹200 lost!)
//    $inc: MongoDB increments atomically — race condition impossible.
// ============================================================

const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { createRazorpayOrder, verifyPaymentSignature } = require("../utils/razorpay");
const { AppError } = require("../middleware/errorHandler");

// Re-export model cleanly if needed
const WalletModel = Wallet.Wallet || Wallet;
const WalletTxModel = WalletTransaction.WalletTransaction || WalletTransaction;

// ─────────────────────────────────────────────
// @route   GET /api/wallet
// @access  Student only
// @desc    Get wallet balance + summary
// ─────────────────────────────────────────────
const getWallet = async (req, res, next) => {
  try {
    const wallet = await WalletModel.findOne({ userId: req.user._id });

    if (!wallet) {
      throw new AppError("Wallet not found. Please contact support.", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: wallet._id,
        balance: wallet.balance / 100,               // ₹ for display
        balanceInPaise: wallet.balance,
        totalCredited: wallet.totalCredited / 100,
        totalDebited: wallet.totalDebited / 100,
        isActive: wallet.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/wallet/transactions
// @access  Student only
// @desc    Paginated transaction history
//          (most recent first)
// ─────────────────────────────────────────────
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId: req.user._id };
    if (type && ["credit", "debit", "refund"].includes(type)) {
      filter.type = type;
    }

    const [transactions, total] = await Promise.all([
      WalletTxModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("orderId", "orderNumber status")
        .lean(),
      WalletTxModel.countDocuments(filter),
    ]);

    // Format amounts to rupees for display
    const formatted = transactions.map((tx) => ({
      ...tx,
      amount: tx.amount / 100,
      balanceAfter: tx.balanceAfter / 100,
    }));

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/wallet/topup/initiate
// @access  Student only
// @desc    STEP 1 — Create Razorpay order for wallet top-up
// Body: { amount: 200 }  (in rupees — user types ₹200)
// ─────────────────────────────────────────────
const initiateTopUp = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      throw new AppError("Please provide a valid amount.", 400);
    }

    const amountInRupees = parseFloat(amount);
    if (amountInRupees < 10) {
      throw new AppError("Minimum top-up amount is ₹10.", 400);
    }
    if (amountInRupees > 5000) {
      throw new AppError("Maximum top-up amount per transaction is ₹5,000.", 400);
    }

    const amountInPaise = Math.round(amountInRupees * 100);

    // Get wallet to have the ID for the receipt
    const wallet = await WalletModel.findOne({ userId: req.user._id });
    if (!wallet) throw new AppError("Wallet not found.", 404);
    if (!wallet.isActive) {
      throw new AppError("Your wallet is frozen. Please contact the canteen admin.", 403);
    }

    // Pre-create a PENDING transaction — gives us an ID for the Razorpay receipt
    const transaction = await WalletTxModel.create({
      walletId: wallet._id,
      userId: req.user._id,
      type: "credit",
      amount: amountInPaise,
      description: `Wallet top-up of ₹${amountInRupees}`,
      status: "pending",
      balanceAfter: wallet.balance + amountInPaise, // Optimistic — updated on verify
    });

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder(
      amountInPaise,
      transaction._id.toString(), // receipt = our transaction ID
      {
        userId: req.user._id.toString(),
        walletId: wallet._id.toString(),
        transactionId: transaction._id.toString(),
      }
    );

    // Store razorpay order ID on our transaction
    await WalletTxModel.findByIdAndUpdate(transaction._id, {
      razorpayOrderId: razorpayOrder.id,
    });

    // Return everything the frontend Razorpay SDK needs
    res.status(200).json({
      success: true,
      data: {
        transactionId: transaction._id,     // Our internal reference
        razorpayOrderId: razorpayOrder.id,  // Pass to Razorpay SDK
        amount: amountInRupees,
        amountInPaise,
        currency: "INR",
        // Frontend needs these to initialise the Razorpay checkout widget
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        prefill: {
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/wallet/topup/verify
// @access  Student only
// @desc    STEP 3 — Verify Razorpay payment and credit wallet
// Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, transactionId }
// ─────────────────────────────────────────────
const verifyTopUp = async (req, res, next) => {
  // Use a MongoDB session for atomicity —
  // if anything fails, the wallet credit is rolled back automatically
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      transactionId,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !transactionId) {
      throw new AppError("Missing payment verification fields.", 400);
    }

    // ── Verify signature (throws if invalid) ──
    verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    // ── Find our pending transaction ──────────
    const transaction = await WalletTxModel.findOne({
      _id: transactionId,
      userId: req.user._id,
      status: "pending",
      type: "credit",
    }).session(session);

    if (!transaction) {
      throw new AppError(
        "Transaction not found or already processed. Please contact support if money was deducted.",
        404
      );
    }

    // ── Credit wallet atomically ──────────────
    const updatedWallet = await WalletModel.findOneAndUpdate(
      { userId: req.user._id, isActive: true },
      {
        $inc: {
          balance: transaction.amount,
          totalCredited: transaction.amount,
        },
      },
      { new: true, session }
    );

    if (!updatedWallet) {
      throw new AppError("Wallet update failed. Please contact support.", 500);
    }

    // ── Mark transaction as completed ─────────
    await WalletTxModel.findByIdAndUpdate(
      transactionId,
      {
        status: "completed",
        razorpayOrderId,
        razorpayPaymentId,
        balanceAfter: updatedWallet.balance, // Actual balance after credit
      },
      { session }
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `₹${transaction.amount / 100} added to your wallet successfully!`,
      data: {
        newBalance: updatedWallet.balance / 100,
        newBalanceInPaise: updatedWallet.balance,
        amountCredited: transaction.amount / 100,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/wallet/spending-analytics
// @access  Student only
// @desc    Weekly / monthly / yearly spending totals
//          Used for the student spending chart feature
// ─────────────────────────────────────────────
const getSpendingAnalytics = async (req, res, next) => {
  try {
    const { period = "monthly" } = req.query; // weekly | monthly | yearly

    // Date range based on period
    const now = new Date();
    let startDate;
    let groupFormat;

    if (period === "weekly") {
      // Last 7 days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else if (period === "yearly") {
      // Last 12 months
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else {
      // Default: monthly — last 30 days grouped by day
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    const analytics = await WalletTxModel.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: "debit",
          status: "completed",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupFormat,
          totalSpent: { $sum: "$amount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Convert paise → rupees
    const formatted = analytics.map((entry) => ({
      date: entry._id,
      totalSpent: entry.totalSpent / 100,
      orderCount: entry.orderCount,
    }));

    res.status(200).json({
      success: true,
      period,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWallet,
  getTransactions,
  initiateTopUp,
  verifyTopUp,
  getSpendingAnalytics,
};
