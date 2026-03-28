// server/app.js — FINAL COMPLETE VERSION (replaces all previous versions)
require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 200 }));
app.use("/api/auth", rateLimit({ windowMs: 15*60*1000, max: 20,
  message: { success: false, message: "Too many requests. Try again in 15 minutes." } }));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ── Health check ──────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ success: true, message: "Cashless Canteen API running", timestamp: new Date() }));

// ── Route imports ─────────────────────────────────────────────
const authRoutes         = require("./routes/authRoutes");
const { categoryRouter, menuRouter } = require("./routes/menuRoutes");
const cartRoutes         = require("./routes/cartRoutes");
const { walletRouter, orderRouter }  = require("./routes/walletOrderRoutes");
const { kitchenRouter, adminRouter, reviewRouter, notifRouter } = require("./routes/allRoutes");

// ── Mount routes ──────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/categories",    categoryRouter);
app.use("/api/menu",          menuRouter);
app.use("/api/cart",          cartRoutes);
app.use("/api/wallet",        walletRouter);
app.use("/api/orders",        orderRouter);
app.use("/api/kitchen",       kitchenRouter);
app.use("/api/admin",         adminRouter);
app.use("/api/reviews",       reviewRouter);
app.use("/api/notifications", notifRouter);

// ── 404 + Error handler ───────────────────────────────────────
app.all("*", (req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` }));
app.use(errorHandler);

module.exports = app;
