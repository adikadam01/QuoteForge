import type { Quotation } from "@/lib/types";

export type QuotationVersionEvent = "sent" | "accepted" | "revision";

export type QuotationVersionRow = {
  id: string;
  quotation_id: string;
  version_number: number;
  event_type: string;
  snapshot: unknown;
  created_at: string;
};

/**
 * Local-first build: server versioning is not available.
 * These helpers remain for API compatibility and always return null/no-op.
 */
export async function getLatestQuotationVersion(_quotationId: string): Promise<QuotationVersionRow | null> {
  return null;
}

export async function createQuotationVersionSnapshot(_quotation: Quotation, _eventType: QuotationVersionEvent): Promise<void> {
  // no-op
}
