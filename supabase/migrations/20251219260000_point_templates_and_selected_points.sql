-- Point-template system for quotations

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_point_section') THEN
    CREATE TYPE public.quotation_point_section AS ENUM ('introduction', 'scope_of_work', 'payment_terms', 'terms_conditions');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.quotation_point_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  section public.quotation_point_section NOT NULL,
  key text NOT NULL,
  title text NOT NULL,
  default_content text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT quotation_point_templates_pkey PRIMARY KEY (id),
  CONSTRAINT quotation_point_templates_key_unique UNIQUE (key)
);

ALTER TABLE public.quotation_point_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotation_point_templates' AND policyname='Authenticated users can view quotation_point_templates'
  ) THEN
    CREATE POLICY "Authenticated users can view quotation_point_templates" ON public.quotation_point_templates FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotation_point_templates' AND policyname='Authenticated users can insert quotation_point_templates'
  ) THEN
    CREATE POLICY "Authenticated users can insert quotation_point_templates" ON public.quotation_point_templates FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotation_point_templates' AND policyname='Authenticated users can update quotation_point_templates'
  ) THEN
    CREATE POLICY "Authenticated users can update quotation_point_templates" ON public.quotation_point_templates FOR UPDATE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotation_point_templates' AND policyname='Authenticated users can delete quotation_point_templates'
  ) THEN
    CREATE POLICY "Authenticated users can delete quotation_point_templates" ON public.quotation_point_templates FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS selected_points jsonb;

-- Seed default templates if empty
INSERT INTO public.quotation_point_templates (section, key, title, default_content, sort_order)
SELECT * FROM (
  VALUES
    ('introduction'::public.quotation_point_section, 'intro.project_overview', 'Project Overview',
     'This quotation outlines the proposed services, scope of work,\n and commercial terms for {{Project / Service Name}}.', 1),
    ('introduction'::public.quotation_point_section, 'intro.engagement_context', 'Engagement Context',
     'The objective of this engagement is to support the client\n with professional creative and marketing services as discussed.', 2),
    ('introduction'::public.quotation_point_section, 'intro.scope_reference', 'Scope Reference Line',
     'Any services not explicitly mentioned in this quotation\n are considered outside the scope.', 3),

    ('scope_of_work'::public.quotation_point_section, 'scope.services_included', 'Services Included',
     'The agency will provide the services listed in this quotation\n as per the agreed scope and timelines.', 1),
    ('scope_of_work'::public.quotation_point_section, 'scope.platforms', 'Platforms / Channels',
     'Services will be executed across agreed platforms such as\n Instagram, Facebook, YouTube, Website, or other mediums.', 2),
    ('scope_of_work'::public.quotation_point_section, 'scope.duration', 'Duration / Frequency',
     'The scope is valid for {{duration / frequency}} unless\n revised in writing.', 3),
    ('scope_of_work'::public.quotation_point_section, 'scope.client_responsibilities', 'Client Responsibilities',
     'The client shall provide timely approvals, access, and\n required materials to ensure smooth execution.', 4),
    ('scope_of_work'::public.quotation_point_section, 'scope.out_of_scope', 'Out-of-Scope Clause',
     'Any additional work beyond this scope will be charged\n separately upon mutual agreement.', 5),

    ('payment_terms'::public.quotation_point_section, 'pay.advance', 'Advance Payment',
     'An advance payment of {{percentage / amount}} is required\n before commencement of work.', 1),
    ('payment_terms'::public.quotation_point_section, 'pay.balance', 'Balance Payment',
     'The remaining balance must be cleared within {{X}} days\n from the date of invoice or delivery.', 2),
    ('payment_terms'::public.quotation_point_section, 'pay.mode', 'Payment Mode',
     'Payments can be made via bank transfer, UPI, or other\n mutually agreed methods.', 3),
    ('payment_terms'::public.quotation_point_section, 'pay.late', 'Late Payment Policy',
     'Delayed payments may result in work being paused until\n outstanding dues are cleared.', 4),
    ('payment_terms'::public.quotation_point_section, 'pay.taxes', 'Taxes',
     'Applicable taxes will be charged as per government norms,\n unless stated otherwise.', 5),

    ('terms_conditions'::public.quotation_point_section, 'tac.revisions', 'Revisions Policy',
     'The quotation includes {{number}} rounds of revisions.\n Additional revisions will be charged separately.', 1),
    ('terms_conditions'::public.quotation_point_section, 'tac.ownership', 'Ownership of Work',
     'All creative assets remain the property of the agency\n until full payment is received.', 2),
    ('terms_conditions'::public.quotation_point_section, 'tac.usage', 'Usage & Portfolio Rights',
     'The agency reserves the right to use completed work\n for portfolio, website, and social media purposes unless\n confidentiality is requested in writing.', 3),
    ('terms_conditions'::public.quotation_point_section, 'tac.confidentiality', 'Confidentiality',
     'All shared information, pricing, and materials are\n confidential and must not be shared with third parties.', 4),
    ('terms_conditions'::public.quotation_point_section, 'tac.cancellation', 'Cancellation & Termination',
     'Either party may discontinue the project with written\n notice. Work completed until that point will be billed.', 5),
    ('terms_conditions'::public.quotation_point_section, 'tac.liability', 'Liability Limitation',
     'The agency shall not be liable for indirect or\n consequential losses arising from the engagement.', 6)
) AS v(section, key, title, default_content, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.quotation_point_templates LIMIT 1);
