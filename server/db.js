const { Pool, types } = require("pg");
const { DATABASE_URL, DATABASE_SSL } = require("./config");

// NUMERIC arrives as a string by default; coupon values are small, so a float is exact enough.
types.setTypeParser(1700, (value) => parseFloat(value));

module.exports = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false,
});
