// Exchange offers: one user offers a listed coupon of theirs for another user's listed coupon.
// The owner accepts or declines, the offerer can cancel. Accepting swaps both coupons in one
// transaction. Lock order everywhere is coupons first (by id), then exchange rows, so buying,
// withdrawing and accepting can never deadlock.
const pool = require("./db");
const { parseId } = require("./validation");

const EXCHANGE_SELECT = `
  SELECT e.id, e.status, e.created_at, e.resolved_at, e.offerer_id, e.owner_id,
         o.id AS offered_id, o.name AS offered_name, o.value AS offered_value,
         r.id AS requested_id, r.name AS requested_name, r.value AS requested_value
  FROM exchanges e
  JOIN coupons o ON o.id = e.offered_coupon_id
  JOIN coupons r ON r.id = e.requested_coupon_id`;

const toExchange = (row, userId) => ({
  id: row.id,
  status: row.status,
  role: row.offerer_id === userId ? "offered" : "received",
  offered: { id: row.offered_id, name: row.offered_name, value: row.offered_value },
  requested: { id: row.requested_id, name: row.requested_name, value: row.requested_value },
  createdAt: row.created_at,
  resolvedAt: row.resolved_at,
});

// Closes every pending offer that involves a coupon that just left the market. `db` is a
// pool or a client, so callers can run it inside their own transaction.
const cancelOffersOn = (db, couponIds) =>
  db.query(
    `UPDATE exchanges SET status = 'cancelled', resolved_at = now()
     WHERE status = 'pending' AND (offered_coupon_id = ANY($1) OR requested_coupon_id = ANY($1))`,
    [couponIds]
  );

const isExpired = (coupon) => new Date(coupon.expiry_date) <= new Date();

function registerExchangeRoutes(app, { authenticate, fail, serverError }) {
  const loadOne = async (db, id, userId) => {
    const result = await db.query(`${EXCHANGE_SELECT} WHERE e.id = $1`, [id]);
    return toExchange(result.rows[0], userId);
  };

  app.get("/exchanges", authenticate, async (req, res) => {
    try {
      const result = await pool.query(
        `${EXCHANGE_SELECT} WHERE e.offerer_id = $1 OR e.owner_id = $1
         ORDER BY (e.status = 'pending') DESC, e.created_at DESC, e.id ASC LIMIT 100`,
        [req.user.id]
      );
      res.json(result.rows.map((row) => toExchange(row, req.user.id)));
    } catch (err) {
      return serverError(req, res, err, "list exchanges failed");
    }
  });

  app.post("/exchanges", authenticate, async (req, res) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const offeredId = parseId(body.offeredCouponId);
    const requestedId = parseId(body.requestedCouponId);
    if (!offeredId || !requestedId) {
      return fail(res, 400, "Choose a coupon to offer and a coupon to ask for");
    }
    if (offeredId === requestedId) {
      return fail(res, 400, "Offer a different coupon from the one you ask for");
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // FOR SHARE keeps a concurrent withdraw or purchase from slipping between the checks and
      // the insert; that transaction then finds and cancels this offer.
      const found = await client.query(
        `SELECT id, seller_id, status, expiry_date FROM coupons
         WHERE id = ANY($1) ORDER BY id FOR SHARE`,
        [[offeredId, requestedId]]
      );
      const offered = found.rows.find((c) => c.id === offeredId);
      const requested = found.rows.find((c) => c.id === requestedId);
      let problem = null;
      if (!offered || !requested || offered.status !== "listed" || requested.status !== "listed") {
        problem = [404, "Coupon is no longer available"];
      } else if (offered.seller_id !== req.user.id) {
        problem = [403, "You can only offer a coupon you listed"];
      } else if (requested.seller_id === req.user.id) {
        problem = [403, "You cannot ask for your own coupon"];
      } else if (isExpired(offered) || isExpired(requested)) {
        problem = [409, "An expired coupon cannot be exchanged"];
      }
      if (problem) {
        await client.query("ROLLBACK");
        return fail(res, problem[0], problem[1]);
      }
      const inserted = await client.query(
        `INSERT INTO exchanges (offered_coupon_id, requested_coupon_id, offerer_id, owner_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [offeredId, requestedId, req.user.id, requested.seller_id]
      );
      const exchange = await loadOne(client, inserted.rows[0].id, req.user.id);
      await client.query("COMMIT");
      res.status(201).json(exchange);
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      if (err.code === "23505") return fail(res, 409, "You already offered this swap");
      return serverError(req, res, err, "create exchange failed");
    } finally {
      client.release();
    }
  });

  // The owner declines a pending offer, or the offerer cancels it: the same single update.
  const closeOffer = (action, status, column) =>
    app.post(`/exchanges/:id/${action}`, authenticate, async (req, res) => {
      const id = parseId(req.params.id);
      if (!id) return fail(res, 400, "Invalid exchange id");
      try {
        const result = await pool.query(
          `UPDATE exchanges SET status = $2, resolved_at = now()
           WHERE id = $1 AND ${column} = $3 AND status = 'pending' RETURNING id`,
          [id, status, req.user.id]
        );
        if (result.rowCount === 0) return fail(res, 404, "Offer not found or already answered");
        res.json(await loadOne(pool, id, req.user.id));
      } catch (err) {
        return serverError(req, res, err, `${action} exchange failed`);
      }
    });
  closeOffer("decline", "declined", "owner_id");
  closeOffer("cancel", "cancelled", "offerer_id");

  app.post("/exchanges/:id/accept", authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, "Invalid exchange id");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const peek = await client.query(
        "SELECT offered_coupon_id, requested_coupon_id FROM exchanges WHERE id = $1 AND owner_id = $2",
        [id, req.user.id]
      );
      if (peek.rows.length === 0) {
        await client.query("ROLLBACK");
        return fail(res, 404, "Offer not found or already answered");
      }
      const { offered_coupon_id: offeredId, requested_coupon_id: requestedId } = peek.rows[0];
      const coupons = await client.query(
        "SELECT id, status, expiry_date FROM coupons WHERE id = ANY($1) ORDER BY id FOR UPDATE",
        [[offeredId, requestedId]]
      );
      const current = await client.query("SELECT status FROM exchanges WHERE id = $1 FOR UPDATE", [
        id,
      ]);
      let problem = null;
      if (current.rows[0].status !== "pending") {
        problem = [404, "Offer not found or already answered"];
      } else if (coupons.rows.some((c) => c.status !== "listed")) {
        problem = [409, "One of the coupons is no longer available"];
      } else if (coupons.rows.some(isExpired)) {
        problem = [409, "An expired coupon cannot be exchanged"];
      }
      if (problem) {
        await client.query("ROLLBACK");
        return fail(res, problem[0], problem[1]);
      }
      await client.query("UPDATE coupons SET status = 'exchanged' WHERE id = ANY($1)", [
        [offeredId, requestedId],
      ]);
      await client.query(
        "UPDATE exchanges SET status = 'accepted', resolved_at = now() WHERE id = $1",
        [id]
      );
      await cancelOffersOn(client, [offeredId, requestedId]);
      const exchange = await loadOne(client, id, req.user.id);
      await client.query("COMMIT");
      res.json(exchange);
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      return serverError(req, res, err, "accept exchange failed");
    } finally {
      client.release();
    }
  });
}

module.exports = { registerExchangeRoutes, cancelOffersOn };
