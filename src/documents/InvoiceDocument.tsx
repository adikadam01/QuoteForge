

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type {
  Invoice,
  BrandKit,
  InvoiceItem,
  InvoiceMilestone,
} from "@/lib/types";

type Props = {
  invoice: Invoice;
  brandKit?: BrandKit | null;
  items?: InvoiceItem[];
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    backgroundColor: "#ffffff",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 44,
  },

  // ---------- Header ----------
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerBrand: {
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1,
  },
  logoImage: {
    width: 110,
    height: 36,
    objectFit: "contain",
    marginBottom: 6,
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  companyMeta: {
    fontSize: 9,
    color: "#6B7280",
  },
  badge: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    color: "#ffffff",
  },

  // ---------- Title row ----------
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 20,
    marginBottom: 22,
  },
  docTitle: {
    fontSize: 19,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 3,
  },
  docSubtitle: {
    fontSize: 9.5,
    color: "#6B7280",
  },
  metaBox: {
    width: 190,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  kLabel: {
    fontSize: 9,
    color: "#6B7280",
  },
  vValue: {
    fontSize: 9.5,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
  },
  statusPill: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    textTransform: "uppercase",
  },

  // ---------- Card wrapper (mirrors doc-card on screen) ----------
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 18,
    marginBottom: 16,
  },

  // ---------- From / Bill To ----------
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  col: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  strong: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 2,
    lineHeight: 1.4,
  },

  // ---------- Table ----------
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  colService: { width: "22%" },
  colDescription: { width: "36%" },
  colQty: { width: "10%", textAlign: "right" },
  colRate: { width: "16%", textAlign: "right" },
  colAmount: { width: "16%", textAlign: "right" },
  colMilestone: { width: "55%" },
  colMStatus: { width: "20%", textAlign: "center" },
  colMAmount: { width: "25%", textAlign: "right" },
  tableHeaderText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 9.5,
    color: "#111827",
  },
  cellSubText: {
    fontSize: 8.5,
    color: "#9CA3AF",
    marginTop: 2,
  },
  cellMuted: {
    fontSize: 9.5,
    color: "#9CA3AF",
  },

  // ---------- Totals ----------
  totalsWrap: {
    alignItems: "flex-end",
    marginTop: 14,
  },
  totalsBox: {
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalHighlight: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  amountDueBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    paddingTop: 8,
    marginTop: 8,
  },
  amountDueLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  amountDueValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },

  // ---------- Footer grid (Payment info / Details) ----------
  footerGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paragraph: {
    fontSize: 9,
    color: "#374151",
    marginTop: 4,
    lineHeight: 1.5,
  },
  signature: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  signLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#9CA3AF",
    width: 150,
    marginTop: 40,
  },

  // ---------- Page footer ----------
  pageFooter: {
    position: "absolute",
    bottom: 22,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pageFooterText: {
    fontSize: 8,
    color: "#9CA3AF",
  },
  signatureImage: {
    width: 120,
    height: 45,
    objectFit: "contain",
    marginTop: 30, // pushes it down like the old blank space before the line did
    marginBottom: -8, // pulls the line up slightly so the image sits just above it
  },
});

