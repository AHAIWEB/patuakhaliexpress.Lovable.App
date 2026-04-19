-- Add icon, accent_color, and is_sponsored columns to home_sections via config jsonb (already exists), 
-- but we'll add a sponsored variant via existing variant text. No schema change needed for config items.
-- However, add a "sponsored" allowed value is just text. Do nothing schema-wise.
-- This migration is a no-op placeholder for documentation; safe to skip.
SELECT 1;