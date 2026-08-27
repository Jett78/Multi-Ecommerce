-- ============================================================
-- COURIER / DELIVERY TABLES
-- ============================================================

-- courier_settings: API credentials for courier providers
CREATE TABLE IF NOT EXISTS courier_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  api_base_url VARCHAR(500) NOT NULL,
  credentials TEXT NOT NULL,
  config TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- courier_cities: synced from courier API (e.g., Pathao cities)
CREATE TABLE IF NOT EXISTS courier_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  courier_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courier_cities_provider_idx ON courier_cities (provider);

-- courier_zones: synced from courier API (e.g., Pathao zones within a city)
CREATE TABLE IF NOT EXISTS courier_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  city_id UUID REFERENCES courier_cities(id) ON DELETE CASCADE,
  courier_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courier_zones_provider_idx ON courier_zones (provider);
CREATE INDEX IF NOT EXISTS courier_zones_city_id_idx ON courier_zones (city_id);

-- courier_areas: synced from courier API (e.g., Pathao areas within a zone)
CREATE TABLE IF NOT EXISTS courier_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  zone_id UUID REFERENCES courier_zones(id) ON DELETE CASCADE,
  courier_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  home_delivery BOOLEAN NOT NULL DEFAULT false,
  pickup BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courier_areas_provider_idx ON courier_areas (provider);
CREATE INDEX IF NOT EXISTS courier_areas_zone_id_idx ON courier_areas (zone_id);

-- courier_branches: synced from courier API (e.g., NCM branches)
CREATE TABLE IF NOT EXISTS courier_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  district VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courier_branches_provider_idx ON courier_branches (provider);

-- courier_district_mappings: maps Nepal districts to courier geography
CREATE TABLE IF NOT EXISTS courier_district_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district VARCHAR(100) NOT NULL,
  province_id INTEGER NOT NULL,
  provider VARCHAR(50) NOT NULL,
  courier_city_id INTEGER,
  courier_city_name VARCHAR(255),
  courier_zone_id INTEGER,
  courier_zone_name VARCHAR(255),
  courier_area_id INTEGER,
  courier_area_name VARCHAR(255),
  courier_branch VARCHAR(255),
  is_mapped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mappings_district_provider_idx ON courier_district_mappings (district, provider);
CREATE INDEX IF NOT EXISTS mappings_provider_idx ON courier_district_mappings (provider);

-- Add delivery charge columns to orders table
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN delivery_charge INTEGER NOT NULL DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN courier_provider VARCHAR(50);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN courier_consignment_id VARCHAR(255);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN delivery_type VARCHAR(50);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN estimated_delivery_days INTEGER;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Seed default courier providers
INSERT INTO courier_settings (provider, name, api_base_url, credentials, config, is_enabled) VALUES
  ('pathao', 'Pathao Courier', 'https://courier-api-sandbox.pathao.com', '{"clientId":"","clientSecret":"","username":"","password":""}', '{"storeId":""}', false),
  ('ncm', 'Nepal Can Move', 'https://nepalcanmove.com', '{"apiToken":""}', '{"sourceBranch":""}', false)
ON CONFLICT (provider) DO NOTHING;

-- Seed all 77 Nepal districts with province info (unmapped by default)
INSERT INTO courier_district_mappings (district, province_id, provider, is_mapped) VALUES
  -- Province 1 (Koshi)
  ('Taplejung', 1, 'pathao', false),
  ('Sankhuwasabha', 1, 'pathao', false),
  ('Bhojpur', 1, 'pathao', false),
  ('Dhankuta', 1, 'pathao', false),
  ('Terhathum', 1, 'pathao', false),
  ('Panchthar', 1, 'pathao', false),
  ('Illam', 1, 'pathao', false),
  ('Jhapa', 1, 'pathao', false),
  ('Morang', 1, 'pathao', false),
  ('Sunsari', 1, 'pathao', false),
  ('Udayapur', 1, 'pathao', false),
  -- Province 2 (Madhesh)
  ('Saptari', 2, 'pathao', false),
  ('Siraha', 2, 'pathao', false),
  ('Dhanusha', 2, 'pathao', false),
  ('Mahottari', 2, 'pathao', false),
  ('Sarlahi', 2, 'pathao', false),
  -- Province 3 (Bagmati)
  ('Rasuwa', 3, 'pathao', false),
  ('Dhading', 3, 'pathao', false),
  ('Nuwakot', 3, 'pathao', false),
  ('Kathmandu', 3, 'pathao', false),
  ('Bhaktapur', 3, 'pathao', false),
  ('Lalitpur', 3, 'pathao', false),
  ('Kavrepalanchok', 3, 'pathao', false),
  ('Sindhupalchok', 3, 'pathao', false),
  ('Chitwan', 3, 'pathao', false),
  ('Makwanpur', 3, 'pathao', false),
  ('Sindhuli', 3, 'pathao', false),
  -- Province 4 (Gandaki)
  ('Baglung', 4, 'pathao', false),
  ('Myagdi', 4, 'pathao', false),
  ('Kaski', 4, 'pathao', false),
  ('Mustang', 4, 'pathao', false),
  ('Manang', 4, 'pathao', false),
  ('Gorkha', 4, 'pathao', false),
  ('Tanahu', 4, 'pathao', false),
  ('Nawalparasi East', 4, 'pathao', false),
  -- Province 5 (Lumbini)
  ('Parbat', 5, 'pathao', false),
  ('Syangja', 5, 'pathao', false),
  ('Tanahun', 5, 'pathao', false),
  ('Nawalparasi West', 5, 'pathao', false),
  ('Rupandehi', 5, 'pathao', false),
  ('Kapilvastu', 5, 'pathao', false),
  ('Arghakhanchi', 5, 'pathao', false),
  ('Gulmi', 5, 'pathao', false),
  ('Palpa', 5, 'pathao', false),
  ('Dang', 5, 'pathao', false),
  ('Bardiya', 5, 'pathao', false),
  ('Banke', 5, 'pathao', false),
  -- Province 6 (Karnali)
  ('Pyuthan', 6, 'pathao', false),
  ('Rolpa', 6, 'pathao', false),
  ('Rukum West', 6, 'pathao', false),
  ('Salyan', 6, 'pathao', false),
  ('Dolpa', 6, 'pathao', false),
  ('Jumla', 6, 'pathao', false),
  ('Mugu', 6, 'pathao', false),
  ('Humla', 6, 'pathao', false),
  ('Kalikot', 6, 'pathao', false),
  ('Dailekh', 6, 'pathao', false),
  ('Surkhet', 6, 'pathao', false),
  -- Province 7 (Sudurpashchim)
  ('Bajhang', 7, 'pathao', false),
  ('Bajura', 7, 'pathao', false),
  ('Achham', 7, 'pathao', false),
  ('Doti', 7, 'pathao', false),
  ('Darchula', 7, 'pathao', false),
  ('Baitadi', 7, 'pathao', false),
  ('Dadeldhura', 7, 'pathao', false),
  ('Kailali', 7, 'pathao', false),
  ('Kanchanpur', 7, 'pathao', false)