function formatCurrency(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return `${currency} 0.00`;
  return `${currency} ${Number(amount).toFixed(2)}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatusColor(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "paid": return "#16a34a";
    case "overdue": return "#dc2626";
    case "sent": return "#2563eb";
    case "draft": return "#6b7280";
    default: return "#6b7280";
  }
}

const InvoiceDocument: React.FC<Props> = ({ invoice, brandKit, items: passedItems }) => {
  const currency = invoice.currency ?? "INR";
  const primaryColor = brandKit?.primary_color ?? "#111827";
  const displayStatus = invoice.invoice_status ?? invoice.status ?? "draft";
  const isMilestone =
    invoice.type === "milestone" &&
    Array.isArray(invoice.milestones) &&
    invoice.milestones.length > 0;

  const items = passedItems || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header: logo/company left, INVOICE badge right */}
        <View style={styles.headerTop}>
          <View style={styles.headerBrand}>
            {brandKit?.company_name ? (
              <Image src="/triplesimage.png" style={styles.logoImage} />
            ) : (
              <Text style={styles.companyName}>
                {brandKit?.company_name || "Company Name"}
              </Text>
            )}
            <Text style={styles.companyMeta}>
              {brandKit?.website || brandKit?.email || brandKit?.phone || ""}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: primaryColor }]}>
            <Text>INVOICE</Text>
          </View>
        </View>

        {/* Title row: Invoice / Billing for X  ---  meta box */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.docTitle}>Invoice</Text>
            <Text style={styles.docSubtitle}>
              Billing for {invoice.client?.business_name || invoice.client?.name || "Client"}
            </Text>
          </View>

          <View style={styles.metaBox}>
            <View style={styles.kvRow}>
              <Text style={styles.kLabel}>Invoice</Text>
              <Text style={styles.vValue}>INV-{(invoice.invoice_number || "").slice(-4)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kLabel}>Issue date</Text>
              <Text style={styles.vValue}>{formatDate(invoice.sent_at || invoice.created_at)}</Text>
            </View>
            {invoice.due_date ? (
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Due date</Text>
                <Text style={styles.vValue}>{formatDate(invoice.due_date)}</Text>
              </View>
            ) : null}
            <View style={styles.kvRow}>
              <Text style={styles.kLabel}>Status</Text>
              <Text
                style={[
                  styles.statusPill,
                  { backgroundColor: getStatusColor(displayStatus), color: "#ffffff" },
                ]}
              >
                {String(invoice.status || displayStatus).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* From / Bill To */}
        <View style={styles.card}>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>From</Text>
              <Text style={styles.strong}>
                {brandKit?.company_name || "Company Name"}
              </Text>
              {brandKit?.address ? (
                <Text style={styles.meta}>{brandKit.address}</Text>
              ) : null}
              <Text style={styles.meta}>
                {[brandKit?.email, brandKit?.phone, brandKit?.website].filter(Boolean).join("  •  ") || "—"}
              </Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <Text style={styles.strong}>
                {invoice.client?.business_name || invoice.client?.name || "—"}
              </Text>
              {invoice.client?.name && invoice.client?.business_name ? (
                <Text style={styles.meta}>Attn: {invoice.client.name}</Text>
              ) : null}
              {invoice.client?.email ? (
                <Text style={styles.meta}>{invoice.client.email}</Text>
              ) : null}
              {invoice.client?.phone ? (
                <Text style={styles.meta}>{invoice.client.phone}</Text>
              ) : null}
              {invoice.client?.location ? (
                <Text style={styles.meta}>{invoice.client.location}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Services table + totals */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Services</Text>

          {isMilestone ? (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, styles.colMilestone]}>Milestone</Text>
                <Text style={[styles.tableHeaderText, styles.colMStatus]}>Status</Text>
                <Text style={[styles.tableHeaderText, styles.colMAmount]}>Amount</Text>
              </View>
              {(invoice.milestones as InvoiceMilestone[]).map((milestone, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.cellText, styles.colMilestone]}>{milestone.label}</Text>
                  <Text style={[styles.cellText, styles.colMStatus]}>{milestone.status}</Text>
                  <Text style={[styles.cellText, styles.colMAmount]}>
                    {formatCurrency(milestone.amount, currency)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, styles.colService]}>Service</Text>
                <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
                <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
                <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
              </View>

              {items.length > 0 ? (
                items.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.cellText, styles.colService]}>{item.name}</Text>
                    <Text style={[styles.cellMuted, styles.colDescription]}>
                      {item.description || "—"}
                    </Text>
                    <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
                    <Text style={[styles.cellText, styles.colRate]}>
                      {formatCurrency(item.unit_price, currency)}
                    </Text>
                    <Text style={[styles.cellText, styles.colAmount]}>
                      {formatCurrency(item.total, currency)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.tableRow}>
                  <Text style={styles.cellMuted}>No items.</Text>
                </View>
              )}
            </View>
          )}

          {/* Totals */}
          <View style={styles.totalsWrap}>
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.kLabel}>Subtotal</Text>
                <Text style={styles.vValue}>{formatCurrency(invoice.subtotal, currency)}</Text>
              </View>
              {invoice.tax_amount !== null && invoice.tax_amount !== undefined && invoice.tax_amount > 0 ? (
                <View style={styles.totalsRow}>
                  <Text style={styles.kLabel}>Tax</Text>
                  <Text style={styles.vValue}>{formatCurrency(invoice.tax_amount, currency)}</Text>
                </View>
              ) : null}

              <View style={[styles.totalHighlight, { borderTopColor: primaryColor }]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={[styles.totalValue, { color: primaryColor }]}>
                  {formatCurrency(invoice.total, currency)}
                </Text>
              </View>

              <View style={[styles.amountDueBox, { borderTopColor: primaryColor }]}>
                <Text style={styles.amountDueLabel}>Amount due</Text>
                <Text style={[styles.amountDueValue, { color: primaryColor }]}>
                  {formatCurrency(invoice.amount_due, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment info / Details (signature) */}
        <View style={styles.card}>
          <View style={styles.footerGrid}>
            <View style={{ width: "48%" }}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.signature}>
                {/* Signature image — replace src with your actual signature file path */}
                <Image
                  src="/signature.png"
                  style={styles.signatureImage}
                />
                <View style={styles.signLine} />
                <Text style={styles.meta}>Authorized signature</Text>
              </View>
              <Text style={styles.paragraph}>
                {invoice.due_date ? `Payable by ${formatDate(invoice.due_date)}` : "—"}
              </Text>
            </View>
          </View>
        </View>

      </Page>

      {/* Page footer */}
      <View style={styles.pageFooter} fixed>
        <Text style={styles.pageFooterText}>
          {brandKit?.company_name || "Company"}
          {brandKit?.email ? `  •  ${brandKit.email}` : ""}
          {brandKit?.website ? `  •  ${brandKit.website}` : ""}
        </Text>
        <Text
          style={styles.pageFooterText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Document>
  );
};

export default InvoiceDocument;