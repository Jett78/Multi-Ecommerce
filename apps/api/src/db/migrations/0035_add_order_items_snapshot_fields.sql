-- Add imageKey and attributes columns to order_items table
ALTER TABLE "order_items" ADD COLUMN "image_key" varchar(500);
ALTER TABLE "order_items" ADD COLUMN "attributes" jsonb;
