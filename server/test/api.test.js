// Integration tests: need a Postgres with the schema applied (DATABASE_URL).
// Locally: docker compose up -d db, then npm run migrate. In CI: a postgres service plus migrate.
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.JWT_SECRET = process.env.JWT_SECRET || "t".repeat(40);
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5433/coupons";

const { createApp } = require("../app");
const pool = require("../db");

const app = createApp({ authLimit: 1000 });
const suffix = Date.now().toString(36);
const emails = ["seller", "buyer", "other"].map((n) => `${n}-${suffix}@example.com`);
const PASSWORD = "correct-horse-1";
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString();

const listing = (overrides = {}) => ({
  name: "Pizza Corner 30% off",
  value: 300,
  details: "Dine-in and delivery",
  category: "Food",
  expiryDate: inDays(5),
  ...overrides,
});

async function signup(email) {
  const res = await request(app).post("/auth/register").send({ email, password: PASSWORD });
  assert.equal(res.status, 201);
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const create = (token, body = listing()) =>
  request(app).post("/coupons").set(auth(token)).send(body);

let seller;
let buyer;
let other;

test.before(async () => {
  [seller, buyer, other] = await Promise.all(emails.map(signup));
});

test.after(async () => {
  const users = "(SELECT id FROM users WHERE email = ANY($1))";
  await pool.query(`DELETE FROM purchases WHERE buyer_id IN ${users} OR seller_id IN ${users}`, [
    emails,
  ]);
  await pool.query(`DELETE FROM coupons WHERE seller_id IN ${users}`, [emails]);
  await pool.query("DELETE FROM users WHERE email = ANY($1)", [emails]);
  await pool.end();
});

test("health reports the database", async () => {
  const res = await request(app).get("/health").expect(200);
  assert.equal(res.body.status, "ok");
});

test("security headers are set and the framework is not advertised", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.headers["x-powered-by"], undefined);
  assert.ok(res.headers["x-content-type-options"]);
  assert.ok(res.headers["x-request-id"]);
});

test("register validates input, hashes the password and never returns it", async () => {
  const bad = (body) => request(app).post("/auth/register").send(body).expect(400);
  await bad({ email: "not-an-email", password: PASSWORD });
  await bad({ email: `x-${suffix}@example.com`, password: "short" });
  const row = await pool.query("SELECT password FROM users WHERE email = $1", [emails[0]]);
  assert.notEqual(row.rows[0].password, PASSWORD);
  assert.match(row.rows[0].password, /^\$2[aby]\$/);
});

test("register rejects a duplicate email, case-insensitively, with 409", async () => {
  await request(app)
    .post("/auth/register")
    .send({ email: emails[0].toUpperCase(), password: PASSWORD })
    .expect(409);
});

test("login returns a token, and a wrong password or unknown email gets the same 401", async () => {
  const ok = await request(app)
    .post("/auth/login")
    .send({ email: emails[0], password: PASSWORD })
    .expect(200);
  assert.ok(ok.body.token);
  assert.equal(ok.body.user.password, undefined);
  const wrong = await request(app)
    .post("/auth/login")
    .send({ email: emails[0], password: "wrong-password" })
    .expect(401);
  const unknown = await request(app)
    .post("/auth/login")
    .send({ email: `nobody-${suffix}@example.com`, password: PASSWORD })
    .expect(401);
  assert.equal(wrong.body.error, unknown.body.error);
});

test("every data route needs a valid token", async () => {
  for (const [method, path] of [
    ["get", "/me"],
    ["get", "/coupons"],
    ["get", "/coupons/mine"],
    ["post", "/coupons"],
    ["get", "/purchases"],
  ]) {
    await request(app)[method](path).expect(401);
    await request(app)[method](path).set(auth("garbage")).expect(401);
  }
});

test("malformed JSON gets 400 and no stack trace", async () => {
  const res = await request(app)
    .post("/coupons")
    .set(auth(seller))
    .set("Content-Type", "application/json")
    .send("{not json")
    .expect(400);
  assert.equal(res.body.error, "Invalid JSON");
});

