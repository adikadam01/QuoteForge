//InvoicePDF.tsx

import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Invoice, BrandKit, Receipt } from '@/lib/types';
import { formatCurrency, getCurrencySymbol } from '@/lib/types';



// Shared styles clone (could extract to styles.ts)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: 'contain',
    marginBottom: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  brandInfo: {
    fontSize: 9,
    color: '#666',
  },
  titleBlock: {
    textAlign: 'right',
  },
  // docTitle: {
  //   fontSize: 24,
  //   fontWeight: 'bold',
  //   color: '#111',
  //   marginBottom: 4,
  //   textTransform: 'uppercase',
  // },

  docTitle: {
    fontSize: 22,
    fontWeight: 'Bold',
    color: "#111827",
    marginBottom: 4,
  },

  docRef: {
    fontSize: 10,
    color: '#666',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  col: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 10,
  },
  descCol: { flex: 3 },
  qtyCol: { width: 50, textAlign: 'center' },
  priceCol: { width: 80, textAlign: 'right' },
  totalCol: { width: 80, textAlign: 'right', fontWeight: 'bold' },

  statusBadge: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  totalsBlock: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#111',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },

  doc: {
    flex: 1,
    fontFamily: "Helvetica",
  },
  docCardHeader: {
    marginBottom: 18,
  },

  docCard: {
    marginBottom: 10,
  },

  docPad: {
    padding: 0,
  },

  docHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  docHeaderBrand: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexGrow: 1,
    flexShrink: 1,
  },

  docCompany: {
    marginBottom: 6,
  },

  docLogo: {
    width: 90,
    height: 32,
    objectFit: "contain",
  },

  docMeta: {
    fontSize: 9,
    color: "#6B7280",
  },

  docBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },

  docHeaderTitleRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },



  docSubtitle: {
    fontSize: 10,
    color: "#6B7280",
  },

  docHeaderMetaBox: {
    width: 170,
    flexDirection: "column",
  },


  docStack: {
    flexDirection: "column",
  },

  docTwoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  docBillTo: {
    width: "48%",
    paddingLeft: 20,
  },

  docSectionTitle: {
    fontSize: 9,
    fontWeight: 'Bold',
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#6B7280",
    marginBottom: 8,
  },

  docBlock: {
    flexDirection: "column",
  },

  docStrong: {
    fontSize: 11,
    fontWeight: 'Bold',
    color: "#111827",
    marginBottom: 2,
  },

  docTable: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    marginTop: 4,
    flexDirection: "column",
  },

  docTableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },

  docTableHeadRow: {
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  docTableCell: {
    fontSize: 9,
    color: "#111827",
    paddingHorizontal: 4,
  },

  colService: {
    width: "22%",
  },

  colDescription: {
    width: "38%",
  },

  colQty: {
    width: "10%",
  },

  colRate: {
    width: "15%",
  },

  colAmount: {
    width: "15%",
  },

  colNum: {
    textAlign: "right",
  },

  strong: {
    fontWeight: 'Bold',
  },

  muted: {
    color: "#9CA3AF",
  },

  docTotals: {
    marginTop: 8,
    alignItems: "flex-end",
  },

  docKv: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 170,
    marginBottom: 5,
  },

  docK: {
    fontSize: 9,
    color: "#6B7280",
  },

  // docV: {
  //   fontSize: 9,
  //   color: "#111827",
  //   fontWeight: 500,
  // },

  docV: {
    fontSize: 9,
    color: "#111827",
    fontWeight: 'Bold',   // was 500 — 500 isn't registered, was silently falling back to Helvetica (no ₹ glyph)
  },

  docTotalHighlight: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 2,
  },

  docTotalLabel: {
    fontSize: 10,
    fontWeight: 'Bold',
    color: "#111827",
  },

  docTotalValue: {
    fontSize: 10,
    fontWeight: 'Bold',
  },

  docAmountDue: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 6,
  },

  docAmountDueLabel: {
    fontSize: 10,
    fontWeight: 'Bold',
    color: "#111827",
  },

  docAmountDueValue: {
    fontSize: 12,
    fontWeight: 'Bold',
  },

  docFooterGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  docParagraph: {
    fontSize: 9,
    color: "#374151",
    marginTop: 4,
    lineHeight: 1.4,
  },

  docSignature: {
    flexDirection: "column",
    alignItems: "flex-start",
  },

  docSignLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#9CA3AF",
    width: 160,
  },

  docStatusPill: {
    fontSize: 8,
    fontWeight: 'Bold',
    color: "#111827",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
  },


});

