-- Invoice generation from quotations
-- Adds invoice_status enum and invoice_items table.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid');
  END IF;
END $$;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Track invoice generation to lock quotations
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS invoiced_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  invoice_id uuid NOT NULL,
  quotation_id uuid,
  service_id uuid,
  name text NOT NULL,
  description text,
  pricing_model public.pricing_model DEFAULT 'fixed'::public.pricing_model NOT NULL,
  quantity numeric(10,2) DEFAULT 1 NOT NULL,
  unit_price numeric(12,2) DEFAULT 0 NOT NULL,
  total numeric(12,2) DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id)
);

ALTER TABLE ONLY public.invoice_items
  ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.invoice_items
  ADD CONSTRAINT invoice_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.invoice_items
  ADD CONSTRAINT invoice_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON public.invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS invoices_quotation_id_idx ON public.invoices (quotation_id);
CREATE INDEX IF NOT EXISTS quotations_invoiced_at_idx ON public.quotations (invoiced_at);

-- RLS policies (match existing patterns)
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoice_items' AND policyname='Authenticated users can view invoice_items'
  ) THEN
    CREATE POLICY "Authenticated users can view invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoice_items' AND policyname='Authenticated users can insert invoice_items'
  ) THEN
    CREATE POLICY "Authenticated users can insert invoice_items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoice_items' AND policyname='Authenticated users can update invoice_items'
  ) THEN
    CREATE POLICY "Authenticated users can update invoice_items" ON public.invoice_items FOR UPDATE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoice_items' AND policyname='Authenticated users can delete invoice_items'
  ) THEN
    CREATE POLICY "Authenticated users can delete invoice_items" ON public.invoice_items FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