test("profile: saved and read back, and bad fields are refused", async () => {
  const saved = await request(app)
    .put("/me")
    .set(auth(buyer))
    .send({ name: "Buyer One", phone: "9999999999", age: "30" })
    .expect(200);
  assert.equal(saved.body.name, "Buyer One");
  const read = await request(app).get("/me").set(auth(buyer)).expect(200);
  assert.equal(read.body.phone, "9999999999");
  assert.equal(read.body.email, emails[1]);
  await request(app)
    .put("/me")
    .set(auth(buyer))
    .send({ name: "x".repeat(101) })
    .expect(400);
  await request(app).put("/me").set(auth(buyer)).send({ name: 5 }).expect(400);
});

test("create validates every field", async () => {
  const bad = (overrides) =>
    create(seller, listing(overrides)).then((r) => assert.equal(r.status, 400));
  await bad({ name: "" });
  await bad({ name: "x".repeat(101) });
  await bad({ value: -5 });
  await bad({ value: "300" });
  await bad({ value: 100001 });
  await bad({ category: "Weapons" });
  await bad({ expiryDate: "tomorrow" });
  await bad({ expiryDate: inDays(-1) });
  await bad({ details: "d".repeat(501) });
});

test("a listing is owned by the caller whatever the body says", async () => {
  const res = await create(seller, { ...listing(), sellerId: "someone-else" }).expect(201);
  const row = await pool.query("SELECT seller_id FROM coupons WHERE id = $1", [res.body.id]);
  const me = await request(app).get("/me").set(auth(seller));
  assert.equal(row.rows[0].seller_id, me.body.id);
  assert.equal(res.body.value, 300);
});

test("browse shows other people's listings only, soonest expiry first", async () => {
  const late = await create(seller, listing({ name: `late-${suffix}`, expiryDate: inDays(30) }));
  const soon = await create(seller, listing({ name: `soon-${suffix}`, expiryDate: inDays(1) }));
  const mine = await request(app).get("/coupons").set(auth(seller)).expect(200);
  assert.equal(
    mine.body.some((c) => c.id === soon.body.id),
    false
  );

  const seen = await request(app).get("/coupons").set(auth(buyer)).expect(200);
  const ids = seen.body.map((c) => c.id);
  assert.ok(ids.includes(soon.body.id) && ids.includes(late.body.id));
  assert.ok(ids.indexOf(soon.body.id) < ids.indexOf(late.body.id));
  const dates = seen.body.map((c) => Date.parse(c.expiryDate));
  assert.deepEqual(
    dates,
    [...dates].sort((a, b) => a - b)
  );
});

test("exchange search matches by category or by value", async () => {
  const travel = await create(
    seller,
    listing({ name: `trip-${suffix}`, category: "Travel", value: 777 })
  );
  const byCategory = await request(app)
    .get("/coupons?category=Travel")
    .set(auth(buyer))
    .expect(200);
  assert.ok(byCategory.body.some((c) => c.id === travel.body.id));
  const byValue = await request(app).get("/coupons?value=777").set(auth(buyer)).expect(200);
  assert.ok(byValue.body.some((c) => c.id === travel.body.id));
  const either = await request(app)
    .get("/coupons?category=Beauty&value=777")
    .set(auth(buyer))
    .expect(200);
  assert.ok(either.body.some((c) => c.id === travel.body.id));
  const neither = await request(app)
    .get("/coupons?category=Beauty&value=778")
    .set(auth(buyer))
    .expect(200);
  assert.ok(!neither.body.some((c) => c.id === travel.body.id));
  const lower = await request(app).get("/coupons?category=travel").set(auth(buyer)).expect(200);
  assert.ok(lower.body.some((c) => c.id === travel.body.id));
  await request(app).get("/coupons?value=abc").set(auth(buyer)).expect(400);
});

