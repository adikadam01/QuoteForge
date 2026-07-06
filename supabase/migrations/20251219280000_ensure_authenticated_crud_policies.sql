-- Ensure authenticated CRUD access for internal app tables.
-- Idempotent: only creates policies if missing.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'brand_kit',
    'clients',
    'services',
    'quotations',
    'quotation_services',
    'quotation_terms',
    'service_addons',
    'invoices',
    'invoice_items',
    'quotation_point_templates',
    'quotation_versions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- SELECT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname=format('Authenticated users can view %s', t)
    ) THEN
      EXECUTE format('CREATE POLICY "Authenticated users can view %s" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
    END IF;

    -- INSERT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname=format('Authenticated users can insert %s', t)
    ) THEN
      EXECUTE format('CREATE POLICY "Authenticated users can insert %s" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t, t);
    END IF;

    -- UPDATE
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname=format('Authenticated users can update %s', t)
    ) THEN
      EXECUTE format('CREATE POLICY "Authenticated users can update %s" ON public.%I FOR UPDATE TO authenticated USING (true)', t, t);
    END IF;

    -- DELETE (internal tool; safe for authenticated)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname=format('Authenticated users can delete %s', t)
    ) THEN
      EXECUTE format('CREATE POLICY "Authenticated users can delete %s" ON public.%I FOR DELETE TO authenticated USING (true)', t, t);
    END IF;
  END LOOP;
END $$;
