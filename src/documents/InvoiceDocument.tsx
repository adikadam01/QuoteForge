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
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  companyInfo: {
    flexDirection: "column",
    gap: 2,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 2,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 140,
    height: 60,
    objectFit: "contain",
  },
  logoFallback: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#888888",
  },
  banner: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  bannerTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 4,
    color: "#1a1a1a",
  },
  bannerMeta: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  bannerMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 3,
  },
  bannerMetaLabel: {
    fontSize: 9,
    color: "#888888",
    width: 72,
    textAlign: "right",
  },
  bannerMetaValue: {
    fontSize: 9,
    color: "#1a1a1a",
    fontFamily: "Helvetica-Bold",
    minWidth: 80,
    textAlign: "left",
  },
  statusBadge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    textTransform: "uppercase",
    color: "#ffffff",
    backgroundColor: "#888888",
  },
  billToSection: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  billToName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  billToDetail: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 2,
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnitPrice: { flex: 1.5, textAlign: "right" },
  colAmount: { flex: 1.5, textAlign: "right" },
  colMilestone: { flex: 3 },
  colStatus: { flex: 1.5, textAlign: "center" },
  colMilestoneAmount: { flex: 1.5, textAlign: "right" },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#555555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableBodyText: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  tableBodySubText: {
    fontSize: 8,
    color: "#888888",
    marginTop: 2,
  },
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  totalsCard: {
    width: 240,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 12,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#888888",
  },
  totalsValue: {
    fontSize: 9,
    color: "#1a1a1a",
  },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  totalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  amountDueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 4,
  },
  amountDueLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  amountDueValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  notesSection: {
    marginBottom: 24,
    padding: 14,
    backgroundColor: "#f7f7f7",
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: "#555555",
    lineHeight: 1.5,
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
    default: return "#888888";
  }
}

// const InvoiceDocument: React.FC<Props> = ({ invoice, brandKit }) => {
const InvoiceDocument: React.FC<Props> = ({ invoice, brandKit, items: passedItems }) => {
  const currency = invoice.currency ?? "INR";
  const primaryColor = brandKit?.primary_color ?? "#1a1a1a";
  const displayStatus = invoice.invoice_status ?? invoice.status ?? "draft";
  const isMilestone =
    invoice.type === "milestone" &&
    Array.isArray(invoice.milestones) &&
    invoice.milestones.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>

          {/* Left Side */}
          <View style={styles.companyInfo}>
            {brandKit?.company_name ? (
              <Image
                src="/triplesimage.png"
                style={styles.logoImage}
              />
            ) : null}

            {brandKit?.address ? (
              <Text style={styles.companyDetail}>{brandKit.address}</Text>
            ) : null}

            {brandKit?.email ? (
              <Text style={styles.companyDetail}>{brandKit.email}</Text>
            ) : null}

            {brandKit?.phone ? (
              <Text style={styles.companyDetail}>{brandKit.phone}</Text>
            ) : null}

            {brandKit?.website ? (
              <Text style={styles.companyDetail}>{brandKit.website}</Text>
            ) : null}
          </View>

          {/* Right Side */}
          <View style={{ alignItems: "flex-end" }}>

            <View style={styles.bannerMetaRow}>
              <Text style={styles.bannerMetaLabel}>Invoice #</Text>
              <Text style={styles.bannerMetaValue}>
                {invoice.invoice_number ?? "—"}
              </Text>
            </View>

            <View style={styles.bannerMetaRow}>
              <Text style={styles.bannerMetaLabel}>Issue Date</Text>
              <Text style={styles.bannerMetaValue}>
                {formatDate(invoice.created_at)}
              </Text>
            </View>

            <View style={styles.bannerMetaRow}>
              <Text style={styles.bannerMetaLabel}>Due Date</Text>
              <Text style={styles.bannerMetaValue}>
                {formatDate(invoice.due_date)}
              </Text>
            </View>

          </View>

        </View>

        {/* Invoice Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>INVOICE</Text>
          <View style={styles.bannerMeta}>
            {/* <View style={styles.bannerMetaRow}>
              <Text style={styles.bannerMetaLabel}>Status</Text>
              <Text
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(displayStatus) },
                ]}
              >
                {displayStatus.toUpperCase()}
              </Text>
            </View> */}
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billToSection}>
          <Text style={styles.sectionLabel}>Bill To</Text>
          {invoice.client?.business_name ? (
            <Text style={styles.billToName}>{invoice.client.business_name}</Text>
          ) : null}
          {invoice.client?.name ? (
            <Text style={styles.billToDetail}>{invoice.client.name}</Text>
          ) : null}
          {invoice.client?.address ? (
            <Text style={styles.billToDetail}>{invoice.client.address}</Text>
          ) : null}
          {invoice.client?.email ? (
            <Text style={styles.billToDetail}>{invoice.client.email}</Text>
          ) : null}
          {invoice.client?.phone ? (
            <Text style={styles.billToDetail}>{invoice.client.phone}</Text>
          ) : null}
        </View>

        {/* Items Table or Milestone Table */}
        {isMilestone ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colMilestone]}>Milestone</Text>
              <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
              <Text style={[styles.tableHeaderText, styles.colMilestoneAmount]}>Amount</Text>
            </View>
            {(invoice.milestones as InvoiceMilestone[]).map((milestone, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableBodyText, styles.colMilestone]}>
                  {milestone.label}
                </Text>
                <Text style={[styles.tableBodyText, styles.colStatus]}>
                  {milestone.status}
                </Text>
                <Text style={[styles.tableBodyText, styles.colMilestoneAmount]}>
                  {formatCurrency(milestone.amount, currency)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>Unit Price</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
            </View>
            {/* {Array.isArray(invoice.items) &&
              (invoice.items as InvoiceItem[]).map((item, index) => ( */}

            {(passedItems || []).map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.colDescription}>
                  <Text style={styles.tableBodyText}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.tableBodySubText}>{item.description}</Text>
                  ) : null}
                </View>
                <Text style={[styles.tableBodyText, styles.colQty]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableBodyText, styles.colUnitPrice]}>
                  {formatCurrency(item.unit_price, currency)}
                </Text>
                <Text style={[styles.tableBodyText, styles.colAmount]}>
                  {formatCurrency(item.total, currency)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>SubTotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.subtotal, currency)}
              </Text>
            </View>
            {invoice.discount !== null && invoice.discount !== undefined && invoice.discount > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Discount</Text>
                <Text style={styles.totalsValue}>
                  − {formatCurrency(invoice.discount, currency)}
                </Text>
              </View>
            ) : null}
            {invoice.tax_amount !== null && invoice.tax_amount !== undefined && invoice.tax_amount > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency(invoice.tax_amount, currency)}
                </Text>
              </View>
            ) : null}
            <View style={styles.totalsDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.total, currency)}
              </Text>
            </View>
            {invoice.amount_paid !== null && invoice.amount_paid !== undefined && invoice.amount_paid > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Amount Paid</Text>
                <Text style={styles.totalsValue}>
                  − {formatCurrency(invoice.amount_paid, currency)}
                </Text>
              </View>
            ) : null}
            <View
              style={[
                styles.amountDueRow,
                { backgroundColor: primaryColor },
              ]}
            >
              <Text style={styles.amountDueLabel}>Amount Due</Text>
              <Text style={styles.amountDueValue}>
                {formatCurrency(invoice.amount_due, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

      </Page>
    </Document>
  );
};

export default InvoiceDocument;