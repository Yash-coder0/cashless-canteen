// server/routes/authRoutes.js
// ============================================================
// AUTH ROUTES
// Mounted at /api/auth in app.js
// ============================================================

const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout,
  createStaff,
  changePassword,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const { protect, authorize } = require("../middleware/auth");

// ── Public routes (no token needed) ──────────────────────────
router.post("/register", register);       // Student self-registration
router.post("/login", login);             // All roles login here
router.get("/verify-email", verifyEmail); // Email verification using ?token=
router.post("/forgot-password", forgotPassword); // Request password reset
router.post("/reset-password/:token", resetPassword); // Reset password using token

// ── Protected routes (valid JWT required) ────────────────────
router.get("/me", protect, getMe);                        // Get own profile
router.post("/logout", protect, logout);                  // Logout
router.patch("/change-password", protect, changePassword); // Change password

// ── Admin-only routes ─────────────────────────────────────────
router.post(
  "/create-staff",
  protect,
  authorize("admin"),   // Only admins can create staff accounts
  createStaff
);

module.exports = router;
