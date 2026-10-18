const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("./db");
const { JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGINS } = require("./config");
const {
  CATEGORIES,
  validateCredentials,
  validateCoupon,
  validateProfile,
  parseId,
} = require("./validation");
const logger = require("./logger");

const COUPON_COLUMNS = "id, seller_id, name, value, details, category, expiry_date, created_at";
const PROFILE_COLUMNS = "id, email, name, gender, age, phone, address, dob";

// The shape the app already used for a listing, minus the seller's email.
const toCoupon = (row) => ({
  id: row.id,
  sellerId: row.seller_id,
  name: row.name,
  value: row.value,
  details: row.details,
  category: row.category,
  expiryDate: row.expiry_date,
  createdAt: row.created_at,
});

const toPurchase = (row) => ({
  id: row.id,
  couponId: row.coupon_id,
  couponName: row.coupon_name,
  couponValue: row.coupon_value,
  createdAt: row.created_at,
});

function createApp({ authLimit = 20 } = {}) {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: CORS_ORIGINS }));
  app.use(express.json({ limit: "50kb" }));

  // Request id on every request and one log line per response.
  app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.id);
    const start = Date.now();
    res.on("finish", () => {
      if (req.path === "/health") return;
      logger.info("request", {
        id: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - start,
      });
    });
    next();
  });

  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authLimit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts, try again in a few minutes" },
  });

  const fail = (res, status, error) => res.status(status).json({ error });

  const serverError = (req, res, err, what) => {
    logger.error(what, { id: req.id, message: err.message, code: err.code });
    return fail(res, 500, "Server error");
  };

  const authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return fail(res, 401, "Access denied");
    jwt.verify(header.replace(/^Bearer\s+/i, ""), JWT_SECRET, (err, payload) => {
      if (err) return fail(res, 401, "Invalid or expired token");
      req.user = { id: payload.id };
      next();
    });
  };

  const issueToken = (userId) =>
    jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  app.get("/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok" });
    } catch (err) {
      logger.error("health check failed", { message: err.message });
      res.status(503).json({ status: "database unavailable" });
    }
  });

  app.get("/categories", (req, res) => res.json(CATEGORIES));

  app.post("/auth/register", authRateLimit, async (req, res) => {
    const { error, email, password } = validateCredentials(req.body);
    if (error) return fail(res, 400, error);
    try {
      const hashed = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING ${PROFILE_COLUMNS}`,
        [email, hashed]
      );
      const user = result.rows[0];
      res.status(201).json({ token: issueToken(user.id), user });
    } catch (err) {
      if (err.code === "23505") return fail(res, 409, "An account with this email already exists");
      return serverError(req, res, err, "register failed");
    }
  });

  app.post("/auth/login", authRateLimit, async (req, res) => {
    const { error, email, password } = validateCredentials(req.body, { strictPassword: false });
    if (error) return fail(res, 400, error);
    try {
      const result = await pool.query(
        `SELECT password, ${PROFILE_COLUMNS} FROM users WHERE email = $1`,
        [email]
      );
      const { password: hash, ...user } = result.rows[0] || {};
      if (!hash || !(await bcrypt.compare(password, hash))) {
        return fail(res, 401, "Invalid email or password");
      }
      res.json({ token: issueToken(user.id), user });
    } catch (err) {
      return serverError(req, res, err, "login failed");
    }
  });

  app.get("/me", authenticate, async (req, res) => {
    try {
      const result = await pool.query(`SELECT ${PROFILE_COLUMNS} FROM users WHERE id = $1`, [
        req.user.id,
      ]);
      if (result.rows.length === 0) return fail(res, 401, "Invalid or expired token");
      res.json(result.rows[0]);
    } catch (err) {
      return serverError(req, res, err, "load profile failed");
    }
  });

  app.put("/me", authenticate, async (req, res) => {
    const { error, value } = validateProfile(req.body);
    if (error) return fail(res, 400, error);
    try {
      const result = await pool.query(
        `UPDATE users SET name = $2, gender = $3, age = $4, phone = $5, address = $6, dob = $7
         WHERE id = $1 RETURNING ${PROFILE_COLUMNS}`,
        [req.user.id, value.name, value.gender, value.age, value.phone, value.address, value.dob]
      );
      if (result.rows.length === 0) return fail(res, 401, "Invalid or expired token");
      res.json(result.rows[0]);
    } catch (err) {
      return serverError(req, res, err, "save profile failed");
    }
  });

  // Other people's open, unexpired listings, soonest expiry first. With category and/or value
  // given, a listing matches when it has that category OR that value (the Exchange search).
  app.get("/coupons", authenticate, async (req, res) => {
    const { category, value } = req.query;
    const filters = [];
    const params = [req.user.id];
    if (category !== undefined) {
      if (typeof category !== "string") return fail(res, 400, "Invalid category");
      params.push(category.trim());
      filters.push(`lower(category) = lower($${params.length})`);
    }
    if (value !== undefined) {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) return fail(res, 400, "Invalid value");
      params.push(number);
      filters.push(`value = $${params.length}`);
    }
    const match = filters.length > 0 ? `AND (${filters.join(" OR ")})` : "";
    try {
      const result = await pool.query(
        `SELECT ${COUPON_COLUMNS} FROM coupons
         WHERE status = 'listed' AND seller_id <> $1 AND expiry_date > now() ${match}
         ORDER BY expiry_date ASC, id ASC LIMIT 200`,
        params
      );
      res.json(result.rows.map(toCoupon));
    } catch (err) {
      return serverError(req, res, err, "list coupons failed");
    }
  });

  app.get("/coupons/mine", authenticate, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT ${COUPON_COLUMNS} FROM coupons
         WHERE seller_id = $1 AND status = 'listed' ORDER BY created_at DESC, id ASC`,
        [req.user.id]
      );
      res.json(result.rows.map(toCoupon));
    } catch (err) {
      return serverError(req, res, err, "list own coupons failed");
    }
  });

  app.post("/coupons", authenticate, async (req, res) => {
    const { error, value } = validateCoupon(req.body);
    if (error) return fail(res, 400, error);
    try {
      const result = await pool.query(
        `INSERT INTO coupons (seller_id, name, value, details, category, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COUPON_COLUMNS}`,
        [req.user.id, value.name, value.value, value.details, value.category, value.expiryDate]
      );
      res.status(201).json(toCoupon(result.rows[0]));
    } catch (err) {
      return serverError(req, res, err, "create coupon failed");
    }
  });

  // Withdraw: the seller takes a listing off sale. It stays in the table as 'withdrawn'.
  app.delete("/coupons/:id", authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, "Invalid coupon id");
    try {
      const result = await pool.query(
        `UPDATE coupons SET status = 'withdrawn'
         WHERE id = $1 AND seller_id = $2 AND status = 'listed'`,
        [id, req.user.id]
      );
      if (result.rowCount === 0) return fail(res, 404, "Listing not found or already sold");
      res.status(204).end();
    } catch (err) {
      return serverError(req, res, err, "withdraw coupon failed");
    }
  });

  // Buy: lock the row, check it, mark it sold and record the purchase in one transaction,
  // so two buyers cannot both get the same coupon.
  app.post("/coupons/:id/buy", authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, "Invalid coupon id");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const found = await client.query(
        "SELECT seller_id, name, value, status, expiry_date FROM coupons WHERE id = $1 FOR UPDATE",
        [id]
      );
      const coupon = found.rows[0];
      let problem = null;
      if (!coupon || coupon.status !== "listed") problem = [404, "Coupon is no longer available"];
      else if (coupon.seller_id === req.user.id) problem = [403, "You cannot buy your own coupon"];
      else if (new Date(coupon.expiry_date) <= new Date())
        problem = [409, "This coupon has expired"];
      if (problem) {
        await client.query("ROLLBACK");
        return fail(res, problem[0], problem[1]);
      }
      await client.query("UPDATE coupons SET status = 'sold' WHERE id = $1", [id]);
      const purchase = await client.query(
        `INSERT INTO purchases (coupon_id, buyer_id, seller_id, coupon_name, coupon_value)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, coupon_id, coupon_name, coupon_value, created_at`,
        [id, req.user.id, coupon.seller_id, coupon.name, coupon.value]
      );
      await client.query("COMMIT");
      res.status(201).json(toPurchase(purchase.rows[0]));
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      return serverError(req, res, err, "buy coupon failed");
    } finally {
      client.release();
    }
  });

  app.get("/purchases", authenticate, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, coupon_id, coupon_name, coupon_value, created_at FROM purchases
         WHERE buyer_id = $1 ORDER BY created_at DESC, id ASC`,
        [req.user.id]
      );
      res.json(result.rows.map(toPurchase));
    } catch (err) {
      return serverError(req, res, err, "list purchases failed");
    }
  });

  app.use((req, res) => fail(res, 404, "Not found"));

  // Malformed JSON and oversized bodies end up here; never leak a stack trace.
  app.use((err, req, res, _next) => {
    if (err.type === "entity.parse.failed") return fail(res, 400, "Invalid JSON");
    if (err.type === "entity.too.large") return fail(res, 413, "Request body too large");
    return serverError(req, res, err, "unhandled error");
  });

  return app;
}

module.exports = { createApp };
