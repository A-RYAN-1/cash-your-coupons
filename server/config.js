require("dotenv").config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name} (see server/.env.example)`);
  }
  return value;
}

const JWT_SECRET = required("JWT_SECRET");
if (JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}

module.exports = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  PORT: Number(process.env.PORT) || 5000,
  // Comma-separated browser origins allowed to call the API.
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:8081")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  DATABASE_SSL: process.env.DATABASE_SSL === "true",
};
