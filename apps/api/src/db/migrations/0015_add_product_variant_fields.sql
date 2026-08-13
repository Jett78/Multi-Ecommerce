-- Add variant fields directly to products table.
-- When a product has no variants, these fields hold the data.
-- When a product has variants, these fields are null/0 and data lives in product_variants.

ALTER TABLE products ADD COLUMN price integer DEFAULT 0;
ALTER TABLE products ADD COLUMN compare_at_price integer;
ALTER TABLE products ADD COLUMN cost_price integer;
ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT 0;
ALTER TABLE products ADD COLUMN allow_backorder boolean DEFAULT false;
ALTER TABLE products ADD COLUMN low_stock_threshold integer DEFAULT 5;
ALTER TABLE products ADD COLUMN weight integer;
ALTER TABLE products ADD COLUMN barcode varchar(100);
