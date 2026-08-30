CREATE TABLE IF NOT EXISTS "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"type" varchar(50) NOT NULL,
	"link" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banners_sort_order_idx" ON "banners" ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banners_type_idx" ON "banners" ("type");
