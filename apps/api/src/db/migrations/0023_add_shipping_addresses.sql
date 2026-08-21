-- Create address_type enum
CREATE TYPE "address_type" AS ENUM ('home', 'office', 'other');

-- Create shipping_addresses table
CREATE TABLE "shipping_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "address_type" DEFAULT 'home' NOT NULL,
	"label" varchar(100),
	"province_id" integer NOT NULL,
	"province_name" varchar(100) NOT NULL,
	"district" varchar(100) NOT NULL,
	"municipality" varchar(100) NOT NULL,
	"landmark" text,
	"street_address" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign key
ALTER TABLE "shipping_addresses" ADD CONSTRAINT "shipping_addresses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- Index
CREATE INDEX "shipping_addresses_user_id_idx" ON "shipping_addresses" USING btree ("user_id");
