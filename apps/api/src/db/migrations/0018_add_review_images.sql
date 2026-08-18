-- Add images column to product_reviews table
ALTER TABLE product_reviews ADD COLUMN images text[] DEFAULT '{}';

-- Comment
COMMENT ON COLUMN product_reviews.images IS 'Array of image keys for review images';
