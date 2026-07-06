-- Add per_unit to pricing_model enum for Service Library
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'pricing_model' AND e.enumlabel = 'per_unit'
  ) THEN
    ALTER TYPE public.pricing_model ADD VALUE 'per_unit';
  END IF;
END $$;
