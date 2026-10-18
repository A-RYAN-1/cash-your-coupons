const test = require("node:test");
const assert = require("node:assert/strict");
const { validateCredentials, validateCoupon, validateProfile, parseId } = require("../validation");

const now = new Date("2026-01-01T00:00:00Z");
const good = {
  name: "  Pizza  ",
  value: 12.345,
  details: " ok ",
  category: "Food",
  expiryDate: "2026-02-01T00:00:00Z",
};

test("credentials: email is trimmed and lower-cased, password length is enforced", () => {
  assert.deepEqual(validateCredentials({ email: " A@B.co ", password: "12345678" }), {
    email: "a@b.co",
    password: "12345678",
  });
  assert.ok(validateCredentials({ email: "a@b.co", password: "1234567" }).error);
  assert.ok(validateCredentials({ email: "a@b.co", password: "x".repeat(73) }).error);
  assert.ok(validateCredentials({ email: "nope", password: "12345678" }).error);
  assert.ok(validateCredentials(null).error);
  assert.ok(validateCredentials([]).error);
});

test("credentials: login does not enforce the minimum length", () => {
  assert.equal(
    validateCredentials({ email: "a@b.co", password: "short" }, { strictPassword: false }).error,
    undefined
  );
});

test("coupon: trims text and rounds the value to cents", () => {
  const { value, error } = validateCoupon(good, now);
  assert.equal(error, undefined);
  assert.equal(value.name, "Pizza");
  assert.equal(value.value, 12.35);
  assert.equal(value.details, "ok");
});

test("coupon: rejects each bad field", () => {
  const bad = (overrides) => assert.ok(validateCoupon({ ...good, ...overrides }, now).error);
  bad({ name: " " });
  bad({ value: 0 });
  bad({ value: Infinity });
  bad({ value: "5" });
  bad({ category: "Nope" });
  bad({ expiryDate: "2025-12-31T00:00:00Z" });
  bad({ expiryDate: "garbage" });
  bad({ expiryDate: 5 });
});

test("profile: missing fields become empty text, wrong types are refused", () => {
  assert.equal(validateProfile({ name: " A " }).value.name, "A");
  assert.equal(validateProfile({}).value.phone, "");
  assert.ok(validateProfile({ age: 30 }).error);
  assert.ok(validateProfile({ dob: "1".repeat(11) }).error);
});

test("parseId accepts only UUIDs", () => {
  assert.equal(
    parseId("0F1E2D3C-4B5A-4978-8695-A4B3C2D1E0F9"),
    "0f1e2d3c-4b5a-4978-8695-a4b3c2d1e0f9"
  );
  assert.equal(parseId("1; DROP TABLE coupons"), null);
  assert.equal(parseId(undefined), null);
});