ON CONFLICT DO NOTHING;

-- Also seed for NCM provider
INSERT INTO courier_district_mappings (district, province_id, provider, is_mapped) VALUES
  ('Taplejung', 1, 'ncm', false),
  ('Sankhuwasabha', 1, 'ncm', false),
  ('Bhojpur', 1, 'ncm', false),
  ('Dhankuta', 1, 'ncm', false),
  ('Terhathum', 1, 'ncm', false),
  ('Panchthar', 1, 'ncm', false),
  ('Illam', 1, 'ncm', false),
  ('Jhapa', 1, 'ncm', false),
  ('Morang', 1, 'ncm', false),
  ('Sunsari', 1, 'ncm', false),
  ('Udayapur', 1, 'ncm', false),
  ('Saptari', 2, 'ncm', false),
  ('Siraha', 2, 'ncm', false),
  ('Dhanusha', 2, 'ncm', false),
  ('Mahottari', 2, 'ncm', false),
  ('Sarlahi', 2, 'ncm', false),
  ('Rasuwa', 3, 'ncm', false),
  ('Dhading', 3, 'ncm', false),
  ('Nuwakot', 3, 'ncm', false),
  ('Kathmandu', 3, 'ncm', false),
  ('Bhaktapur', 3, 'ncm', false),
  ('Lalitpur', 3, 'ncm', false),
  ('Kavrepalanchok', 3, 'ncm', false),
  ('Sindhupalchok', 3, 'ncm', false),
  ('Chitwan', 3, 'ncm', false),
  ('Makwanpur', 3, 'ncm', false),
  ('Sindhuli', 3, 'ncm', false),
  ('Baglung', 4, 'ncm', false),
  ('Myagdi', 4, 'ncm', false),
  ('Kaski', 4, 'ncm', false),
  ('Mustang', 4, 'ncm', false),
  ('Manang', 4, 'ncm', false),
  ('Gorkha', 4, 'ncm', false),
  ('Tanahu', 4, 'ncm', false),
  ('Nawalparasi East', 4, 'ncm', false),
  ('Parbat', 5, 'ncm', false),
  ('Syangja', 5, 'ncm', false),
  ('Tanahun', 5, 'ncm', false),
  ('Nawalparasi West', 5, 'ncm', false),
  ('Rupandehi', 5, 'ncm', false),
  ('Kapilvastu', 5, 'ncm', false),
  ('Arghakhanchi', 5, 'ncm', false),
  ('Gulmi', 5, 'ncm', false),
  ('Palpa', 5, 'ncm', false),
  ('Dang', 5, 'ncm', false),
  ('Bardiya', 5, 'ncm', false),
  ('Banke', 5, 'ncm', false),
  ('Pyuthan', 6, 'ncm', false),
  ('Rolpa', 6, 'ncm', false),
  ('Rukum West', 6, 'ncm', false),
  ('Salyan', 6, 'ncm', false),
  ('Dolpa', 6, 'ncm', false),
  ('Jumla', 6, 'ncm', false),
  ('Mugu', 6, 'ncm', false),
  ('Humla', 6, 'ncm', false),
  ('Kalikot', 6, 'ncm', false),
  ('Dailekh', 6, 'ncm', false),
  ('Surkhet', 6, 'ncm', false),
  ('Bajhang', 7, 'ncm', false),
  ('Bajura', 7, 'ncm', false),
  ('Achham', 7, 'ncm', false),
  ('Doti', 7, 'ncm', false),
  ('Darchula', 7, 'ncm', false),
  ('Baitadi', 7, 'ncm', false),
  ('Dadeldhura', 7, 'ncm', false),
  ('Kailali', 7, 'ncm', false),
  ('Kanchanpur', 7, 'ncm', false)
ON CONFLICT DO NOTHING;
