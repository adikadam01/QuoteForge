import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Receipt, BrandKit, Invoice } from '@/lib/types';
import { formatCurrency, getCurrencySymbol } from '@/lib/types';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/0.ttf' },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 20,
  },
  headerLeft: {
    maxWidth: '55%',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  brandMeta: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#111',
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    width: 70,
    textAlign: 'right',
    color: '#999',
    fontSize: 8,
    textTransform: 'uppercase',
    marginRight: 10,
  },
  metaValue: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 10,
    fontFamily: 'monospace',
  },

  box: {
    backgroundColor: '#f9fafb',
    padding: 24,
    borderRadius: 8,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    width: 110,
    textAlign: 'right',
    color: '#666',
    fontSize: 11,
    marginRight: 12,
  },
  value: {
    flex: 1,
    color: '#111',
    fontWeight: 'bold',
    fontSize: 11,
  },
  amountBox: {
    marginTop: 30,
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#111',
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
  },

  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
  },
});

interface ReceiptPDFProps {
  receipt: Receipt;
  invoice: Invoice;
  brandKit: BrandKit;
}

export const ReceiptPDF = ({ receipt, invoice, brandKit }: ReceiptPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          {/* Left: Logo + company info */}
          <View style={styles.headerLeft}>
            {brandKit.logo_url && (
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 8 }} src={brandKit.logo_url} />
            )}
            <Text style={styles.brandName}>{brandKit.company_name}</Text>
            <Text style={styles.brandMeta}>
              {[brandKit.address].filter(Boolean).join(', ')}
            </Text>
            <Text style={styles.brandMeta}>
              {[brandKit.email, brandKit.phone].filter(Boolean).join(' • ')}
            </Text>
          </View>

          {/* Right: Badge + PAID + meta rows */}
          <View style={styles.headerRight}>
            <Text style={styles.badge}>Payment Receipt</Text>
            <Text style={styles.title}>Paid</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Receipt No</Text>
              <Text style={styles.metaValue}>{receipt.receipt_number}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{format(new Date(receipt.payment_date), 'yyyy-MM-dd')}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice Ref</Text>
              <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
            </View>
          </View>
        </View>

        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>Received From</Text>
            <Text style={styles.value}>{receipt.client?.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Business</Text>
            <Text style={styles.value}>{receipt.client?.business_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{receipt.payment_method || 'Unspecified'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference / Transaction ID</Text>
            <Text style={styles.value}>{receipt.payment_reference || '—'}</Text>
          </View>
          <View style={{ ...styles.row, borderBottomWidth: 0 }}>
            <Text style={styles.label}>Invoice Ref</Text>
            <Text style={styles.value}>#{invoice.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>{formatCurrency(receipt.amount, receipt.currency)}</Text>
        </View>

        <Text style={{ textAlign: 'center', marginTop: 30, fontStyle: 'italic', color: '#555' }}>
          This receipt confirms that payment has been received for the above amount.
        </Text>

        <Text style={styles.footer}>
          {brandKit.company_name} • {brandKit.email}
        </Text>

      </Page>
    </Document>
  );
};