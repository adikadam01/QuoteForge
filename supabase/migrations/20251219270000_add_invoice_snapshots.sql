-- Store quotation point snapshot on invoice for audit consistency
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS quotation_selected_points jsonb;

-- Optional: store a small immutable quotation header snapshot (title/number/dates) later if needed
