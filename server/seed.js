// Creates the two public demo accounts and a few demo coupons for the seller. Never deletes:
// it adds the accounts and the coupons that are missing. Run: npm run seed
const bcrypt = require("bcrypt");
const pool = require("./db");

const SELLER = "seller-demo@cashyourcoupons.app";
const BUYER = "buyer-demo@cashyourcoupons.app";
const PASSWORD = "demo-pass-123";

const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

const COUPONS = [
  {
    name: "Pizza Corner 30% off",
    value: 300,
    details: "Valid on orders above 600, dine-in and delivery",
    expiryDate: days(5),
    category: "Food",
  },
  {
    name: "Style Street 500 voucher",
    value: 500,
    details: "One use, not valid on sale items",
    expiryDate: days(20),
    category: "Clothes",
  },
  {
    name: "Weekend getaway 1000 off",
    value: 1000,
    details: "Domestic hotel bookings, two nights minimum",
    expiryDate: days(60),
    category: "Travel",
  },
  {
    name: "Gadget Hub 250 off",
    value: 250,
    details: "On accessories above 1000",
    expiryDate: days(12),
    category: "Electronics",
  },
  {
    name: "Glow Beauty 20% off",
    value: 200,
    details: "Skincare range only",
    expiryDate: days(3),
    category: "Beauty",
  },
];

// The buyer lists one coupon too, so the two demo accounts can offer each other a swap.
const BUYER_COUPONS = [
  {
    name: "Book Haven 150 off",
    value: 150,
    details: "Any paperback above 400, one use",
    expiryDate: days(25),
    category: "Others",
  },
];

async function ensureUser(email, name, hash) {
  await pool.query(
    "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
    [email, hash, name]
  );
  const result = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  return result.rows[0].id;
}

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const sellerId = await ensureUser(SELLER, "Demo Seller", hash);
  const buyerId = await ensureUser(BUYER, "Demo Buyer", hash);

  let added = 0;
  let kept = 0;
  for (const [ownerId, coupons] of [
    [sellerId, COUPONS],
    [buyerId, BUYER_COUPONS],
  ]) {
    const listed = await pool.query(
      "SELECT name FROM coupons WHERE seller_id = $1 AND status = 'listed'",
      [ownerId]
    );
    const have = new Set(listed.rows.map((row) => row.name));
    for (const c of coupons.filter((c) => !have.has(c.name))) {
      await pool.query(
        "INSERT INTO coupons (seller_id, name, value, details, category, expiry_date) VALUES ($1, $2, $3, $4, $5, $6)",
        [ownerId, c.name, c.value, c.details, c.category, c.expiryDate]
      );
      added += 1;
    }
    kept += coupons.length - coupons.filter((c) => !have.has(c.name)).length;
  }
  console.log(`demo accounts ready, ${added} coupons added, ${kept} already listed`);
  await pool.end();
})().catch((err) => {
  console.error("seed failed:", err.message);
  process.exit(1);
});
