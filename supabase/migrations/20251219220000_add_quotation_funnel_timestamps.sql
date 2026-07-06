-- Add Phase-1 funnel tracking timestamps to quotations
-- sent_at: when a quotation is marked as sent
-- accepted_at: when a quotation is approved/accepted

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS quote_date date;

-- Helpful indexes for analytics/funnel queries
CREATE INDEX IF NOT EXISTS quotations_sent_at_idx ON public.quotations (sent_at);
CREATE INDEX IF NOT EXISTS quotations_accepted_at_idx ON public.quotations (accepted_at);
