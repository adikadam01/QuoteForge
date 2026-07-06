-- Core quotation framework: content-backed sections

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS payment_terms_text text,
  ADD COLUMN IF NOT EXISTS terms_conditions_text text;
