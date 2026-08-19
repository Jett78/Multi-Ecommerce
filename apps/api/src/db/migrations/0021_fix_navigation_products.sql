-- Update existing "Services" navigation item to "Products"
UPDATE "navigation_items"
SET "label" = 'Products', "path" = '/products', "key" = 'products', "updated_at" = NOW()
WHERE "label" = 'Services' OR "key" = 'services';

-- Insert "Products" nav item if it doesn't exist
INSERT INTO "navigation_items" ("id", "key", "label", "path", "sort_order", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid(), 'products', 'Products', '/products', 3, true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "navigation_items" WHERE "key" = 'products'
);
