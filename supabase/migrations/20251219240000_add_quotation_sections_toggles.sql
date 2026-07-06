-- Quotation section toggles (visibility only)
-- Stored per quotation so each quote can have different included sections.

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS quotation_sections jsonb;

-- Optional: default structure can be applied in app (not enforced here).
