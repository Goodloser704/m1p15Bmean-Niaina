const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  mongodbUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:4200"
};

// Log des variables d'environnement importantes (sans secrets)
console.log("🔧 Configuration:");
console.log("  PORT:", process.env.PORT || 3000);
console.log("  CORS_ORIGIN:", process.env.CORS_ORIGIN || "http://localhost:4200");
console.log("  NODE_ENV:", process.env.NODE_ENV || "development");

