-- Acceptance metadata + quotation version snapshots

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS accepted_by_name text,
  ADD COLUMN IF NOT EXISTS accepted_by_email text,
  ADD COLUMN IF NOT EXISTS signature_data text;

-- Immutable quotation snapshots for audit-safe history
CREATE TABLE IF NOT EXISTS public.quotation_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quotation_id uuid NOT NULL,
  version_number integer NOT NULL,
  event_type text NOT NULL, -- 'sent' | 'accepted' | 'revision'
  snapshot jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid,
  CONSTRAINT quotation_versions_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS quotation_versions_unique_per_quote
  ON public.quotation_versions (quotation_id, version_number);

CREATE INDEX IF NOT EXISTS quotation_versions_quote_id_idx
  ON public.quotation_versions (quotation_id);

ALTER TABLE ONLY public.quotation_versions
  ADD CONSTRAINT quotation_versions_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;

ALTER TABLE public.quotation_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotation_versions' AND policyname='Authenticated users can view quotation_versions'
  ) THEN
    CREATE POLICY "Authenticated users can view quotation_versions" ON public.quotation_versions FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotation_versions' AND policyname='Authenticated users can insert quotation_versions'
  ) THEN
    CREATE POLICY "Authenticated users can insert quotation_versions" ON public.quotation_versions FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;
