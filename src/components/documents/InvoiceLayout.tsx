import { useMemo, type CSSProperties } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { buildSectionsFromSnapshot } from "@/lib/quotationPointSnapshot";
import { formatCurrency } from "@/lib/types";
import type { BrandKit, Invoice, InvoiceItem } from "@/lib/types";

export type InvoiceLayoutMode = "screen" | "print";

type Props = {
  invoice: Invoice;
  items: InvoiceItem[];
  brandKit?: BrandKit | null;
  mode?: InvoiceLayoutMode;
};

const normalizeHex = (hex: string) => {
  const h = hex.trim().replace("#", "");
  if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  return h.length === 6 ? `#${h}` : "";
};

const getContrastText = (bgHex: string) => {
  const hex = normalizeHex(bgHex);
  if (!hex) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62 ? "#111827" : "#ffffff";
};

function firstChar(text: string | null | undefined) {
  const t = (text || "").trim();
  return t ? t[0].toUpperCase() : "I";
}

/**
 * Single source of truth for invoice rendering.
 * Used for both on-screen view and PDF capture.
 */
export function InvoiceLayout({ invoice, items, brandKit, mode = "screen" }: Props) {
  const totals = useMemo(() => {
    return {
      subtotal: Number(invoice.subtotal || 0),
      discount: Number(invoice.discount || 0),
      tax: Number(invoice.tax_amount || 0),
      total: Number(invoice.total || 0),
      due: Number(invoice.amount_due || 0),
    };
  }, [invoice]);

  const rootClassName = mode === "print" ? "doc doc--print" : "doc doc--screen";

  const brandColor = brandKit?.primary_color || "#111827";
  const brandText = getContrastText(brandColor);

  const hasFrom = Boolean(brandKit?.company_name || brandKit?.address || brandKit?.email || brandKit?.phone);

  const pointSections = useMemo(() => {
    // Prefer the invoice snapshot if present, else fallback to the linked quotation.
    const selected = invoice.quotation_selected_points || invoice.quotation?.selected_points;
    if (!selected) return null;

    // UI-only wrapper to reuse the existing snapshot renderer.
    // `buildSectionsFromSnapshot` expects a Quotation-shaped input. We only need `selected_points`.
    // Avoid `any` to satisfy lint rules.
    return buildSectionsFromSnapshot({
      ...(invoice.quotation || ({} as unknown as Invoice["quotation"])),
      selected_points: selected,
    } as unknown as Parameters<typeof buildSectionsFromSnapshot>[0]);
  }, [invoice]);

  const invoiceDate = invoice.sent_at
    ? invoice.sent_at.slice(0, 10)
    : invoice.created_at
      ? invoice.created_at.slice(0, 10)
      : null;

  const statusLabel = invoice.invoice_status?.toUpperCase?.() || "";

  return (
    <div
      className={rootClassName}
      data-invoice-doc
      data-doc-quotation-status={invoice.quotation?.status || 'draft'}
      style={{
        "--doc-accent": brandColor,
        "--font-heading": brandKit?.font_heading ? `'${brandKit.font_heading}', sans-serif` : undefined,
        "--font-body": brandKit?.font_body ? `'${brandKit.font_body}', sans-serif` : undefined,
      } as CSSProperties}
    >
      {/* Header */}
      <Card className="doc-card doc-header">
        <CardContent className="doc-pad">
          <div className="doc-header__top">
            <div className="doc-header__brand">
              {brandKit?.logo_url ? (
                <img src={brandKit.logo_url} alt="Logo" className="doc-logo" />
              ) : (
                <div className="doc-logoFallback" aria-hidden>
                  <span className="doc-logoFallbackText">{firstChar(brandKit?.company_name)}</span>
                </div>
              )}
              <div className="min-w-0">
                <div className="doc-company">{brandKit?.company_name || "Your Company"}</div>
                <div className="doc-meta">{brandKit?.website || brandKit?.email || brandKit?.phone || ""}</div>
              </div>
            </div>

            <div className="doc-badge" style={{ backgroundColor: brandColor, color: brandText }}>
              INVOICE
            </div>
          </div>

          <div className="doc-header__titleRow">
            <div>
              <h1 className="doc-title">Invoice</h1>
              {invoice.client?.business_name || invoice.client?.name ? (
                <p className="doc-subtitle">Billing for {invoice.client.business_name || invoice.client.name}</p>
              ) : null}
            </div>

            <div className="doc-header__metaBox">
              <div className="doc-kv">
                <span className="doc-k">Document #</span>
                <span className="doc-v">{invoice.invoice_number}</span>
              </div>
              {invoiceDate ? (
                <div className="doc-kv">
                  <span className="doc-k">Date</span>
                  <span className="doc-v">{invoiceDate}</span>
                </div>
              ) : null}
              {invoice.due_date ? (
                <div className="doc-kv">
                  <span className="doc-k">Due date</span>
                  <span className="doc-v">{invoice.due_date}</span>
                </div>
              ) : null}
              {statusLabel ? (
                <div className="doc-kv">
                  <span className="doc-k">Status</span>
                  <span className="doc-v">
                    <span className={`doc-statusPill doc-statusPill--${invoice.invoice_status}`}>{statusLabel}</span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="doc-stack">
        {/* Company / Client */}
        <Card className="doc-card">
          <CardContent className="doc-pad">
            <div className="doc-twoCol">
              <div>
                <div className="doc-sectionTitle">From</div>
                <div className="doc-block">
                  <div className="doc-strong">{brandKit?.company_name || "Your Company"}</div>
                  {brandKit?.address ? <div className="doc-meta whitespace-pre-wrap">{brandKit.address}</div> : null}
                  <div className="doc-meta">
                    {[brandKit?.email, brandKit?.phone, brandKit?.website].filter(Boolean).join("  •  ") || (hasFrom ? "" : "—")}
                  </div>
                </div>
              </div>

              <div>
                <div className="doc-sectionTitle">Bill To</div>
                <div className="doc-block">
                  <div className="doc-strong">{invoice.client?.business_name || invoice.client?.name || "—"}</div>
                  {invoice.client?.name && invoice.client?.business_name ? (
                    <div className="doc-meta">Attn: {invoice.client.name}</div>
                  ) : null}
                  {invoice.client?.email ? <div className="doc-meta">{invoice.client.email}</div> : null}
                  {invoice.client?.phone ? <div className="doc-meta">{invoice.client.phone}</div> : null}
                  {invoice.client?.whatsapp ? <div className="doc-meta">WhatsApp: {invoice.client.whatsapp}</div> : null}
                  {invoice.client?.location ? <div className="doc-meta">{invoice.client.location}</div> : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content sections (optional, from quotation snapshot) */}
        {pointSections
          ? pointSections.map((sec) => (
            <Card key={sec.section} className="doc-card">
              <CardContent className="doc-pad">
                <h2 className="doc-sectionTitle">{sec.title}</h2>
                <div className="doc-sectionBody">
                  {sec.points.map((p) => (
                    <div key={p.key} className="doc-paragraphBlock">
                      <div className="doc-paragraphTitle">{p.title}</div>
                      <div className="doc-paragraph whitespace-pre-wrap">{p.content}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
          : null}

        {/* Pricing table */}
        <Card className="doc-card">
          <CardContent className="doc-pad">
            <h2 className="doc-sectionTitle">Pricing</h2>

            <div className="doc-tableWrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Description</th>
                    <th className="num">Qty</th>
                    <th className="num">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="strong">{it.name}</td>
                      <td className="muted whitespace-pre-wrap">{it.description || "—"}</td>
                      <td className="num">{Number(it.quantity || 0)}</td>
                      <td className="num">{formatCurrency(Number(it.total || 0), invoice.currency)}</td>
                    </tr>
                  ))}
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">
                        No items.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="doc-totals">
              <div className="doc-kv">
                <span className="doc-k">Subtotal</span>
                <span className="doc-v">{formatCurrency(totals.subtotal, invoice.currency)}</span>
              </div>
              {totals.discount > 0 ? (
                <div className="doc-kv">
                  <span className="doc-k">Discount</span>
                  <span className="doc-v">-{formatCurrency(totals.discount, invoice.currency)}</span>
                </div>
              ) : null}
              {totals.tax > 0 ? (
                <div className="doc-kv">
                  <span className="doc-k">Tax</span>
                  <span className="doc-v">{formatCurrency(totals.tax, invoice.currency)}</span>
                </div>
              ) : null}

              <div className="doc-totalHighlight" style={{ borderColor: brandColor }}>
                <span className="doc-totalLabel">Total</span>
                <span className="doc-totalValue" style={{ color: brandColor }}>
                  {formatCurrency(totals.total, invoice.currency)}
                </span>
              </div>

              <div className="doc-amountDue" style={{ borderColor: brandColor }}>
                <span className="doc-amountDueLabel">Amount Due</span>
                <span className="doc-amountDueValue" style={{ color: brandColor }}>
                  {formatCurrency(totals.due, invoice.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="doc-card">
          <CardContent className="doc-pad">
            <div className="doc-footerGrid">
              <div>
                <h2 className="doc-sectionTitle">Terms</h2>
                <div className="doc-paragraph whitespace-pre-wrap">{invoice.notes || invoice.quotation?.terms_conditions_text || "—"}</div>
              </div>
              <div>
                <h2 className="doc-sectionTitle">Validity</h2>
                <div className="doc-paragraph">{invoice.due_date ? `Payable by ${invoice.due_date}` : "—"}</div>

                <div className="doc-signature">
                  <div className="doc-signLine" />
                  <div className="doc-meta">Authorized signature</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
