// server/controllers/authController.js
// ============================================================
// AUTH CONTROLLER
// Handles all authentication logic for all 3 roles.
//
// Public routes:    register (students only), login
// Protected routes: getMe, logout
// Admin-only:       createStaff (creates kitchen/admin accounts)
// ============================================================

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { Wallet } = require("../models/Wallet");
const { AppError } = require("../middleware/errorHandler");

// ─────────────────────────────────────────────
// HELPER — Generate JWT token
// ─────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ─────────────────────────────────────────────
// HELPER — Send token response (consistent shape)
// ─────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Strip sensitive fields before sending user object
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    collegeId: user.collegeId,
    avatar: user.avatar,
    phone: user.phone,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userResponse,
  });
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public (students only)
// @desc    Register a new student account + auto-create wallet
// ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, collegeId, phone } = req.body;

    // ── Validate required fields ──────────────
    if (!name || !email || !password || !collegeId) {
      throw new AppError(
        "Please provide name, email, password, and college ID.",
        400
      );
    }

    // ── Check college email domain ────────────
    // Also enforced in schema, but double-checking here gives a cleaner error message
    const allowedDomain = process.env.COLLEGE_EMAIL_DOMAIN || "college.edu.in";
    if (!email.toLowerCase().endsWith(`@${allowedDomain}`)) {
      throw new AppError(
        `Only ${allowedDomain} email addresses are allowed to register.`,
        400
      );
    }

    // ── Check for existing user ───────────────
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError(
        "An account with this email already exists. Please log in.",
        409
      );
    }

    // ── Create user (password hashed by schema pre-save hook) ─
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      collegeId: collegeId.trim().toUpperCase(),
      phone: phone?.trim() || undefined,
      role: "student", // ❗ ALWAYS hardcoded — never trust client input for role
      isEmailVerified: true,
    });

    // ── Auto-create wallet for new student ───
    // Every student gets a wallet on signup — balance starts at 0
    await Wallet.create({
      userId: user._id,
      balance: 0,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public (all roles)
// @desc    Login with email + password, returns JWT
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Validate input ────────────────────────
    if (!email || !password) {
      throw new AppError("Please provide your email and password.", 400);
    }

    // ── Find user (include password for comparison) ─
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +isActive"
    );

    // ── Intentionally vague error (security best practice) ──
    // Don't tell attacker whether the email exists or the password is wrong.
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError("Incorrect email or password.", 401);
    }

    // ── Check account email verification ─────
    // if (user.isEmailVerified === false) {
    //   throw new AppError("Please verify your email before logging in. Check your inbox.", 403);
    // }

    // ── Check account status ──────────────────
    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Please contact the canteen admin.",
        403
      );
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Protected (all roles)
// @desc    Get current logged-in user's profile
// ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is already attached by protect middleware
    // Fetch fresh from DB to get latest data, populate wallet for students
    const user = await User.findById(req.user._id).populate({
      path: "wallet",
      select: "balance totalCredited totalDebited isActive",
    });

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        avatar: user.avatar,
        phone: user.phone,
        favourites: user.favourites,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        // Wallet is only relevant for students
        wallet: user.role === "student" ? user.wallet : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/logout
// @access  Protected (all roles)
// @desc    Logout (client deletes token; server logs event)
// ─────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // JWT is stateless — we can't invalidate it server-side without a blocklist.
    // For this project, the client simply deletes the token from localStorage.
    // If you want server-side logout later, implement a token blocklist in Redis.

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/create-staff
// @access  Admin only
// @desc    Admin creates kitchen worker or admin accounts.
//          Staff cannot self-register — this is intentional.
// ─────────────────────────────────────────────
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // ── Validate ──────────────────────────────
    if (!name || !email || !password || !role) {
      throw new AppError("Please provide name, email, password, and role.", 400);
    }

    // ── Ensure role is valid for staff creation ─
    const allowedRoles = ["kitchen", "admin"];
    if (!allowedRoles.includes(role)) {
      throw new AppError(
        `Invalid role. Staff role must be 'kitchen' or 'admin'.`,
        400
      );
    }

    // ── Check duplicate ───────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError(
        `An account with email '${email}' already exists.`,
        409
      );
    }

    // ── Create staff account ──────────────────
    const staff = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role, // trusted here because route is admin-only
      phone: phone?.trim() || undefined,
      isEmailVerified: true, // Admin-created accounts skip email verification
    });

    // ── No wallet for kitchen/admin staff ─────
    // Only students need wallets

    res.status(201).json({
      success: true,
      message: `${role === "kitchen" ? "Kitchen staff" : "Admin"} account created successfully.`,
      user: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        createdAt: staff.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/auth/change-password
// @access  Protected (all roles)
// @desc    Change password (requires current password)
// ─────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(
        "Please provide your current password and new password.",
        400
      );
    }

    if (newPassword.length < 8) {
      throw new AppError("New password must be at least 8 characters.", 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError(
        "New password cannot be the same as the current password.",
        400
      );
    }

    // Fetch with password field (excluded by default)
    const user = await User.findById(req.user._id).select("+password");

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError("Your current password is incorrect.", 401);
    }

    // Assign and save — pre-save hook will re-hash automatically
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/auth/verify-email
// @access  Public
// @desc    Verify student's email using token
// ─────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) throw new AppError("Verification token is missing.", 400);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("Token is invalid or has expired. Please register again if your account was not activated.", 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email successfully verified. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  createStaff,
  changePassword,
  verifyEmail,
};
