import { useMemo, type CSSProperties } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/types";
import type { BrandKit, Client, Quotation } from "@/lib/types";
import { getQuotationServiceBlocks, getQuotationTotalsForDisplay } from "@/lib/quotationServiceBlocks";
import { RichTextDisplay } from "@/components/ui/RichText";
import { DEFAULT_PAYMENT_TERMS, DEFAULT_TERMS_CONDITIONS } from "@/lib/quotationDefaults";

export type QuotationLayoutMode = "screen" | "print";

type Props = {
  quotation: Quotation;
  brandKit?: BrandKit | null;
  mode?: QuotationLayoutMode;
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};
const DEFAULT_PROCESS_PHASES = [
  {
    phase: "Discovery",
    description: "Requirements & Research"
  },
  {
    phase: "Concept Development",
    description: "Create Design Concepts"
  },
  {
    phase: "Feedback & Revisions",
    description: "Review & Improvements"
  },
  {
    phase: "Finalization",
    description: "Final Files Delivery"
  },
  {
    phase: "Brand Guidelines",
    description: "Usage Guidelines Document"
  }
];
export function QuotationLayout({ quotation, brandKit, mode = "screen" }: Props) {
  const totals = useMemo(() => {
    const safe = getQuotationTotalsForDisplay(quotation);
    return {
      subtotal: Number(safe.subtotal || 0),
      discount: Number(quotation.discount || 0),
      tax: Number(quotation.tax_amount || 0),
      total: Number(safe.total || 0),
      one_time_total: Number(safe.one_time_total || 0),
      monthly_total: Number(safe.monthly_total || 0),
    };
  }, [quotation]);

  const brandColor = brandKit?.primary_color || "#111827";
  const companyName = brandKit?.company_name || "Triple S Production";
  // 
  const serviceBlocks = useMemo(() => {
    return getQuotationServiceBlocks(quotation);
  }, [quotation]);
  // console.log("SERVICE BLOCKS REVIEW", serviceBlocks);
  // console.log("QUOTATION", quotation);

  // About Project dynamic summary generator if introduction is empty
  const generatedIntroduction = useMemo(() => {
    if (quotation.introduction && quotation.introduction.trim()) {
      return quotation.introduction;
    }
    const clientName = quotation.client?.business_name || quotation.client?.name || "Client";
    const bizType = quotation.client?.business_type || "";
    const industry = quotation.client?.industry || "";
    const servicesStr = serviceBlocks.length > 0
      ? serviceBlocks.map((s) => s.service_name).join(", ")
      : "our professional services";

    return `Brand Identity Package for ${clientName}${bizType || industry
      ? ` that operates in the ${[bizType, industry].filter(Boolean).join(" / ")} space.`
      : "."
      } We will create a branding package that includes creating a consistent visual system, brand guidelines, and high-quality deliverables including ${servicesStr}. This proposal outlines the proposed scope of work, deliverables, and commercial terms for the services discussed.`;
  }, [quotation.introduction, quotation.client, serviceBlocks]);

  // Payment Terms Fallback
  const resolvedPaymentTerms = useMemo(() => {
    if (quotation.payment_terms_text && quotation.payment_terms_text.trim()) {
      return quotation.payment_terms_text;
    }
    return DEFAULT_PAYMENT_TERMS
      .replace(/{{Company Name}}/g, companyName)
      .replace(/{{Client Name}}/g, quotation.client?.business_name || quotation.client?.name || "Client")
      .replace(/{{X}}/g, "50")
      .replace(/{{Y}}/g, "15");
  }, [quotation.payment_terms_text, companyName, quotation.client]);


  // Terms & Conditions Fallback
  const resolvedTermsConditions = useMemo(() => {
    if (quotation.terms_conditions_text && quotation.terms_conditions_text.trim()) {
      return quotation.terms_conditions_text;
    }
    return DEFAULT_TERMS_CONDITIONS
      .replace(/{{Company Name}}/g, companyName)
      .replace(/{{Client Name}}/g, quotation.client?.business_name || quotation.client?.name || "Client");
  }, [quotation.terms_conditions_text, companyName, quotation.client]);

  // Parse service timeline steps
  const getTimelineSteps = (timeline: string | null | undefined) => {
    if (!timeline) return [];
    return timeline
      .split(/,|->|=>|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const client = quotation.client;

  return (
    <div
      className={`bg-white text-gray-800 font-sans shadow-lg mx-auto w-full max-w-[840px] p-6 md:p-12 border border-gray-200/80 rounded-2xl print:shadow-none print:border-none print:p-0 ${mode === "print" ? "print-layout" : ""
        }`}
      data-quotation-doc
      style={{
        "--doc-accent": brandColor,
        "--font-heading": brandKit?.font_heading ? `'${brandKit.font_heading}', sans-serif` : "inherit",
        "--font-body": brandKit?.font_body ? `'${brandKit.font_body}', sans-serif` : "inherit",
      } as CSSProperties}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-8 mb-8">
        <div>
          {brandKit?.logo_url ? (
            <img src={brandKit.logo_url} alt="Logo" className="h-12 w-auto object-contain mb-4" />
          ) : (
            <div className="h-18 w-48 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-200/60 mb-4 overflow-hidden">
              <img
                src="/triplesimage.png"
                alt="Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `<span class="font-bold text-lg text-primary">${companyName.charAt(0)}</span>`;
                  }
                }}
              />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>
            {quotation.title || "Brand Identity Design"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Project Name: {quotation.title || "Brand Identity Design"} for {client?.business_name || client?.name || "Client"}
          </p>
        </div>

        <div className="text-left sm:text-right text-sm space-y-1 sm:self-start bg-gray-50/50 p-4 rounded-xl border border-gray-100 min-w-[200px]">
          <div className="flex justify-between sm:justify-end gap-4">
            <span className="text-gray-500">Quote No:</span>
            <span className="font-semibold text-gray-900">{quotation.quotation_number?.slice(-4)}</span>
          </div>
          <div className="flex justify-between sm:justify-end gap-4">
            <span className="text-gray-500">Date:</span>
            <span className="font-medium text-gray-800">{formatDate(quotation.quote_date)}</span>
          </div>
          <div className="flex justify-between sm:justify-end gap-4">
            <span className="text-gray-500">Valid Until:</span>
            <span className="font-medium text-gray-800">{formatDate(quotation.valid_until)}</span>
          </div>
        </div>
      </div>

      {/* From / To Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 pb-8 mb-8">
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">From</h3>
          <div className="text-sm space-y-1">
            <p className="font-bold text-gray-900">{companyName}</p>
            {brandKit?.address && <p className="text-gray-600 whitespace-pre-wrap">{brandKit.address}</p>}
            {brandKit?.phone && <p className="text-gray-600">Phone: {brandKit.phone}</p>}
            {brandKit?.email && <p className="text-gray-600">Email: {brandKit.email}</p>}
            {brandKit?.website && <p className="text-gray-600">Website: {brandKit.website}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">To</h3>
          <div className="text-sm space-y-1">
            <p className="font-bold text-gray-900">{client?.business_name || client?.name || "—"}</p>
            {client?.name && client?.business_name && (
              <p className="text-gray-500 text-xs">Attn: {client.name}</p>
            )}
            {client?.address && <p className="text-gray-600 whitespace-pre-wrap">{client.address}</p>}
            {client?.location && <p className="text-gray-600">Location: {client.location}</p>}
            {client?.email && <p className="text-gray-600">Email: {client.email}</p>}
            {client?.phone && <p className="text-gray-600">Phone: {client.phone}</p>}
            {client?.gst_number && <p className="text-gray-600">GSTIN: {client.gst_number}</p>}
          </div>
        </div>
      </div>

      {/* About Project Section */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          About the Project
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {generatedIntroduction}
        </p>
      </div>

      {/* Deliverables Section (Table) */}

      {/* Scope Of Work Section */}
      {serviceBlocks.some((s) => s.scope_of_work) && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Scope of Work
          </h3>
          <div className="space-y-4">
            {serviceBlocks
              .filter((s) => s.scope_of_work)
              .map((s, idx) => (

                <div key={idx} className="space-y-1">
                  <h4 className="text-xs font-semibold text-gray-800">{s.service_name}</h4>
                  <RichTextDisplay content={s.scope_of_work || ""} className="text-sm text-gray-600 leading-relaxed" />

                </div>
              ))}
          </div>
        </div>
      )}


      {serviceBlocks.some((s) => s.deliverables) && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Deliverables Details
          </h3>
          <div className="space-y-4">
            {serviceBlocks
              .filter((s) => s.deliverables)
              .map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="text-xs font-semibold text-gray-800">{s.service_name}</h4>
                  <RichTextDisplay content={s.deliverables || ""} className="text-sm text-gray-600 leading-relaxed" />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Timeline Section */}
      {serviceBlocks.some((s) => s.timeline) && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Project Timeline
          </h3>
          <div className="space-y-4">
            {serviceBlocks
              .filter((s) => s.timeline)
              .map((s, idx) => {
                const steps = getTimelineSteps(s.timeline);
                return (
                  <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-900">{s.service_name}</h4>
                    {steps.length > 1 ? (
                      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 py-2">
                        {steps.map((step, stepIdx) => (
                          <div key={stepIdx} className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary font-bold">
                              {stepIdx + 1}
                            </div>
                            <span className="text-xs text-gray-700 font-medium">{step}</span>
                            {stepIdx < steps.length - 1 && (
                              <span className="hidden sm:inline-block text-gray-300 text-xs">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">
                        Estimated duration: <span className="font-semibold text-gray-800">{s.timeline}</span>
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Process Section */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          Methodology & Process
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {DEFAULT_PROCESS_PHASES.map((p, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/5 px-2 py-1 rounded-md">
                  Phase {idx + 1}
                </span>
                <h4 className="text-xs font-bold text-gray-900 mt-2">{p.phase}</h4>
                <p className="text-[11px] text-gray-500 leading-normal mt-1">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Terms, Conditions and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8 mb-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              Payment Terms
            </h3>
            <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
              {resolvedPaymentTerms}
            </div>
          </div>

          {quotation.notes && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                Notes
              </h3>
              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                {quotation.notes}
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Terms & Conditions
          </h3>
          <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
            {resolvedTermsConditions}
          </div>
        </div>
      </div>


      {/* Deliverable Details Section */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          Deliverables
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Deliverable
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">
                  Price
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">
                  Timeline
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceBlocks.length > 0 ? (
                serviceBlocks.map((s, idx) => (
                  <tr key={`${s.service_id}-${idx}`}>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {s.service_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[450px]">
                      <RichTextDisplay
                        content={s.description || "—"}
                        className="text-xs text-gray-500 whitespace-normal"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span>
                          {formatCurrency(s.price, quotation.currency)}
                        </span>

                        {s.billing_type === "milestone" &&
                          Array.isArray(s.milestone_template) &&
                          s.milestone_template.length > 0 && (
                            <div className="mt-2 text-[11px] text-gray-500 border-t pt-2 min-w-[180px]">
                              {s.milestone_template.map((m, i) => (
                                <div key={i} className="flex justify-between">
                                  <span>{m.label}</span>
                                  <span>
                                    {formatCurrency(
                                      Number(m.amount || 0),
                                      quotation.currency
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right whitespace-nowrap">
                      {s.timeline || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                    No deliverables defined.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Pricing Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-full sm:max-w-md bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(totals.subtotal, quotation.currency)}
            </span>
          </div>

          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span>-{formatCurrency(totals.discount, quotation.currency)}</span>
            </div>
          )}

          {totals.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax ({quotation.tax_rate}%):</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(totals.tax, quotation.currency)}
              </span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
            <span className="text-base font-bold text-gray-900">Grand Total:</span>
            <span className="text-xl font-extrabold text-primary" style={{ color: brandColor }}>
              {formatCurrency(totals.total, quotation.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="border-t border-gray-100 pt-8 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Client Signature</p>
            <div className="border-b border-dashed border-gray-300 h-16" />
            <div className="text-xs text-gray-500">
              <p className="font-semibold text-gray-700">{client?.name || "Client Representative"}</p>
              <p>{client?.business_name || "Client Company"}</p>
              {/* <p className="text-[10px] mt-1 text-gray-400">Date: ____ / ____ / ________</p> */}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Authorized Signatory</p>
            <div className="border-b border-dashed border-gray-300 h-16" />
            <div className="text-xs text-gray-500">
              <p className="font-semibold text-gray-700">Triple S Production Representative</p>
              <p>{companyName}</p>
              {/* <p className="text-[10px] mt-1 text-gray-400">Date: ____ / ____ / ________</p> */}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-8 pt-4 border-t border-gray-50">
          By signing above, the client agrees to the terms and conditions outlined in this Quotation document.
        </p>
      </div>
    </div>
  );
}
