-- Optional: mark demo/dev seeded records so they can be found and removed later
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false NOT NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false NOT NULL;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false NOT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false NOT NULL;
