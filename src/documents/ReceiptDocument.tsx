//ReceiptDocument.tsx

import React, { useMemo } from 'react';
import { formatCurrency } from '@/lib/types';
import type { BrandKit, Client, Invoice, Receipt, Quotation } from '@/lib/types';
import './documents.css';

type Props = {
    receipt: Receipt;
    invoice?: Invoice | null;
    client?: Client | null;
    brandKit?: BrandKit | null;
    quotation?: Quotation | null;
};

const normalizeHex = (hex: string) => {
    const h = hex.trim().replace('#', '');
    if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    return h.length === 6 ? `#${h}` : '';
};

export function ReceiptDocument({ receipt, invoice, client, brandKit, quotation }: Props) {
    const brandColor = useMemo(() => normalizeHex(brandKit?.primary_color || '#111827') || '#111827', [brandKit?.primary_color]);
    const companyName = brandKit?.company_name || 'Triple S Production';

    const c = client || invoice?.client || receipt.client || null;
    const receiptDate = (receipt.payment_date || receipt.created_at || '').slice(0, 10);
    const invoiceNumber = invoice?.invoice_number || receipt.invoice_id || '—';
    const cur = receipt.currency || invoice?.currency;

    const invoiceTotal = Number(invoice?.total || 0);
    const totalPaid = Number(invoice?.amount_paid || receipt.amount || 0);
    const balanceDue = invoice ? Number(invoice.amount_due || 0) : 0;

    const rows = useMemo(() => {
        const items: Array<{ name: string; desc?: string; amount: number; type: string }> = [];

        if (invoice?.type === 'milestone' && invoice.milestones) {
            const mIndex = invoice.milestone_index ?? -1;
            const milestone = invoice.milestones[mIndex];
            if (milestone) {
                items.push({
                    name: milestone.label,
                    desc: `Milestone ${mIndex + 1} of ${invoice.milestones.length}`,
                    amount: Number(receipt.amount),
                    type: 'Milestone'
                });
                return items;
            }
        }

        if (quotation?.service_blocks) {
            quotation.service_blocks.forEach(block => {
                items.push({
                    name: block.service_name,
                    desc: block.description || block.scope_of_work || '',
                    amount: block.price,
                    type: block.billing_type === 'monthly' ? 'Monthly' : 'Service'
                });
            });
        } else if (quotation?.services) {
            quotation.services.forEach(s => {
                items.push({
                    name: s.service_name,
                    desc: s.description || '',
                    amount: s.total,
                    type: 'Service'
                });
            });
        }

        if (items.length === 0) {
            items.push({
                name: `Payment for Invoice #${invoiceNumber}`,
                desc: receipt.payment_reference || '',
                amount: Number(receipt.amount),
                type: 'Payment'
            });
        }

        return items;
    }, [invoice, quotation, receipt, invoiceNumber]);

    return (
        <div className="document-container flex flex-col">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '24px', marginBottom: '32px' }}>
                <div style={{ maxWidth: '50%' }}>
                    <div style={{ marginBottom: '12px' }}>
                        {brandKit?.logo_url ? (
                            <img src={brandKit.logo_url} alt="Logo" style={{ height: '48px', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ width: '48px', height: '48px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
                                {companyName.charAt(0)}
                            </div>
                        )}
                    </div>
                    <h2 className="doc-value" style={{ fontSize: '18px', marginBottom: '8px' }}>{companyName}</h2>
                    <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'pre-wrap' }}>
                        {brandKit?.address && <div>{brandKit.address}</div>}
                        <div style={{ marginTop: '4px' }}>{[brandKit?.email, brandKit?.phone, brandKit?.website].filter(Boolean).join(" • ")}</div>
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#111827',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        borderRadius: '999px',
                        marginBottom: '12px'
                    }}>Payment Receipt</div>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', color: brandColor, margin: '0' }}>PAID</h1>

                    <div style={{ marginTop: '16px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', marginBottom: '4px' }}>
                            <span className="doc-label" style={{ width: '90px', textAlign: 'left', flexShrink: 0 }}>Receipt No</span>
                            <span className="doc-value" style={{ fontFamily: 'monospace', flex: 1, textAlign: 'left' }}>{receipt.receipt_number || receipt.id}</span>
                        </div>
                        <div style={{ display: 'flex', marginBottom: '4px' }}>
                            <span className="doc-label" style={{ width: '90px', textAlign: 'left', flexShrink: 0 }}>Date</span>
                            <span className="doc-value" style={{ flex: 1, textAlign: 'left' }}>{receiptDate}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span className="doc-label" style={{ width: '90px', textAlign: 'left', flexShrink: 0 }}>Invoice Ref</span>
                            <span className="doc-value" style={{ flex: 1, textAlign: 'left' }}>{invoiceNumber}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meta & Summary Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '32px' }}>
                <div>
                    <div className="doc-label" style={{ marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '4px' }}>Received From</div>
                    <div className="doc-value" style={{ fontSize: '16px', marginBottom: '4px' }}>{c?.business_name || c?.name || '—'}</div>
                    {c?.name && c?.business_name && <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '8px' }}>Attn: {c.name}</div>}
                    <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'pre-wrap' }}>
                        {c?.address && <div>{c.address}</div>}
                        {c?.email && <div>{c.email}</div>}
                        {c?.phone && <div>{c.phone}</div>}
                    </div>
                </div>

                <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px' }}>
                        <span style={{ color: '#6b7280' }}>Payment Method</span>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{receipt.payment_method || '—'}</span>
                    </div>
                    {receipt.payment_reference && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px' }}>
                            <span style={{ color: '#6b7280' }}>Reference ID</span>
                            <span style={{ fontFamily: 'monospace', background: 'white', padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>{receipt.payment_reference}</span>
                        </div>
                    )}
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>Total Received</span>
                        <span style={{ fontWeight: 900, fontSize: '20px', color: brandColor }}>{formatCurrency(Number(receipt.amount || 0), cur)}</span>
                    </div>
                </div>
            </div>

            {/* Service Table */}
            <table className="doc-table">
                <thead>
                    <tr>
                        <th style={{ width: '40%' }}>Service / Item</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx} className="no-break">
                            <td style={{ fontWeight: 600 }}>{row.name}</td>
                            <td><span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{row.type}</span></td>
                            <td style={{ color: '#6b7280', fontSize: '11px' }}>{row.desc || '—'}</td>
                            <td className="amount">{formatCurrency(row.amount, cur)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals Section */}
            <div className="doc-totals no-break" style={{ marginBottom: '24px' }}>
                <div className="doc-totals-box">
                    <div className="doc-totals-row" style={{ color: '#6b7280' }}>
                        <span>Invoice Amount</span>
                        <span className="doc-value">{formatCurrency(invoiceTotal, cur)}</span>
                    </div>
                    <div className="doc-totals-row" style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                        <span>Total Paid</span>
                        <span className="doc-value">{formatCurrency(totalPaid, cur)}</span>
                    </div>
                    <div className="doc-totals-row" style={{ paddingTop: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px' }}>Balance Due</span>
                        <span style={{ fontWeight: 700, fontSize: '18px' }}>{formatCurrency(balanceDue, cur)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="doc-footer mt-auto no-break">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        <div style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Thank you for your business!</div>
                        <div>If you have any questions, please contact us at:</div>
                        <div style={{ fontWeight: 600, color: '#111827', lineHeight: '1.6' }}>8956183973</div>
                        <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '12px' }}>This is a system-generated receipt. No signature required.</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '48px', width: '160px', borderBottom: '1px solid #d1d5db', marginBottom: '8px' }}></div>
                        <div className="doc-label">Authorized Signature</div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '6px', paddingTop: '5px', borderTop: '1px solid #f9fafb', fontSize: '10px', color: '#0c0c0cff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {companyName} • Receipt #{receipt.receipt_number || receipt.id}
                </div>
            </div>

        </div>
    );
}
