// server/utils/razorpay.js
// ============================================================
// RAZORPAY UTILITY
// Single place to initialise the Razorpay SDK and expose
// helper functions used by the wallet controller.
//
// Test credentials are safe to use freely — no real money moves.
// Switch to live keys only when going to production.
// ============================================================

const Razorpay = require("razorpay");
const crypto = require("crypto");
const { AppError } = require("../middleware/errorHandler");

// ── Initialise once, reuse everywhere ─────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────
// Create a Razorpay order
// This is step 1 of the payment flow.
// amount must be in PAISE (₹1 = 100 paise)
// ─────────────────────────────────────────────
const createRazorpayOrder = async (amountInPaise, receipt, notes = {}) => {
  if (amountInPaise < 100) {
    throw new AppError("Minimum top-up amount is ₹1.", 400);
  }

  if (amountInPaise > 10000000) {
    // ₹1,00,000 max (Razorpay limit per transaction)
    throw new AppError("Maximum top-up amount is ₹1,00,000.", 400);
  }

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt,           // Your internal reference (e.g. wallet transaction ID)
    notes,             // Metadata stored on Razorpay dashboard
  });

  return order;
};

// ─────────────────────────────────────────────
// Verify Razorpay payment signature
// This is step 3 — after the student completes payment
// in the Razorpay popup, the frontend sends back these
// 3 values. We verify them cryptographically to confirm
// the payment is genuine and not tampered with.
//
// Returns true if valid, throws AppError if invalid.
// ─────────────────────────────────────────────
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const isValid = expectedSignature === razorpaySignature;

  if (!isValid) {
    throw new AppError(
      "Payment verification failed. If money was deducted, it will be refunded within 5-7 business days.",
      400
    );
  }

  return true;
};

module.exports = { razorpay, createRazorpayOrder, verifyPaymentSignature };
