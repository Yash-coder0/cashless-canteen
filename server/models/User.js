// server/models/User.js
// ============================================================
// USER MODEL — covers all 3 roles: student, kitchen, admin
// Role-based access is handled in middleware, not here.
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      // ✅ Only allow college domain emails (change 'college.edu.in' to your domain)
      match: [
        /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
        "Only college email addresses are allowed",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // ❗ Never return password in queries by default
    },

    role: {
      type: String,
      enum: {
        values: ["student", "kitchen", "admin"],
        message: "Role must be student, kitchen, or admin",
      },
      default: "student",
    },

    collegeId: {
      type: String,
      trim: true,
      // Required only for students — validated at controller level
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"],
    },

    // Cloudinary URL for profile picture
    avatar: {
      type: String,
      default: null,
    },

    // Array of MenuItem ObjectIds — student's saved favourites
    favourites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
      },
    ],

    // For push notifications (Firebase Cloud Messaging token)
    fcmToken: {
      type: String,
      default: null,
      select: false, // Internal use only
    },

    isActive: {
      type: Boolean,
      default: true, // Admin can deactivate accounts
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Used for email verification & password reset flows
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpiry: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    passwordResetExpires: { type: Date, default: null },

    // Track last login for analytics
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────
// userSchema.index({ email: 1 });           // Fast login lookup (Already defined by unique: true)
userSchema.index({ role: 1 });            // Admin listing by role
userSchema.index({ collegeId: 1 });       // College ID lookup

// ─────────────────────────────────────────────
// MIDDLEWARE — Hash password before saving
// ─────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  // Only hash if password was modified (prevents re-hashing on profile update)
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─────────────────────────────────────────────
// INSTANCE METHODS
// ─────────────────────────────────────────────

// Compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─────────────────────────────────────────────
// VIRTUAL — Wallet (populated separately, not embedded)
// ─────────────────────────────────────────────
userSchema.virtual("wallet", {
  ref: "Wallet",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});

module.exports = mongoose.model("User", userSchema);
