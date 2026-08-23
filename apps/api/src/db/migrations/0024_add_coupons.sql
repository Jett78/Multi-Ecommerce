-- Create coupon_type enum
DO $$ BEGIN
  CREATE TYPE coupon_type AS ENUM ('fixed', 'percentage', 'free_shipping');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  type coupon_type NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  min_order_amount INTEGER,
  max_discount_amount INTEGER,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER,
  product_ids UUID[],
  category_ids UUID[],
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for coupons
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);
CREATE INDEX IF NOT EXISTS coupons_is_active_idx ON coupons (is_active);
CREATE INDEX IF NOT EXISTS coupons_expires_at_idx ON coupons (expires_at);

-- Add coupon_id column to orders table
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create order_coupons junction table
CREATE TABLE IF NOT EXISTS order_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
  coupon_code VARCHAR(50) NOT NULL,
  discount_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for order_coupons
CREATE INDEX IF NOT EXISTS order_coupons_order_id_idx ON order_coupons (order_id);
CREATE INDEX IF NOT EXISTS order_coupons_coupon_id_idx ON order_coupons (coupon_id);

-- Seed some sample coupons
INSERT INTO coupons (code, type, value, min_order_amount, description, is_active) VALUES
  ('WELCOME10', 'percentage', 10, 1000, '10% off on your first order (minimum Rs. 1,000)', true),
  ('FLAT500', 'fixed', 50000, 50000, 'Rs. 500 off on orders above Rs. 5,000', true),
  ('FREESHIP', 'free_shipping', 0, NULL, 'Free shipping on any order', true)
ON CONFLICT (code) DO NOTHING;
