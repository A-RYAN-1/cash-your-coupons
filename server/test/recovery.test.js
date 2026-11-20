// Password recovery against a real Postgres (same setup as api.test.js).
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.JWT_SECRET = process.env.JWT_SECRET || "t".repeat(40);
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5433/coupons";

const { createApp } = require("../app");
const pool = require("../db");

const sent = [];
const app = createApp({
  authLimit: 1000,
  mailer: { send: async (to, subject, text) => sent.push({ to, text }) },
});
const suffix = Date.now().toString(36);
const emails = [1, 2, 3, 4].map((n) => `reset${n}-${suffix}@example.com`);
const OLD = "old-password-1";
const NEW = "new-password-2";

const signup = (email) => request(app).post("/auth/register").send({ email, password: OLD });
const forgot = (email) => request(app).post("/auth/forgot").send({ email });
const reset = (email, code, password = NEW) =>
  request(app).post("/auth/reset").send({ email, code, password });
const login = (email, password) => request(app).post("/auth/login").send({ email, password });
const lastCode = (email) =>
  sent
    .filter((m) => m.to === email)
    .pop()
    .text.match(/code is (\w{8})/)[1];

test.before(() => Promise.all(emails.map(signup)));

test.after(async () => {
  await pool.query(
    "DELETE FROM password_resets WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))",
    [emails]
  );
  await pool.query("DELETE FROM users WHERE email = ANY($1)", [emails]);
  await pool.end();
});

test("an unknown email gets the same answer and no mail", async () => {
  const known = await forgot(emails[0]);
  const before = sent.length;
  const unknown = await forgot(`nobody-${suffix}@example.com`);
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.body, known.body);
  assert.equal(sent.length, before);
});

test("the mailed code sets a new password, once", async () => {
  const [email] = emails;
  const code = lastCode(email);
  // Spaces and lower case are forgiven, since people retype codes.
  const ok = await reset(email, ` ${code.toLowerCase()} `);
  assert.equal(ok.status, 200);
  assert.equal((await login(email, NEW)).status, 200);
  assert.equal((await login(email, OLD)).status, 401);
  assert.equal((await reset(email, code, "third-password-3")).status, 400);
});

test("a wrong code is refused and five wrong guesses lock the real one", async () => {
  const email = emails[1];
  await forgot(email);
  const code = lastCode(email);
  for (let i = 0; i < 5; i += 1) assert.equal((await reset(email, "AAAAAAAA")).status, 400);
  assert.equal((await reset(email, code)).status, 400);
  assert.equal((await login(email, OLD)).status, 200);
});

test("an expired code is refused", async () => {
  const email = emails[2];
  await forgot(email);
  await pool.query(
    "UPDATE password_resets SET expires_at = now() - interval '1 minute' WHERE user_id = (SELECT id FROM users WHERE email = $1)",
    [email]
  );
  assert.equal((await reset(email, lastCode(email))).status, 400);
});

test("a weak new password is refused and the code stays usable", async () => {
  const email = emails[3];
  await forgot(email);
  const code = lastCode(email);
  assert.equal((await reset(email, code, "short")).status, 400);
  assert.equal((await reset(email, code)).status, 200);
});

test("only three mails an hour per account", async () => {
  const email = emails[1];
  const before = sent.filter((m) => m.to === email).length;
  for (let i = 0; i < 4; i += 1) await forgot(email);
  assert.equal(sent.filter((m) => m.to === email).length - before, 2);
});
