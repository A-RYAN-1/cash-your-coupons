const CATEGORIES = [
  "Food",
  "Clothes",
  "Travel",
  "Electronics",
  "Online Gaming",
  "Beauty",
  "Health & Wellness",
  "Others",
];
const MAX_VALUE = 100000;
const MAX_CODE = 100;
const PROFILE_FIELDS = { name: 100, gender: 20, age: 3, phone: 20, address: 200, dob: 10 };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isObject = (body) => body !== null && typeof body === "object" && !Array.isArray(body);

function validateCredentials(body, { strictPassword = true } = {}) {
  if (!isObject(body)) return { error: "Request body must be a JSON object" };
  const { email, password } = body;
  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) {
    return { error: "Enter a valid email address" };
  }
  if (typeof password !== "string" || password.length === 0 || password.length > 72) {
    return { error: "Password must be at most 72 characters" };
  }
  if (strictPassword && password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  return { email: email.trim().toLowerCase(), password };
}

const hasControlCharacter = (text) =>
  [...text].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127);

// Optional. Returns null when absent or blank, the trimmed code, or false when it is not valid.
function normalizeVoucherCode(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") return false;
  const code = raw.trim();
  if (code.length === 0) return null;
  if (code.length > MAX_CODE || hasControlCharacter(code)) {
    return false;
  }
  return code;
}

function validateCoupon(body, now = new Date()) {
  if (!isObject(body)) return { error: "Request body must be a JSON object" };
  const { name, value, details = "", category, expiryDate, voucherCode } = body;
  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 100) {
    return { error: "Name is required and must be at most 100 characters" };
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > MAX_VALUE) {
    return { error: `Value must be a number above 0 and at most ${MAX_VALUE}` };
  }
  if (typeof details !== "string" || details.length > 500) {
    return { error: "Details must be at most 500 characters" };
  }
  if (!CATEGORIES.includes(category)) {
    return { error: `Category must be one of: ${CATEGORIES.join(", ")}` };
  }
  const code = normalizeVoucherCode(voucherCode);
  if (code === false) {
    return {
      error: `Voucher code must be 1 to ${MAX_CODE} visible characters, without line breaks`,
    };
  }
  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : null;
  if (!expiry || Number.isNaN(expiry.getTime())) {
    return { error: "Expiry date must be an ISO date" };
  }
  if (expiry <= now) return { error: "Expiry date must be in the future" };
  return {
    value: {
      name: name.trim(),
      value: Math.round(value * 100) / 100,
      details: details.trim(),
      category,
      voucherCode: code,
      expiryDate: expiry.toISOString(),
    },
  };
}

function validateProfile(body) {
  if (!isObject(body)) return { error: "Request body must be a JSON object" };
  const value = {};
  for (const [field, max] of Object.entries(PROFILE_FIELDS)) {
    const raw = body[field] === undefined || body[field] === null ? "" : body[field];
    if (typeof raw !== "string" || raw.length > max) {
      return { error: `${field} must be text of at most ${max} characters` };
    }
    value[field] = raw.trim();
  }
  return { value };
}

const parseId = (raw) => (typeof raw === "string" && UUID.test(raw) ? raw.toLowerCase() : null);

module.exports = {
  CATEGORIES,
  validateCredentials,
  validateCoupon,
  validateProfile,
  parseId,
};
