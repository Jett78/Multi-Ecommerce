-- Add brand_ids and filter_logic columns to coupons table
ALTER TABLE coupons ADD COLUMN brand_ids UUID[];
ALTER TABLE coupons ADD COLUMN filter_logic VARCHAR(3) DEFAULT 'and' NOT NULL;

-- Add index on filter_logic for query performance
CREATE INDEX coupons_filter_logic_idx ON coupons(filter_logic);
