// Applies database.sql (idempotent). Run: npm run migrate
const fs = require("fs");
const path = require("path");
const pool = require("./db");

(async () => {
  await pool.query(fs.readFileSync(path.join(__dirname, "database.sql"), "utf8"));
  console.log("migrations applied");
  await pool.end();
})().catch((err) => {
  console.error("migration failed:", err.message);
  process.exit(1);
});