interface InvoicePDFProps {
  invoice: Invoice;
  brandKit: BrandKit;
}

export const InvoicePDF = ({ invoice, brandKit }: InvoicePDFProps) => {
  const currencySymbol = getCurrencySymbol(invoice.currency);
  const client = invoice.client;

  // Determine items source (items array vs items linked from items table?)
  // For now assuming invoice.items is populated or we use a fallback
  const items = invoice.items || [];

  console.log(brandKit.logo_url);
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image
              src="public/triplesimage.png"
              style={styles.docLogo}
            />
            <Text style={styles.brandName}>{brandKit.company_name || 'Triple S Production'}</Text>
            <Text style={styles.brandInfo}>{brandKit.email}</Text>
            <Text style={styles.brandInfo}>{brandKit.phone}</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.docTitle}>INVOICE</Text>
            <Text style={styles.docRef}>#{invoice.invoice_number}</Text>
            <Text style={styles.docRef}>Date: {format(new Date(invoice.created_at), 'dd MMM yyyy')}</Text>
            <Text style={styles.docRef}>Due: {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : '—'}</Text>

            <View style={{ ...styles.statusBadge, backgroundColor: invoice.status === 'paid' ? '#dcfce7' : '#f3f4f6' }}>
              <Text style={{ ...styles.statusText, color: invoice.status === 'paid' ? '#166534' : '#374151' }}>
                {invoice.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Grid */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            {client ? (
              <>
                <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{client.name}</Text>
                <Text style={{ fontSize: 10, marginBottom: 2 }}>{client.business_name}</Text>
                <Text style={{ fontSize: 10 }}>{client.email}</Text>
                {client.location && <Text style={{ fontSize: 10 }}>{client.location}</Text>}
              </>
            ) : (
              <Text>No client selected</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.descCol}>Description</Text>
            <Text style={styles.qtyCol}>Qty</Text>
            <Text style={styles.priceCol}>Price</Text>
            <Text style={styles.totalCol}>Total</Text>
          </View>

          {items.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <View style={styles.descCol}>
                <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                {item.description ? <Text style={{ fontSize: 9, color: '#666' }}>{item.description}</Text> : null}
              </View>
              <View style={styles.qtyCol}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={styles.priceCol}>
                <Text>{formatCurrency(Number(item.unit_price), invoice.currency)}</Text>
              </View>
              <View style={styles.totalCol}>
                <Text>{formatCurrency(Number(item.total), invoice.currency)}</Text>
              </View>
            </View>
          ))}

          {items.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#999' }}>No items in invoice</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
          </View>
          {invoice.tax_amount > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax:</Text>
              <Text>{formatCurrency(invoice.tax_amount, invoice.currency)}</Text>
            </View>
          )}
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-{formatCurrency(invoice.discount, invoice.currency)}</Text>
            </View>
          )}

          <View style={{ ...styles.totalRow, borderBottomWidth: 0, paddingTop: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Total:</Text>
            <Text style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.total, invoice.currency)}</Text>
          </View>

          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Balance Due:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.amount_due, invoice.currency)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          {brandKit.company_name} • {brandKit.email} • {brandKit.website}
        </Text>
      </Page>
    </Document>
  );
};
