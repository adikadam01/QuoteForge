import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Type Interfaces ──────────────────────────────────────────────────────────

interface BrandKit {
  company_name?: string;
  logo_url?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  currency?: string;
}

interface Client {
  name?: string;
  business_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: string;
}

interface ServiceBlock {
  service_name?: string;
  description?: string;
  price?: number | string;
  scope_of_work?: string;
  deliverables?: string;
  timeline?: string;
  payment_terms?: string;
  service_terms?: string;
  billing_type?: string;
  duration_months?: number | string;
}

interface LegacyService {
  name?: string;
  description?: string;
  price?: number | string;
  quantity?: number;
}

interface Quotation {
  quotation_number?: string;
  quote_date?: string;
  valid_until?: string;
  subtotal?: number | string;
  discount?: number | string;
  tax_rate?: number | string;
  tax_amount?: number | string;
  total?: number | string;
  notes?: string;
  terms?: string;
  payment_terms?: string;
  client?: Client;
  service_blocks?: ServiceBlock[];
  services?: LegacyService[];
}

interface QuotationPDFProps {
  quotation: Quotation;
  brandKit: BrandKit;
}

// ─── Currency Utilities ───────────────────────────────────────────────────────

function getCurrencySymbol(currency?: string): string {
  const map: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
    CNY: "¥",
    AED: "د.إ",
    SGD: "S$",
  };
  return map[currency?.toUpperCase() ?? ""] ?? "$";
}

function formatCurrency(
  value?: number | string,
  currency?: string
): string {
  const symbol = getCurrencySymbol(currency);
  const num = parseFloat(String(value ?? 0));
  if (isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Date Utility ─────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Pages
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    paddingTop: 22,
    paddingBottom: 52,
    paddingHorizontal: 52,
    color: "#111111",
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 44,
    paddingBottom: 28,
    borderBottomWidth: 1.5,
    borderBottomColor: "#111111",
  },
  logo: {
    width: 64,
    height: 64,
    objectFit: "contain",
  },
  logoFallbackContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },
  logoFallbackText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  companyBlock: {
    alignItems: "flex-end",
    maxWidth: 220,
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  companyDetail: {
    fontSize: 8.5,
    color: "#555555",
    marginBottom: 2.5,
    letterSpacing: 0.3,
  },

  // ── Document Title Block ──
  titleBlock: {
    marginBottom: 40,
  },
  docLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: "#888888",
    textTransform: "uppercase",
    marginBottom: 6,
    fontFamily: "Helvetica",
  },
  docTitle: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: 32,
  },
  metaItem: {
    flexDirection: "column",
  },
  metaLabel: {
    fontSize: 7.5,
    letterSpacing: 2,
    color: "#888888",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10.5,
    color: "#111111",
    fontFamily: "Helvetica-Bold",
  },

  // ── Section ──
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 0.75,
    borderBottomColor: "#CCCCCC",
  },
  sectionLabel: {
    fontSize: 7.5,
    letterSpacing: 3,
    color: "#888888",
    textTransform: "uppercase",
    fontFamily: "Helvetica",
  },
  sectionRule: {
    flex: 1,
    height: 0,
    marginLeft: 12,
  },

  // ── Two-Column Layout ──
  twoCol: {
    flexDirection: "row",
    gap: 32,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: "#888888",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 10.5,
    color: "#111111",
    marginBottom: 10,
    lineHeight: 1.45,
  },
  fieldValueBold: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 10,
  },

  // ── Service Table ──
  tableHeaderRow: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    marginBottom: 0,
  },
  tableColService: {
    flex: 3,
  },
  tableColDesc: {
    flex: 4,
  },
  tableColPrice: {
    flex: 2,
    alignItems: "flex-end",
  },
  tableHeaderText: {
    fontSize: 7.5,
    letterSpacing: 2,
    color: "#888888",
    textTransform: "uppercase",
    fontFamily: "Helvetica",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
    alignItems: "flex-start",
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  tableServiceName: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 3,
  },
  tableServiceBillingTag: {
    fontSize: 7.5,
    color: "#888888",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  tableDesc: {
    fontSize: 9.5,
    color: "#555555",
    lineHeight: 1.5,
  },
  tablePrice: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    textAlign: "right",
  },

  // ── Totals ──
  totalsContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#111111",
    alignItems: "flex-end",
  },
  totalsInner: {
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 9,
    color: "#555555",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 9,
    color: "#111111",
  },
  totalDivider: {
    height: 0.75,
    backgroundColor: "#CCCCCC",
    marginVertical: 10,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },

  // ── Page 2: Scope ──
  scopeServiceBlock: {
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  scopeServiceBlockLast: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  scopeServiceTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 14,
  },
  scopeSubLabel: {
    fontSize: 7.5,
    letterSpacing: 2,
    color: "#888888",
    textTransform: "uppercase",
    marginBottom: 5,
    marginTop: 10,
  },
  scopeBody: {
    fontSize: 9.5,
    color: "#333333",
    lineHeight: 1.6,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 2,
  },
  bulletDot: {
    fontSize: 9.5,
    color: "#888888",
    marginRight: 8,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 9.5,
    color: "#333333",
    flex: 1,
    lineHeight: 1.6,
  },

  // ── Page 3: Terms & Acceptance ──
  termsText: {
    fontSize: 9.5,
    color: "#444444",
    lineHeight: 1.75,
  },
  notesBox: {
    backgroundColor: "#F7F7F7",
    borderLeftWidth: 2,
    borderLeftColor: "#CCCCCC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 2,
  },
  notesText: {
    fontSize: 9.5,
    color: "#444444",
    lineHeight: 1.7,
    fontFamily: "Helvetica-Oblique",
  },
  acceptanceGrid: {
    flexDirection: "row",
    gap: 28,
    marginTop: 12,
  },
  acceptanceField: {
    flex: 1,
  },
  signatureLine: {
    height: 1,
    backgroundColor: "#111111",
    marginBottom: 6,
    marginTop: 32,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#888888",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 0.75,
    borderTopColor: "#CCCCCC",
    marginTop: 32,
  },
  footerPreparedBy: {
    fontSize: 8,
    color: "#888888",
    letterSpacing: 0.5,
  },
  footerCompany: {
    fontSize: 19,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  footerPageNum: {
    fontSize: 8,
    color: "#AAAAAA",
  },

  // ── Page number ──
  pageNumber: {
    position: "absolute",
    bottom: 28,
    right: 52,
    fontSize: 8,
    color: "#BBBBBB",
    letterSpacing: 0.5,
  },
});

