// server/middleware/errorHandler.js
// ============================================================
// GLOBAL ERROR HANDLER
// All errors thrown anywhere in the app flow here.
// Never send raw error objects to the client — always shape
// the response with a consistent structure.
//
// Response format (always):
// {
//   success: false,
//   message: "Human-readable message",
//   errors: [...] (optional, for validation errors)
// }
// ============================================================

// ─────────────────────────────────────────────
// Custom error class — use this throughout the app
// to throw errors with HTTP status codes attached.
//
// Usage:
//   throw new AppError("User not found", 404);
//   throw new AppError("Insufficient wallet balance", 400);
// ─────────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks errors we intentionally throw (vs bugs)
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────
// Helper: shape specific Mongoose/JWT errors
// into friendly messages before sending to client
// ─────────────────────────────────────────────
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(
    `'${value}' is already registered. Please use a different ${field}.`,
    409
  );
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join(". ")}`, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your session has expired. Please log in again.", 401);

// ─────────────────────────────────────────────
// Main error handler middleware
// Must have exactly 4 params for Express to treat it as error handler
// ─────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // ── Shape known error types ──────────────────
  if (err.name === "CastError") error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === "ValidationError") error = handleValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  // ── Log unexpected bugs (not operational errors) ─
  if (!err.isOperational) {
    console.error("🐛 Unexpected Error:", err);
  }

  // ── Always send consistent JSON response ────────
  res.status(error.statusCode).json({
    success: false,
    message: error.message || "Something went wrong. Please try again.",
    // Only show stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { errorHandler, AppError };
