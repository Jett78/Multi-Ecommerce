CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"image_key" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"image_key" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"image_key" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subcategories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brands_sort_order_idx" ON "brands" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "brands_is_active_idx" ON "brands" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_sort_order_idx" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "subcategories_slug_idx" ON "subcategories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "subcategories_category_id_idx" ON "subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "subcategories_sort_order_idx" ON "subcategories" USING btree ("sort_order");