-- Create product_status enum
CREATE TYPE "product_status" AS ENUM ('draft', 'active', 'archived');

-- Create inventory_transaction_type enum
CREATE TYPE "inventory_transaction_type" AS ENUM ('purchase', 'sale', 'return', 'adjustment', 'damage', 'restock');

-- Modify orders table (remove old columns, add new ones)
ALTER TABLE "orders" DROP COLUMN IF EXISTS "product_name";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "product_id";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "amount";
ALTER TABLE "orders" ADD COLUMN "subtotal" integer NOT NULL;
ALTER TABLE "orders" ADD COLUMN "discount_amount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "orders" ADD COLUMN "tax_amount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "orders" ADD COLUMN "total_amount" integer NOT NULL;
ALTER TABLE "orders" ADD COLUMN "shipping_address" text;
ALTER TABLE "orders" ADD COLUMN "billing_address" text;
ALTER TABLE "orders" ADD COLUMN "notes" text;

-- Create products table
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"description" text,
	"short_description" varchar(1000),
	"category_id" uuid,
	"subcategory_id" uuid,
	"brand_id" uuid,
	"sku" varchar(100),
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"tags" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);

-- Create product_variants table
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(500),
	"price" integer NOT NULL,
	"compare_at_price" integer,
	"cost_price" integer,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"allow_backorder" boolean DEFAULT false NOT NULL,
	"low_stock_threshold" integer DEFAULT 5,
	"weight" integer,
	"barcode" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);

-- Create variant_attributes table
CREATE TABLE "variant_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"attribute_name" varchar(100) NOT NULL,
	"attribute_value" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);

-- Create product_images table
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"image_key" varchar(500) NOT NULL,
	"alt_text" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create product_reviews table
CREATE TABLE "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" text,
	"rating" integer NOT NULL,
	"title" varchar(255),
	"comment" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create inventory_transactions table
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"type" "inventory_transaction_type" NOT NULL,
	"quantity" integer NOT NULL,
	"quantity_before" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"reference" varchar(255),
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create carts table
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"session_id" varchar(255),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create cart_items table
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price_at_add" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create order_items table
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"product_name" varchar(500) NOT NULL,
	"variant_name" varchar(500),
	"sku" varchar(100),
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign keys
ALTER TABLE "seo_metas" ADD COLUMN "product_id" uuid;
ALTER TABLE "seo_metas" ADD CONSTRAINT "seo_metas_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "products" ADD CONSTRAINT "products_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "variant_attributes" ADD CONSTRAINT "variant_attributes_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;

-- Create indexes
CREATE INDEX "products_slug_idx" ON "products" USING btree ("slug");
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");
CREATE INDEX "products_subcategory_id_idx" ON "products" USING btree ("subcategory_id");
CREATE INDEX "products_brand_id_idx" ON "products" USING btree ("brand_id");
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");
CREATE INDEX "products_is_featured_idx" ON "products" USING btree ("is_featured");
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");
CREATE INDEX "products_sort_order_idx" ON "products" USING btree ("sort_order");
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id");
CREATE INDEX "product_variants_sku_idx" ON "product_variants" USING btree ("sku");
CREATE INDEX "product_variants_barcode_idx" ON "product_variants" USING btree ("barcode");
CREATE INDEX "product_variants_is_active_idx" ON "product_variants" USING btree ("is_active");
CREATE INDEX "variant_attributes_variant_id_idx" ON "variant_attributes" USING btree ("variant_id");
CREATE INDEX "variant_attributes_compound_idx" ON "variant_attributes" USING btree ("variant_id", "attribute_name");
CREATE INDEX "product_images_product_id_idx" ON "product_images" USING btree ("product_id");
CREATE INDEX "product_images_variant_id_idx" ON "product_images" USING btree ("variant_id");
CREATE INDEX "product_images_primary_idx" ON "product_images" USING btree ("product_id", "is_primary");
CREATE INDEX "product_reviews_product_id_idx" ON "product_reviews" USING btree ("product_id");
CREATE INDEX "product_reviews_user_id_idx" ON "product_reviews" USING btree ("user_id");
CREATE INDEX "product_reviews_rating_idx" ON "product_reviews" USING btree ("rating");
CREATE INDEX "product_reviews_is_approved_idx" ON "product_reviews" USING btree ("is_approved");
CREATE INDEX "inventory_transactions_variant_id_idx" ON "inventory_transactions" USING btree ("variant_id");
CREATE INDEX "inventory_transactions_type_idx" ON "inventory_transactions" USING btree ("type");
CREATE INDEX "inventory_transactions_created_at_idx" ON "inventory_transactions" USING btree ("created_at");
CREATE INDEX "carts_user_id_idx" ON "carts" USING btree ("user_id");
CREATE INDEX "carts_session_id_idx" ON "carts" USING btree ("session_id");
CREATE INDEX "carts_expires_at_idx" ON "carts" USING btree ("expires_at");
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items" USING btree ("cart_id");
CREATE INDEX "cart_items_variant_id_idx" ON "cart_items" USING btree ("variant_id");
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");
CREATE INDEX "order_items_variant_id_idx" ON "order_items" USING btree ("variant_id");
