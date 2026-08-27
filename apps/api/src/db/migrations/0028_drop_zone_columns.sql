-- ============================================================
-- Remove unused zone columns from district mappings.
-- Zones are never synced (runSync only syncs cities) and the
-- rate calculation live-fetches zones from the courier API,
-- so the stored zone columns are unused.
-- ============================================================

ALTER TABLE courier_district_mappings DROP COLUMN IF EXISTS courier_zone_id;
ALTER TABLE courier_district_mappings DROP COLUMN IF EXISTS courier_zone_name;
