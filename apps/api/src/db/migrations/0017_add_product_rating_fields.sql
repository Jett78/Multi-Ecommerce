-- Migration: Add rating fields to products table
-- These fields are denormalized for performance (avoid counting reviews on every query)

-- Add averageRating field (stored as integer, divided by 10 for display: 45 = 4.5 stars)
ALTER TABLE "products" ADD COLUMN "average_rating" integer NOT NULL DEFAULT 0;

-- Add reviewCount field
ALTER TABLE "products" ADD COLUMN "review_count" integer NOT NULL DEFAULT 0;

-- Add index for filtering by rating
CREATE INDEX "products_average_rating_idx" ON "products" USING btree ("average_rating");

-- Update existing products with their actual review counts and average ratings
-- This backfills data for any existing reviews
UPDATE "products" p
SET 
  "average_rating" = COALESCE(
    (SELECT ROUND(AVG(r.rating) * 10)::integer 
     FROM "product_reviews" r 
     WHERE r.product_id = p.id AND r.is_approved = true),
    0
  ),
  "review_count" = COALESCE(
    (SELECT COUNT(*)::integer 
     FROM "product_reviews" r 
     WHERE r.product_id = p.id AND r.is_approved = true),
    0
  );
