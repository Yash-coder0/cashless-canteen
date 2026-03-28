// server/server.js  (UPDATED VERSION — replaces your existing server.js)
// ============================================================
// Changes from Week 2 version:
//   - Creaver explicitly (needed for Socket.io)
//   - Initialises Socket.tes an HTTP serio and attaches to the server
//   - Stores io instance on app so controllers can emit events
// ============================================================

require("dotenv").config();

const http = require("http");             // ← NEW
const validateEnv = require("./config/env");
const connectDB = require("./config/db");
const app = require("./app");
const initSocket = require("./utils/socket"); // ← NEW

// 1. Validate env vars
validateEnv();

// 2. Connect to MongoDB
connectDB();

// 3. Create HTTP server (wraps Express app)
const server = http.createServer(app);    // ← NEW

// 4. Initialise Socket.io (attaches to the HTTP server)
const io = initSocket(server);            // ← NEW

// 5. Make io accessible in controllers via req.app.get("io")
app.set("io", io);                        // ← NEW

// 6. Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {              // ← Changed app.listen → server.listen
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Socket.io: enabled ✅`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  console.error("🔥 Unhandled Promise Rejection:", err.message);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err.message);
  process.exit(1);
});
