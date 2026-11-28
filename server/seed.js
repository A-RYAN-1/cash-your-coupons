// Creates the two public demo accounts and a catalogue of demo coupons across every category for the seller. Never deletes:
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
    name: "Spice Route 200 off",
    value: 200,
    details: "Dinner for two above 900, weekends included",
    expiryDate: days(9),
    category: "Food",
  },
  {
    name: "Burger Barn combo voucher",
    value: 180,
    details: "Any combo meal, one use per bill",
    expiryDate: days(2),
    category: "Food",
  },
  {
    name: "Sweet Tooth 100 off",
    value: 100,
    details: "Cakes and desserts above 500",
    expiryDate: days(14),
    category: "Food",
  },
  {
    name: "Midnight Biryani 150 off",
    value: 150,
    details: "Delivery only, after 9 pm",
    expiryDate: days(40),
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
    name: "Denim Lab 25% off",
    value: 400,
    details: "Jeans and jackets, one bill",
    expiryDate: days(31),
    category: "Clothes",
  },
  {
    name: "Kids Corner 300 off",
    value: 300,
    details: "Children's wear above 1500",
    expiryDate: days(7),
    category: "Clothes",
  },
  {
    name: "Urban Sole 350 off",
    value: 350,
    details: "Footwear above 2000, not on sale pairs",
    expiryDate: days(50),
    category: "Clothes",
  },
  {
    name: "Weekend getaway 1000 off",
    value: 1000,
    details: "Domestic hotel bookings, two nights minimum",
    expiryDate: days(18),
    category: "Travel",
  },
  {
    name: "Rail Easy 150 cashback",
    value: 150,
    details: "Train ticket bookings, one use",
    expiryDate: days(11),
    category: "Travel",
  },
  {
    name: "Sky Fare 600 off",
    value: 600,
    details: "Domestic flights above 4000, one way or return",
    expiryDate: days(4),
    category: "Travel",
  },
  {
    name: "Cab Go 5 rides 50 off",
    value: 250,
    details: "Five rides, city only, valid 30 days after activation",
    expiryDate: days(22),
    category: "Travel",
  },
  {
    name: "Trail Gear 500 off",
    value: 400,
    details: "Camping and trekking gear above 2500",
    expiryDate: days(66),
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
    name: "Sound Wave 800 off",
    value: 800,
    details: "Headphones and speakers above 4000",
    expiryDate: days(35),
    category: "Electronics",
  },
  {
    name: "Pixel Mart 1000 off",
    value: 1000,
    details: "Phones above 20000, no exchange offers",
    expiryDate: days(8),
    category: "Electronics",
  },
  {
    name: "Charge Plus 120 off",
    value: 120,
    details: "Chargers and cables above 600",
    expiryDate: days(45),
    category: "Electronics",
  },
  {
    name: "Smart Home 450 off",
    value: 450,
    details: "Smart bulbs, plugs and cameras above 2500",
    expiryDate: days(28),
    category: "Electronics",
  },
  {
    name: "Arena Pass 200 credits",
    value: 200,
    details: "Game credits, redeemable once on any account",
    expiryDate: days(6),
    category: "Online Gaming",
  },
  {
    name: "Level Up 500 gift card",
    value: 500,
    details: "Store gift card for PC and console titles",
    expiryDate: days(30),
    category: "Online Gaming",
  },
  {
    name: "Battle Royale skins 150 off",
    value: 150,
    details: "In-game store, season pass excluded",
    expiryDate: days(3),
    category: "Online Gaming",
  },
  {
    name: "Pixel Quest 300 coins",
    value: 300,
    details: "Mobile game coins, one account",
    expiryDate: days(19),
    category: "Online Gaming",
  },
  {
    name: "Glow Beauty 20% off",
    value: 200,
    details: "Skincare range only",
    expiryDate: days(3),
    category: "Beauty",
  },
  {
    name: "Salon Bliss 300 off",
    value: 300,
    details: "Haircut and colour above 1200",
    expiryDate: days(16),
    category: "Beauty",
  },
  {
    name: "Scent Studio 250 off",
    value: 250,
    details: "Perfumes above 1500",
    expiryDate: days(42),
    category: "Beauty",
  },
  {
    name: "Fit Fuel 15% off",
    value: 180,
    details: "Supplements above 1500, new customers",
    expiryDate: days(10),
    category: "Health & Wellness",
  },
  {
    name: "Yoga Hub 3 classes free",
    value: 450,
    details: "Three drop-in classes, any studio branch",
    expiryDate: days(24),
    category: "Health & Wellness",
  },
  {
    name: "CareFirst lab test 200 off",
    value: 200,
    details: "Full body checkup, home collection included",
    expiryDate: days(13),
    category: "Health & Wellness",
  },
  {
    name: "Gym Pass 7 days",
    value: 350,
    details: "One week trial pass, weekday mornings",
    expiryDate: days(5),
    category: "Health & Wellness",
  },
  {
    name: "Garden Fresh 120 off",
    value: 120,
    details: "Plants and pots above 600",
    expiryDate: days(27),
    category: "Others",
  },
  {
    name: "Pet Pals 250 off",
    value: 250,
    details: "Pet food and accessories above 1200",
    expiryDate: days(33),
    category: "Others",
  },
  {
    name: "Learn Lane 500 off",
    value: 500,
    details: "Any online course above 2000",
    expiryDate: days(90),
    category: "Others",
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
