import type { Quotation, Currency } from "@/lib/types";
import type { MilestoneItem } from "@/components/quotation/milestoneCal";
import {
  createMilestone
} from "@/components/quotation/milestoneCal";


/**
 * Phase 1: Multi-service quotation preparation (internal-only).
 *
 * We introduce a "service blocks" concept that can eventually represent multiple
 * services inside a single quotation *without changing the current UI*.
 *
 * IMPORTANT SAFETY:
 * - We DO NOT persist runtime wrapping for legacy quotations.
 * - We DO NOT reuse the existing `quotation.services` field because the UI uses it
 *   as line items (qty/unit price). This is a separate, additive model.
 */

export type QuotationServiceBlockBillingType =
  | "one_time"
  | "monthly"
  | "retainer"
  | "milestone";

// export type QuotationServiceBlock = {
//   service_id: string;
//   service_name: string;
//   description: string;

//   /** Category/subcategory captured at time of quotation for stable rendering */
//   category?: string;
//   subcategory?: string;

//   scope_of_work: string;
//   deliverables?: string;
//   timeline?: string;

//   /**
//    * For one-time: total price
//    * For monthly: monthly amount
//    */
//   price: number;

//   /** One-time vs monthly (Phase 2). Defaults to one_time for legacy quotations. */
//   billing_type?: QuotationServiceBlockBillingType;

//   /** Only for monthly retainers */
//   duration_months?: number;

//   /** Service-specific payment terms (optional) */
//   payment_terms?: string;
//   /** Service-specific terms (optional) */
//   service_terms?: string;
// };

export type QuotationServiceBlock = {

  service_id: string;
  service_name: string;
  description: string;

  category?: string;
  subcategory?: string;

  scope_of_work: string;
  deliverables?: string;
  timeline?: string;

  price: number;
  duration_months?: number;

  monthly_amount?: number;

  billing_type?: QuotationServiceBlockBillingType;

  payment_terms?: string;
  service_terms?: string;
  terms_conditions_text?: string; // NEW — auto-filled from this service's category, editable

  milestone_count?: number;
  milestone_template?: MilestoneItem[];

invoice_progress?: {
    generated: number;
    total: number;
    completed: boolean;
  };

  /** Dynamic pricing configuration state (Phase 2/3 feature). Optional — only present for services with a matching ServiceConfig. */
  service_config?: import("@/lib/pricing-engine").ServiceConfigState;

};


