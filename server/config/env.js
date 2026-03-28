// server/config/env.js
// ============================================================
// ENVIRONMENT VARIABLE VALIDATION
// Crashes the server on startup if required vars are missing.
// Catching this early prevents mysterious runtime failures.
// ============================================================

const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CLIENT_URL",
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   → ${key}`));
    process.exit(1); // Kill the server — do not start with broken config
  }

  console.log("✅ Environment variables validated");
};

module.exports = validateEnv;
