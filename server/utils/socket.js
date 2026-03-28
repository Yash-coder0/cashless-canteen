// server/utils/socket.js
// ============================================================
// SOCKET.IO SETUP
// Handles real-time communication between:
//   - Kitchen panel (receives new orders, cancellations)
//   - Student (receives order status updates)
//
// Room strategy:
//   "kitchen"      → all kitchen staff and admins join this room
//   "user_<userId>" → each student joins their personal room
//
// This way we can notify a specific student without broadcasting
// to everyone, and notify all kitchen staff at once.
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const initSocket = (server) => {
  const { Server } = require("socket.io");

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ── Auth middleware for Socket.io ───────────────────────────
  // Every socket connection must send a valid JWT in the handshake.
  // This prevents unauthenticated clients from connecting.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token required."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name role isActive");

      if (!user || !user.isActive) {
        return next(new Error("User not found or inactive."));
      }

      // Attach user to socket for use in event handlers
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired token."));
    }
  });

  // ── Connection handler ────────────────────────────────────
  io.on("connection", (socket) => {
    const { user } = socket;
    console.log(`🔌 Socket connected: ${user.name} (${user.role}) — ${socket.id}`);

    // ── Room assignment based on role ─────────────────────
    if (user.role === "kitchen" || user.role === "admin") {
      socket.join("kitchen");
      console.log(`   → Joined room: kitchen`);
    }

    if (user.role === "student") {
      // Each student gets a private room for their order updates
      socket.join(`user_${user._id}`);
      console.log(`   → Joined room: user_${user._id}`);
    }

    // ── Ping/pong for connection health check ──────────────
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    // ── Kitchen: acknowledge they received an order ────────
    socket.on("order_acknowledged", ({ orderId }) => {
      console.log(`Kitchen acknowledged order: ${orderId}`);
      // Could be used to show "seen" status on student side
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${user.name} — ${reason}`);
    });
  });

  return io;
};

module.exports = initSocket;