test("withdraw: only the seller, once, and the listing disappears but stays in history", async () => {
  const made = await create(seller, listing({ name: `withdraw-${suffix}` })).expect(201);
  const id = made.body.id;
  await request(app).delete(`/coupons/${id}`).set(auth(other)).expect(404);
  await request(app).delete("/coupons/not-a-uuid").set(auth(seller)).expect(400);
  await request(app).delete(`/coupons/${id}`).set(auth(seller)).expect(204);
  await request(app).delete(`/coupons/${id}`).set(auth(seller)).expect(404);
  const browse = await request(app).get("/coupons").set(auth(buyer));
  assert.ok(!browse.body.some((c) => c.id === id));
  const mine = await request(app).get("/coupons/mine").set(auth(seller));
  assert.ok(!mine.body.some((c) => c.id === id));
  const row = await pool.query("SELECT status FROM coupons WHERE id = $1", [id]);
  assert.equal(row.rows[0].status, "withdrawn");
  await request(app).post(`/coupons/${id}/buy`).set(auth(buyer)).expect(404);
});

test("buy: records the purchase, hides the listing, and cannot be repeated", async () => {
  const made = await create(seller, listing({ name: `buy-${suffix}`, value: 410 })).expect(201);
  const id = made.body.id;
  const bought = await request(app).post(`/coupons/${id}/buy`).set(auth(buyer)).expect(201);
  assert.equal(bought.body.couponName, `buy-${suffix}`);
  assert.equal(bought.body.couponValue, 410);

  const purchases = await request(app).get("/purchases").set(auth(buyer)).expect(200);
  assert.ok(purchases.body.some((p) => p.couponId === id));
  const others = await request(app).get("/purchases").set(auth(other)).expect(200);
  assert.ok(!others.body.some((p) => p.couponId === id));

  const listed = await request(app).get("/coupons/mine").set(auth(seller));
  assert.ok(!listed.body.some((c) => c.id === id));
  await request(app).post(`/coupons/${id}/buy`).set(auth(other)).expect(404);
  await request(app).delete(`/coupons/${id}`).set(auth(seller)).expect(404);
});

test("buy: a seller cannot buy their own coupon", async () => {
  const made = await create(seller, listing({ name: `own-${suffix}` })).expect(201);
  await request(app).post(`/coupons/${made.body.id}/buy`).set(auth(seller)).expect(403);
  const row = await pool.query("SELECT status FROM coupons WHERE id = $1", [made.body.id]);
  assert.equal(row.rows[0].status, "listed");
});

test("buy: an expired coupon is refused", async () => {
  const made = await create(seller, listing({ name: `old-${suffix}` })).expect(201);
  await pool.query("UPDATE coupons SET expiry_date = now() - interval '1 day' WHERE id = $1", [
    made.body.id,
  ]);
  const res = await request(app).post(`/coupons/${made.body.id}/buy`).set(auth(buyer)).expect(409);
  assert.equal(res.body.error, "This coupon has expired");
  const browse = await request(app).get("/coupons").set(auth(buyer));
  assert.ok(!browse.body.some((c) => c.id === made.body.id));
});

test("buy: two buyers racing for one coupon, exactly one wins", async () => {
  const made = await create(seller, listing({ name: `race-${suffix}` })).expect(201);
  const url = `/coupons/${made.body.id}/buy`;
  const results = await Promise.all([
    request(app).post(url).set(auth(buyer)),
    request(app).post(url).set(auth(other)),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 404]);
  const count = await pool.query("SELECT count(*)::int AS n FROM purchases WHERE coupon_id = $1", [
    made.body.id,
  ]);
  assert.equal(count.rows[0].n, 1);
});

test("buy rejects a malformed id and an unknown id", async () => {
  await request(app).post("/coupons/nope/buy").set(auth(buyer)).expect(400);
  await request(app)
    .post("/coupons/00000000-0000-4000-8000-000000000000/buy")
    .set(auth(buyer))
    .expect(404);
});

test("unknown routes return JSON 404", async () => {
  const res = await request(app).get("/nothing-here").expect(404);
  assert.equal(res.body.error, "Not found");
});
