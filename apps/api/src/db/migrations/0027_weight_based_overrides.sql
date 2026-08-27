-- ============================================================
-- Replace single delivery charge override with weight-based tiers
-- stored as JSONB. Tiers shape: Array<{ weightKg: number; price: number }>
-- ============================================================

DO $$ BEGIN
  ALTER TABLE courier_district_mappings DROP COLUMN IF EXISTS delivery_charge_override;
EXCEPTION WHEN others THEN null; END $$;

ALTER TABLE courier_district_mappings ADD COLUMN IF NOT EXISTS delivery_charge_overrides JSONB;
