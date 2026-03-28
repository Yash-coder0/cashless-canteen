// server/config/db.js
// ============================================================
// MONGODB CONNECTION
// Single connection shared across the entire app.
// Mongoose handles connection pooling automatically.
// ============================================================

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options prevent deprecation warnings and
      // ensure stable behaviour across mongoose versions
      serverSelectionTimeoutMS: 5000, // Fail fast if Atlas is unreachable
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // ── Connection event listeners ──────────────────────
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected — retrying...");
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // Exit process — app cannot run without DB
  }
};

module.exports = connectDB;
