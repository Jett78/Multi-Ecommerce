-- Make SKU optional in product_variants
ALTER TABLE product_variants ALTER COLUMN sku DROP NOT NULL;
