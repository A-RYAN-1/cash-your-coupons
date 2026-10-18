-- Idempotent schema; applied by `npm run migrate` on every deploy.
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  gender      TEXT NOT NULL DEFAULT '',
  age         TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  address     TEXT NOT NULL DEFAULT '',
  dob         TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A listing stays in the table after it is sold or withdrawn, so history is kept.
CREATE TABLE IF NOT EXISTS coupons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  value       NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  details     TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'sold', 'withdrawn')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coupons_listed_idx ON coupons (expiry_date) WHERE status = 'listed';
CREATE INDEX IF NOT EXISTS coupons_seller_idx ON coupons (seller_id);

-- One row per sale; the unique coupon_id means a coupon can be bought only once.
CREATE TABLE IF NOT EXISTS purchases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id    UUID NOT NULL UNIQUE REFERENCES coupons(id),
  buyer_id     UUID NOT NULL REFERENCES users(id),
  seller_id    UUID NOT NULL REFERENCES users(id),
  coupon_name  TEXT NOT NULL,
  coupon_value NUMERIC(10, 2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (buyer_id <> seller_id)
);
CREATE INDEX IF NOT EXISTS purchases_buyer_idx ON purchases (buyer_id);
