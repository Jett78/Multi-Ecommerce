-- ============================================================
-- Add delivery charge override to district mappings
-- Allows admins to set a flat delivery charge per district
-- that overrides the live courier price.
-- ============================================================

DO $$ BEGIN
  ALTER TABLE courier_district_mappings ADD COLUMN delivery_charge_override NUMERIC;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