function normalizeText(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function sumServiceBlockPrices(blocks: QuotationServiceBlock[]): number {
  return blocks.reduce((sum, b) => sum + normalizeNumber(b.price), 0);
}

export function getServiceBlockBillingType(
  block: QuotationServiceBlock
): QuotationServiceBlockBillingType {
  return (
    block.billing_type || "one_time"
  ) as QuotationServiceBlockBillingType;
}

export function getServiceBlockTotals(blocks: QuotationServiceBlock[]): {
  one_time: number;
  monthly: number;
  total: number;
} {
  const one_time = blocks
    .filter(
      (b) =>
        getServiceBlockBillingType(b) === "one_time" ||
        getServiceBlockBillingType(b) === "milestone"
    )
    .reduce((sum, b) => sum + normalizeNumber(b.price), 0);

  // const monthly = blocks
  //   .filter((b) => getServiceBlockBillingType(b) === "monthly")
  //   .reduce((sum, b) => {
  //     const months = typeof b.duration_months === "number" && Number.isFinite(b.duration_months) ? b.duration_months : 1;
  //     return sum + normalizeNumber(b.price) * Math.max(1, months);
  //   }, 0);
  const monthly = blocks
    .filter(b => getServiceBlockBillingType(b) === "monthly")
    .reduce((sum, b) => sum + normalizeNumber(b.price), 0);

  return { one_time, monthly, total: one_time + monthly };
}

/**
 * Returns a runtime-only view of service blocks for a quotation.
 *
 * If the quotation already has persisted `service_blocks`, we use them.
 * Otherwise we wrap the legacy single-service fields into ONE default block.
 *
 * This function never mutates or persists the quotation.
 */
export function getQuotationServiceBlocks(q: Quotation): QuotationServiceBlock[] {
  const existing = (q as Partial<Quotation> & { service_blocks?: unknown }).service_blocks;
  if (Array.isArray(existing)) {
    // Soft-validate shape but keep it permissive for backward compatibility.
    return existing
      .filter(Boolean)
      .map((raw) => {
        const r = raw as Record<string, unknown>;

        return {
          service_id: normalizeText(r.service_id) || "default",

          service_name:
            normalizeText(r.service_name) ||
            q.title ||
            "Service",

          description: normalizeText(r.description),

          category:
            normalizeText(r.category) || undefined,

          subcategory:
            normalizeText(r.subcategory) || undefined,

          scope_of_work:
            normalizeText(r.scope_of_work),

          deliverables:
            normalizeText(r.deliverables) || undefined,

          timeline:
            normalizeText(r.timeline) || undefined,

          price:
            normalizeNumber(r.price),

          service_terms:
            normalizeText(r.service_terms) || undefined,

          terms_conditions_text:
            normalizeText(r.terms_conditions_text) || undefined,

          billing_type: (
            r.billing_type === "one_time" ||
              r.billing_type === "monthly" ||
              r.billing_type === "milestone" ||
              r.billing_type === "retainer"
              ? r.billing_type
              : "one_time"
          ) as QuotationServiceBlockBillingType,

          duration_months:
            normalizeNumber(r.duration_months) || undefined,

          monthly_amount:
            r.monthly_amount != null
              ? normalizeNumber(r.monthly_amount)
              : undefined,

          payment_terms:
            normalizeText(r.payment_terms) || undefined,

          service_terms:
            normalizeText(r.service_terms) || undefined,

          milestone_template: Array.isArray(r.milestone_template)
            ? (r.milestone_template as any[]).map((m, index) => ({
              id: m.id ?? createMilestone(index).id,

              label: String(m.label ?? ""),

              percentage: Number(m.percentage ?? 0),

              amount: Number(m.amount ?? 0),
            }))
            : [],

          invoice_progress:
            r.invoice_progress != null
              ? (r.invoice_progress as {
                generated: number;
                total: number;
                completed: boolean;
              })
              : {
                generated: 0,

                total:
                  r.billing_type === "milestone"
                    ? Array.isArray(r.milestone_template)
                      ? r.milestone_template.length
                      : 1
                    : r.billing_type === "monthly"
                      ? Number(r.duration_months ?? 1)
                      : 1,

                completed: false,
              },

        } satisfies QuotationServiceBlock;
      });
  }

  // Legacy quotation: wrap into a single default service block.
  // We prefer `total` as the single-service price because the UI already treats
  // `quotation.total` as the final amount.
  const price = normalizeNumber(q.total || q.subtotal);

  return [
    {
      service_id: "default",
      service_name: q.title || "Service",
      description: normalizeText(q.introduction),
      scope_of_work: normalizeText(q.scope_of_work),
      deliverables: undefined,
      timeline: undefined,
      duration_months: 1,
      monthly_amount: undefined,
      price,
      billing_type: "one_time",
      payment_terms: normalizeText(q.payment_terms_text) || undefined,
      service_terms: normalizeText(q.terms_conditions_text) || undefined,
    },
  ];
}

/**
 * Phase 1 total preparation:
 * For future multi-service mode, totals should be derived from service-block prices.
 *
 * For legacy quotations, this returns the legacy `quotation.total` via the wrapped
 * default service block.
 */
export function getQuotationTotalFromServiceBlocks(q: Quotation): number {
  // Phase 2: total is based on sum of service block prices (one-time + monthly).
  return sumServiceBlockPrices(getQuotationServiceBlocks(q));
}

/**
 * Convenience helper for screens/PDFs that need safe totals.
 * Does NOT change stored data.
 */
export function getQuotationTotalsForDisplay(q: Quotation): {
  subtotal: number;
  total: number;
  one_time_total: number;
  monthly_total: number;
  currency: Currency;
} {
  const legacySubtotal = normalizeNumber(q.subtotal);
  const legacyTotal = normalizeNumber(q.total);

  const blocks = getQuotationServiceBlocks(q);
  const byBilling = getServiceBlockTotals(blocks);

  // Keep legacy behavior as fallback: if derived total is 0 but legacy isn't,
  // prefer legacy.
  const total = byBilling.total > 0 || legacyTotal === 0 ? byBilling.total : legacyTotal;

  return {
    subtotal: legacySubtotal,
    total,
    one_time_total: byBilling.one_time,
    monthly_total: byBilling.monthly,
    currency: q.currency,
  };
}