// ─── Sub-Components ───────────────────────────────────────────────────────────

const PageHeader: React.FC<{ brandKit: BrandKit }> = ({ brandKit }) => (
  <View style={styles.headerRow}>
    {/* Logo */}
    <Image src="/triplesimage.png" style={styles.logo}
/>

    {/* Company details */}
    <View style={styles.companyBlock}>
      <Text style={styles.companyName}>
        {brandKit.company_name ?? "Triple S Production"}
      </Text>
      {brandKit.website && (
        <Text style={styles.companyDetail}>{brandKit.website}</Text>
      )}
      {brandKit.email && (
        <Text style={styles.companyDetail}>{brandKit.email}</Text>
      )}
      {brandKit.phone && (
        <Text style={styles.companyDetail}>{brandKit.phone}</Text>
      )}
      {brandKit.address && (
        <Text style={styles.companyDetail}>{brandKit.address}</Text>
      )}
    </View>
  </View>
);

const SectionHeading: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionLabel}>{label}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const QuotationPDF: React.FC<QuotationPDFProps> = ({
  quotation,
  brandKit,
}) => {
  const currency = brandKit.currency;

  // Resolve service blocks — prefer service_blocks, fall back to legacy services
  const serviceBlocks: ServiceBlock[] =
    quotation.service_blocks && quotation.service_blocks.length > 0
      ? quotation.service_blocks
      : (quotation.services ?? []).map((s) => ({
          service_name: s.name,
          description: s.description,
          price: s.price,
        }));

  const subtotal = parseFloat(String(quotation.subtotal ?? 0));
  const discount = parseFloat(String(quotation.discount ?? 0));
  const taxAmount = parseFloat(String(quotation.tax_amount ?? 0));
  const total = parseFloat(String(quotation.total ?? 0));
  const taxRate = parseFloat(String(quotation.tax_rate ?? 0));

  const hasDiscount = !isNaN(discount) && discount > 0;
  const hasTax = !isNaN(taxAmount) && taxAmount > 0;

  const client = quotation.client ?? {};

  // ── Page 1 ──────────────────────────────────────────────────────────────────
  const page1 = (
    <Page size="A4" style={styles.page}>
      <PageHeader brandKit={brandKit} />

      {/* Document title block */}
      <View style={styles.titleBlock}>
        <Text style={styles.docLabel}>Proposal</Text>
        <Text style={styles.docTitle}>Quotation</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Reference</Text>
            <Text style={styles.metaValue}>
              {quotation.quotation_number ?? "—"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>
              {formatDate(quotation.quote_date)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Valid Until</Text>
            <Text style={styles.metaValue}>
              {formatDate(quotation.valid_until)}
            </Text>
          </View>
        </View>
      </View>

      {/* Client Details */}
      <View style={styles.section}>
        <SectionHeading label="Prepared For" />
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Contact</Text>
            <Text style={styles.fieldValueBold}>{client.name ?? "—"}</Text>

            {client.business_name && (
              <>
                <Text style={styles.fieldLabel}>Organisation</Text>
                <Text style={styles.fieldValue}>{client.business_name}</Text>
              </>
            )}
          </View>
          <View style={styles.col}>
            {client.email && (
              <>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldValue}>{client.email}</Text>
              </>
            )}
            {client.phone && (
              <>
                <Text style={styles.fieldLabel}>Phone</Text>
                <Text style={styles.fieldValue}>{client.phone}</Text>
              </>
            )}
            {(client.address || client.location) && (
              <>
                <Text style={styles.fieldLabel}>Location</Text>
                <Text style={styles.fieldValue}>
                  {[client.address, client.location]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Services Table */}
      <View style={styles.section}>
        <SectionHeading label="Services" />

        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <View style={styles.tableColService}>
            <Text style={styles.tableHeaderText}>Service</Text>
          </View>
          <View style={styles.tableColDesc}>
            <Text style={styles.tableHeaderText}>Description</Text>
          </View>
          <View style={styles.tableColPrice}>
            <Text style={styles.tableHeaderText}>Amount</Text>
          </View>
        </View>

        {/* Table Rows */}
        {serviceBlocks.map((block, i) => {
          const isLast = i === serviceBlocks.length - 1;
          return (
            <View
              key={i}
              style={isLast ? styles.tableRowLast : styles.tableRow}
            >
              <View style={styles.tableColService}>
                <Text style={styles.tableServiceName}>
                  {block.service_name ?? `Service ${i + 1}`}
                </Text>
                {block.billing_type && (
                  <Text style={styles.tableServiceBillingTag}>
                    {block.billing_type}
                    {block.duration_months
                      ? ` · ${block.duration_months} mo`
                      : ""}
                  </Text>
                )}
              </View>
              <View style={styles.tableColDesc}>
                <Text style={styles.tableDesc}>
                  {block.description ?? "—"}
                </Text>
              </View>
              <View style={styles.tableColPrice}>
                <Text style={styles.tablePrice}>
                  {formatCurrency(block.price, currency)}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsInner}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(subtotal, currency)}
              </Text>
            </View>

            {hasDiscount && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>
                  − {formatCurrency(discount, currency)}
                </Text>
              </View>
            )}

            {hasTax && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Tax {taxRate > 0 ? `(${taxRate}%)` : ""}
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(taxAmount, currency)}
                </Text>
              </View>
            )}

            <View style={styles.totalDivider} />

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(total || subtotal, currency)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
        fixed
      />
    </Page>
  );

  // ── Page 2: Scope of Work ────────────────────────────────────────────────────
  const scopeBlocks = serviceBlocks.filter(
    (b) => b.scope_of_work || b.deliverables || b.timeline
  );

  const page2 = scopeBlocks.length > 0 ? (
    <Page size="A4" style={styles.page}>
      <PageHeader brandKit={brandKit} />

      <View style={styles.section}>
        <SectionHeading label="Scope of Work" />

        {scopeBlocks.map((block, i) => {
          const isLast = i === scopeBlocks.length - 1;
          return (
            <View
              key={i}
              style={isLast ? styles.scopeServiceBlockLast : styles.scopeServiceBlock}
            >
              <Text style={styles.scopeServiceTitle}>
                {block.service_name ?? `Service ${i + 1}`}
              </Text>

              {block.scope_of_work && (
                <>
                  <Text style={styles.scopeSubLabel}>Scope</Text>
                  {block.scope_of_work.split("\n").map((line, li) =>
                    line.trim() ? (
                      <View key={li} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>·</Text>
                        <Text style={styles.bulletText}>{line.trim()}</Text>
                      </View>
                    ) : null
                  )}
                </>
              )}

              {block.deliverables && (
                <>
                  <Text style={styles.scopeSubLabel}>Deliverables</Text>
                  {block.deliverables.split("\n").map((line, li) =>
                    line.trim() ? (
                      <View key={li} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>·</Text>
                        <Text style={styles.bulletText}>{line.trim()}</Text>
                      </View>
                    ) : null
                  )}
                </>
              )}

              {block.timeline && (
                <>
                  <Text style={styles.scopeSubLabel}>Timeline</Text>
                  <Text style={styles.scopeBody}>{block.timeline}</Text>
                </>
              )}
            </View>
          );
        })}
      </View>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
        fixed
      />
    </Page>
  ) : null;

  // ── Page 3: Terms & Acceptance ───────────────────────────────────────────────
  const paymentTermsContent =
    quotation.payment_terms ||
    serviceBlocks.find((b) => b.payment_terms)?.payment_terms;

  const termsContent =
    quotation.terms ||
    serviceBlocks.find((b) => b.service_terms)?.service_terms;

  const page3 = (
    <Page size="A4" style={styles.page}>
      <PageHeader brandKit={brandKit} />

      {/* Payment Terms */}
      {paymentTermsContent && (
        <View style={styles.section}>
          <SectionHeading label="Payment Terms" />
          <Text style={styles.termsText}>{paymentTermsContent}</Text>
        </View>
      )}

      {/* Terms & Conditions */}
      {termsContent && (
        <View style={styles.section}>
          <SectionHeading label="Terms & Conditions" />
          <Text style={styles.termsText}>{termsContent}</Text>
        </View>
      )}

      {/* Notes */}
      {/* {quotation.notes && (
        <View style={styles.section}>
          <SectionHeading label="Notes" />
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{quotation.notes}</Text>
          </View>
        </View>
      )} */}

      {/* Client Acceptance */}
      <View style={styles.section}>
        <SectionHeading label="Client Acceptance" />
        <Text style={{ fontSize: 9.5, color: "#2c2c2cff", marginBottom: 8, lineHeight: 1.6 }}>
          By signing below, the client agrees to the scope of work, pricing, and
          terms outlined in this quotation.
        </Text>

        <View style={styles.acceptanceGrid}>
          <View style={styles.acceptanceField}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Client Name</Text>
            {client.name && (
              <Text style={{ fontSize: 9, color: "#444444ff", marginTop: 3 }}>
                {client.name}
              </Text>
            )}
          </View>
          <View style={styles.acceptanceField}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature</Text>
          </View>
          <View style={styles.acceptanceField}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.footerPreparedBy}>Prepared by</Text>
          <Text style={styles.footerCompany}>
            {brandKit.company_name ?? "Triple S Production"}
          </Text>
        </View>
        <Text style={styles.footerPageNum}>
          {`Quotation ${quotation.quotation_number ?? ""}`}
        </Text>
      </View>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
        fixed
      />
    </Page>
  );

  return (
    <Document
      title={`Quotation ${quotation.quotation_number ?? ""} — ${
        brandKit.company_name ?? "Triple S Production"
      }`}
      author={brandKit.company_name ?? "Triple S Production"}
    >
      {page1}
      {page2}
      {page3}
    </Document>
  );
};

export default QuotationPDF;