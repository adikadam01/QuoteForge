import React, { useMemo } from 'react';
import { formatCurrency } from '@/lib/types';
import type { BrandKit, Client, Quotation } from '@/lib/types';
import './documents.css';
import { RichTextDisplay } from '@/components/ui/RichText';
import { DEFAULT_PAYMENT_TERMS, DEFAULT_TERMS_CONDITIONS } from '@/lib/quotationDefaults';
import { getQuotationServiceBlocks, getQuotationTotalsForDisplay } from '@/lib/quotationServiceBlocks';

type Props = {
    quotation: Quotation;
    client?: Client | null;
    brandKit?: BrandKit | null;
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

export function QuotationDocument({ quotation, client, brandKit }: Props) {
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

    const serviceBlocks = useMemo(() => {
        return getQuotationServiceBlocks(quotation);
    }, [quotation]);

    // About Project dynamic summary generator if introduction is empty
    const generatedIntroduction = useMemo(() => {
        if (quotation.introduction && quotation.introduction.trim()) {
            return quotation.introduction;
        }
        const clientName = client?.business_name || client?.name || "Client";
        const bizType = client?.business_type || "";
        const industry = client?.industry || "";
        const servicesStr = serviceBlocks.length > 0
            ? serviceBlocks.map((s) => s.service_name).join(", ")
            : "our professional services";

        return `Brand Identity Package for ${clientName}${bizType || industry
                ? ` that operates in the ${[bizType, industry].filter(Boolean).join(" / ")} space.`
                : "."
            } We will create a branding package that includes creating a consistent visual system, brand guidelines, and high-quality deliverables including ${servicesStr}. This proposal outlines the proposed scope of work, deliverables, and commercial terms for the services discussed.`;
    }, [quotation.introduction, client, serviceBlocks]);

    // Payment Terms Fallback
    const resolvedPaymentTerms = useMemo(() => {
        if (quotation.payment_terms_text && quotation.payment_terms_text.trim()) {
            return quotation.payment_terms_text;
        }
        return DEFAULT_PAYMENT_TERMS
            .replace(/{{Company Name}}/g, companyName)
            .replace(/{{Client Name}}/g, client?.business_name || client?.name || "Client")
            .replace(/{{X}}/g, "50")
            .replace(/{{Y}}/g, "15");
    }, [quotation.payment_terms_text, companyName, client]);

    // Terms & Conditions Fallback
    const resolvedTermsConditions = useMemo(() => {
        if (quotation.terms_conditions_text && quotation.terms_conditions_text.trim()) {
            return quotation.terms_conditions_text;
        }
        return DEFAULT_TERMS_CONDITIONS
            .replace(/{{Company Name}}/g, companyName)
            .replace(/{{Client Name}}/g, client?.business_name || client?.name || "Client");
    }, [quotation.terms_conditions_text, companyName, client]);

    // Parse service timeline steps
    const getTimelineSteps = (timeline: string | null | undefined) => {
        if (!timeline) return [];
        return timeline
            .split(/,|->|=>|;/)
            .map((s) => s.trim())
            .filter(Boolean);
    };

    return (
        <div
            className="document-container flex flex-col p-8 md:p-12 bg-white text-gray-800 font-sans"
            style={{
                "--doc-accent": brandColor,
                "--font-heading": brandKit?.font_heading ? `'${brandKit.font_heading}', sans-serif` : "inherit",
                "--font-body": brandKit?.font_body ? `'${brandKit.font_body}', sans-serif` : "inherit",
            } as React.CSSProperties}
        >
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '24px', marginBottom: '24px' }}>
                <div>
                    {brandKit?.logo_url ? (
                        <img src={brandKit.logo_url} alt="Logo" style={{ height: '48px', objectFit: 'contain', marginBottom: '16px' }} />
                    ) : (
                        <div style={{ height: '48px', width: '48px', borderRadius: '12px', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', fontWeight: 'bold', fontSize: '18px', color: brandColor, marginBottom: '16px' }}>
                            {companyName.charAt(0)}
                        </div>
                    )}
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0', fontFamily: 'var(--font-heading)' }}>
                        {quotation.title || "Brand Identity Design"}
                    </h1>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                        Project Name: {quotation.title || "Brand Identity Design"} for {client?.business_name || client?.name || "Client"}
                    </p>
                </div>

                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f3f4f6', minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280' }}>Quote No:</span>
                        <span style={{ fontWeight: 'bold', color: '#111827' }}>{quotation.quotation_number}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280' }}>Date:</span>
                        <span style={{ fontWeight: '500', color: '#374151' }}>{formatDate(quotation.quote_date)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#6b7280' }}>Valid Until:</span>
                        <span style={{ fontWeight: '500', color: '#374151' }}>{formatDate(quotation.valid_until)}</span>
                    </div>
                </div>
            </div>

            {/* From / To Section */}
            <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #f3f4f6', paddingBottom: '24px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '8px' }}>From</h3>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                        <p style={{ fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>{companyName}</p>
                        {brandKit?.address && <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 4px 0' }}>{brandKit.address}</p>}
                        {brandKit?.phone && <p style={{ margin: '0 0 2px 0' }}>Phone: {brandKit.phone}</p>}
                        {brandKit?.email && <p style={{ margin: '0 0 2px 0' }}>Email: {brandKit.email}</p>}
                        {brandKit?.website && <p style={{ margin: '0' }}>Website: {brandKit.website}</p>}
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '8px' }}>To</h3>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                        <p style={{ fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>{client?.business_name || client?.name || "—"}</p>
                        {client?.name && client?.business_name && (
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px 0' }}>Attn: {client.name}</p>
                        )}
                        {client?.address && <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 4px 0' }}>{client.address}</p>}
                        {client?.location && <p style={{ margin: '0 0 2px 0' }}>Location: {client.location}</p>}
                        {client?.email && <p style={{ margin: '0 0 2px 0' }}>Email: {client.email}</p>}
                        {client?.phone && <p style={{ margin: '0 0 2px 0' }}>Phone: {client.phone}</p>}
                        {client?.gst_number && <p style={{ margin: '0' }}>GSTIN: {client.gst_number}</p>}
                    </div>
                </div>
            </div>

            {/* About Project Section */}
            <div style={{ marginBottom: '24px' }} className="no-break">
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                    About the Project
                </h3>
                <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: '0' }}>
                    {generatedIntroduction}
                </p>
            </div>

            {/* Deliverables Section (Table) */}
            <div style={{ marginBottom: '24px' }} className="no-break">
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                    Deliverables
                </h3>
                <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb' }}>
                            <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#4b5563', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Deliverable</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#4b5563', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Description</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#4b5563', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Price</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#4b5563', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Timeline</th>
                        </tr>
                    </thead>
                    <tbody>
                        {serviceBlocks.length > 0 ? (
                            serviceBlocks.map((s, idx) => (
                                <tr key={`${s.service_id}-${idx}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td
                                        style={{
                                            padding: '12px 14px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            color: '#111827',
                                            verticalAlign: 'top'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-end',
                                                gap: '4px'
                                            }}
                                        >
                                            <span>
                                                {formatCurrency(
                                                    s.price,
                                                    quotation.currency
                                                )}
                                            </span>

                                            {s.billing_type === "milestone" &&
                                                Array.isArray((s as any).milestone_template) &&
                                                (s as any).milestone_template.length > 0 && (
                                                    <div
                                                        style={{
                                                            marginTop: '6px',
                                                            width: '100%',
                                                            borderTop: '1px solid #e5e7eb',
                                                            paddingTop: '6px',
                                                            fontSize: '10px',
                                                            color: '#6b7280'
                                                        }}
                                                    >
                                                        {(s as any).milestone_template.map(
                                                            (m: any, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between'
                                                                    }}
                                                                >
                                                                    <span>{m.label}</span>
                                                                    <span>
                                                                        {formatCurrency(
                                                                            Number(m.amount || 0),
                                                                            quotation.currency
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#4b5563', verticalAlign: 'top', maxWidth: '300px' }}>
                                        <RichTextDisplay content={s.description || "—"} className="text-xs text-gray-600" />
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '500', color: '#111827', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                        {formatCurrency(s.price, quotation.currency)}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#4b5563', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                        {s.timeline || "—"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
                                    No deliverables defined.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* <div className="page-break" /> */}

            {/* Scope Of Work Section */}
            {serviceBlocks.some((s) => s.scope_of_work) && (
                <div style={{ marginBottom: '24px' }} className="no-break">
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                        Scope of Work
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {serviceBlocks
                            .filter((s) => s.scope_of_work)
                            .map((s, idx) => (
                                <div key={idx}>
                                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', margin: '0 0 4px 0' }}>{s.service_name}</h4>
                                    <RichTextDisplay content={s.scope_of_work || ""} className="text-xs text-gray-600" />
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Deliverable Details Section */}
            {serviceBlocks.some((s) => s.deliverables) && (
                <div style={{ marginBottom: '24px' }} className="no-break">
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                        Deliverables Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {serviceBlocks
                            .filter((s) => s.deliverables)
                            .map((s, idx) => (
                                <div key={idx}>
                                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', margin: '0 0 4px 0' }}>{s.service_name}</h4>
                                    <RichTextDisplay content={s.deliverables || ""} className="text-xs text-gray-600" />
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Timeline Section */}
            {serviceBlocks.some((s) => s.timeline) && (
                <div style={{ marginBottom: '24px' }} className="no-break">
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                        Project Timeline
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {serviceBlocks
                            .filter((s) => s.timeline)
                            .map((s, idx) => {
                                const steps = getTimelineSteps(s.timeline);
                                return (
                                    <div key={idx} style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>{s.service_name}</h4>
                                        {steps.length > 1 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                                                {steps.map((step, stepIdx) => (
                                                    <div key={stepIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <div style={{ display: 'flex', height: '20px', width: '20px', borderRadius: '50%', background: 'rgba(17, 24, 39, 0.1)', color: brandColor, alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                                                            {stepIdx + 1}
                                                        </div>
                                                        <span style={{ fontSize: '11px', color: '#374151', fontWeight: '500' }}>{step}</span>
                                                        {stepIdx < steps.length - 1 && (
                                                            <span style={{ color: '#d1d5db', fontSize: '11px' }}>→</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '11px', color: '#4b5563', margin: '0' }}>
                                                Estimated duration: <span style={{ fontWeight: 'bold', color: '#111827' }}>{s.timeline}</span>
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Process Section */}
            <div style={{ marginBottom: '24px' }} className="no-break">
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                    Methodology & Process
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                    {DEFAULT_PROCESS_PHASES.map((p, idx) => (
                        <div key={idx} style={{ padding: '12px', border: '1px solid #f3f4f6', borderRadius: '8px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', color: brandColor, background: 'rgba(17, 24, 39, 0.05)', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                                Phase {idx + 1}
                            </span>
                            <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#111827', margin: '4px 0 0 0' }}>{p.phase}</h4>
                            <p style={{ fontSize: '9px', color: '#6b7280', margin: '0', lineHeight: '1.4' }}>{p.description}</p>
                        </div>
                    ))}
                </div>
            </div>



            {/* Terms and fallback */}
            <div style={{ display: 'flex', gap: '32px', borderTop: '1px solid #f3f4f6', paddingTop: '24px', marginBottom: '24px' }} className="no-break">
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                            Payment Terms
                        </h3>
                        <div style={{ fontSize: '11px', color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {resolvedPaymentTerms}
                        </div>
                    </div>

                    {quotation.notes && (
                        <div>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                                Notes
                            </h3>
                            <p style={{ fontSize: '11px', color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: '0' }}>
                                {quotation.notes}
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                        Terms & Conditions
                    </h3>
                    <div style={{ fontSize: '11px', color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {resolvedTermsConditions}
                    </div>
                </div>
            </div>

            {/* Pricing Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }} className="no-break">
                <div style={{ width: '100%', maxWidth: '340px', background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span style={{ color: '#6b7280' }}>Subtotal:</span>
                        <span style={{ fontWeight: 'bold', color: '#111827' }}>{formatCurrency(totals.subtotal, quotation.currency)}</span>
                    </div>

                    {totals.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', marginBottom: '8px' }}>
                            <span>Discount:</span>
                            <span>-{formatCurrency(totals.discount, quotation.currency)}</span>
                        </div>
                    )}

                    {totals.tax > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                            <span style={{ color: '#6b7280' }}>Tax ({quotation.tax_rate}%):</span>
                            <span style={{ fontWeight: 'bold', color: '#111827' }}>{formatCurrency(totals.tax, quotation.currency)}</span>
                        </div>
                    )}

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Grand Total:</span>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: brandColor }}>{formatCurrency(totals.total, quotation.currency)}</span>
                    </div>
                </div>
            </div>

            {/* Signature Area */}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px', marginTop: '32px' }} className="no-break">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 16px 0' }}>Client Signature</p>
                        <div style={{ borderBottom: '1px dashed #d1d5db', height: '40px', marginBottom: '8px' }} />
                        <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>
                            <p style={{ fontWeight: 'bold', color: '#4b5563', margin: '0' }}>{client?.name || "Client Representative"}</p>
                            <p style={{ margin: '0' }}>{client?.business_name || "Client Company"}</p>
                            {/* <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0 0' }}>Date: ____ / ____ / ________</p> */}
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 16px 0' }}>Authorized Signatory</p>
                        <div style={{ borderBottom: '1px dashed #d1d5db', height: '40px', marginBottom: '8px' }} />
                        <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>
                            <p style={{ fontWeight: 'bold', color: '#4b5563', margin: '0' }}>Triple S Production Representative</p>
                            <p style={{ margin: '0' }}>{companyName}</p>
                            {/* <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0 0' }}>Date: ____ / ____ / ________</p> */}
                        </div>
                    </div>
                </div>
                <p style={{ fontSize: '9px', color: '#9ca3af', textAlign: 'center', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #f9fafb' }}>
                    By signing above, the client agrees to the terms and conditions outlined in this Quotation document.
                </p>
            </div>
        </div>
    );
}
