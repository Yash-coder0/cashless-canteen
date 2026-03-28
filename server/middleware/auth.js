// server/middleware/auth.js
// ============================================================
// AUTH MIDDLEWARE
// Two key jobs:
//   1. protect()  — verify JWT, attach user to req.user
//   2. authorize() — check if user has the required role(s)
//
// Usage in routes:
//   router.get('/profile',  protect, getProfile)
//   router.post('/items',   protect, authorize('admin'), createItem)
//   router.patch('/status', protect, authorize('kitchen', 'admin'), updateStatus)
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("./errorHandler");

// ─────────────────────────────────────────────
// HELPER — Extract and verify token from header
// ─────────────────────────────────────────────
const extractToken = (req) => {
  // Check Authorization header: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

// ─────────────────────────────────────────────
// protect — verifies JWT token and attaches the
// decoded user to req.user for downstream use.
// ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    // 1. Extract token
    const token = extractToken(req);
    if (!token) {
      throw new AppError(
        "You are not logged in. Please log in to access this route.",
        401
      );
    }

    // 2. Verify token (throws if expired or tampered)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check user still exists in DB
    // (Handles edge case: user was deleted after token was issued)
    const user = await User.findById(decoded.id).select(
      "+isActive +role +name +email +collegeId +avatar"
    );

    if (!user) {
      throw new AppError(
        "The user belonging to this token no longer exists.",
        401
      );
    }

    // 4. Check user account is active
    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Please contact the canteen admin.",
        403
      );
    }

    // 5. Attach user to request — available in all downstream handlers
    req.user = user;

    // 6. Update last login timestamp (fire and forget — don't await)
    User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

    next();
  } catch (error) {
    next(error); // Passes to global error handler
  }
};

// ─────────────────────────────────────────────
// authorize — role-based access control guard.
// Must be used AFTER protect (needs req.user).
//
// Usage:
//   authorize('admin')               → admin only
//   authorize('kitchen', 'admin')    → kitchen or admin
// ─────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This route is restricted to: ${roles.join(", ")}.`,
          403
        )
      );
    }
    next();
  };
};

// ─────────────────────────────────────────────
// optionalAuth — attaches user if token exists
// but does NOT block the request if no token.
// Used for routes that behave differently when
// logged in (e.g. showing favourites on menu).
// ─────────────────────────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {
    // Silently ignore invalid tokens in optional auth
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };
