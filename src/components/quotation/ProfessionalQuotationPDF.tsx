import React from "react";

import { buildPaginationSections } from "@/documents/pdf/QuotationPaginationMapper";
import { PDFPaginationEngine } from "@/documents/pdf/DocumentLayoutEngine";
import PageRenderer from "@/components/quotation/renderers/PageRenderer";
import CommercialPage from "@/components/quotation/renderers/CommercialPage";
import ContainerRenderer from "@/components/quotation/renderers/ContainerRenderer";
import TermsPage from "@/components/quotation/renderers/TermsPage";
import ScopePage from "@/components/quotation/renderers/ScopePage";

import {
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
    Font
} from "@react-pdf/renderer";

import { formatCurrency } from "@/lib/types";
import PDFHeader from "@/documents/pdf/PDFHeader";

import type { BrandKit, Client, Quotation } from "@/lib/types";


Font.register({
    family: "Noto Sans",
    fonts: [
        {
            src: "/fonts/NotoSans-Regular.ttf",
            fontWeight: "normal",
        },
        // {
        //     src: "/fonts/Roboto-Bold.ttf",
        //     fontWeight: "bold",
        // },
    ],
});

import {
    DEFAULT_PAYMENT_TERMS,
    DEFAULT_TERMS_CONDITIONS,
} from "@/lib/quotationDefaults";

import {
    getQuotationServiceBlocks,
    getQuotationTotalsForDisplay,
} from "@/lib/quotationServiceBlocks";


type Props = {
    quotation: Quotation;
    client?: Client | null;
    brandKit?: BrandKit | null;
};

function formatDate(value?: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

// function formatPdfCurrency(amount: number, currency: string) {
//     if (currency === "INR") {
//         return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
//     }

//     return `$${Number(amount).toLocaleString("en-US", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//     })}`;
// }

const styles = StyleSheet.create({
    page: {

        paddingTop: 38,
        paddingBottom: 42,
        paddingHorizontal: 58,
        fontFamily: "Noto Sans",
        fontSize: 10,
        color: "#374151", // gray-800/700 equivalent
        backgroundColor: "#FFFFFF",
    },


    // Top Header
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    logoImage: {
        width: 40,
        height: 40,
        objectFit: "contain",
        borderWidth: 1,
        borderColor: "#D1D5DB", // gray-300
        marginRight: 12,
    },
    logoPlaceholder: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    companyBlock: {
        flexDirection: "column",
    },
    companyName: {
        fontSize: 15,
        fontWeight: "bold",
        letterSpacing: 0.5,
        color: "#111827", // gray-900
        lineHeight: 1.1,
    },
    companyTagline: {
        fontSize: 10,
        letterSpacing: 0.5,
        color: "#9CA3AF", // gray-400
        marginTop: 2,
    },
    headerRight: {
        alignItems: "flex-end",
    },
    quoteNumberText: {
        fontSize: 12,
        fontWeight: "bold",
        letterSpacing: 0.5,
        color: "#111827",
    },
    metaLine: {
        fontSize: 10,
        color: "#9CA3AF",
        marginTop: 4,
    },
    metaLineValue: {
        color: "#6B7280", // gray-500
    },

    // Divider
    divider: {
        borderTopWidth: 2,
        borderTopColor: "#111827",
        marginBottom: 40,
    },

    // Title block
    titleBlock: {
        alignItems: "center",
        marginBottom: 36,
    },
    formalProposal: {
        fontSize: 10,
        letterSpacing: 3,
        color: "#9CA3AF",
        marginBottom: 12,
    },
    quotationTitle: {
        fontSize: 34,
        letterSpacing: 5,
        color: "#111827",
        fontWeight: 300,
    },
    decorativeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },
    decorativeLine: {
        width: 40,
        height: 1,
        backgroundColor: "#D1D5DB",
    },
    decorativeDot: {
        width: 4,
        height: 4,
        backgroundColor: "#D1D5DB",
        marginHorizontal: 8,
    },

    // Client Information
    clientInfoBox: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 26,
    },
    clientInfoHeader: {
        backgroundColor: "#F9FAFB", // gray-50
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    clientInfoHeaderText: {
        fontSize: 10,
        letterSpacing: 2,
        color: "#9CA3AF",
        fontWeight: "bold",
    },
    clientRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    clientRowLast: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    clientRowLabel: {
        width: 160,
        fontSize: 10,
        letterSpacing: 1.5,
        color: "#9CA3AF",
    },
    clientRowValue: {
        fontSize: 12,
        color: "#1F2937", // gray-800
    },

    // Service Type
    serviceTypeSection: {
        marginBottom: 22,
    },
    sectionLabel: {
        fontSize: 10,
        letterSpacing: 2,
        color: "#9CA3AF",
        marginBottom: 8,
    },
    serviceTypeValue: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#111827",
    },

    // Project Overview
    overviewSection: {
        marginBottom: 22,
    },
    overviewParagraph: {
        fontSize: 11,
        lineHeight: 1.6,
        color: "#4B5563", // gray-600
    },

    // Note
    noteBox: {
        borderLeftWidth: 2,
        borderLeftColor: "#111827",
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    noteLabel: {
        fontSize: 10,
        letterSpacing: 2,
        color: "#9CA3AF",
        marginBottom: 4,
    },
    noteText: {
        fontSize: 10,
        lineHeight: 1.5,
        color: "#4B5563",
    },


    // ======================page 2 css start=============================

    // Page 2 — Scope of Work
    page2TitleBlock: {
        marginBottom: 14,
    },
    pageHeading: {
        fontSize: 20,
        fontWeight: "bold",
        letterSpacing: 1.5,
        color: "#111827",
    },
    serviceListWrap: {
        flexDirection: "column",
    },
    serviceRow: {
        flexDirection: "row",
        paddingVertical: 6,
    },
    serviceRowBordered: {
        flexDirection: "row",
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    serviceNumber: {
        width: 20,
        fontSize: 9,
        fontWeight: "bold",
        color: "#D1D5DB",
    },
    serviceContent: {
        flex: 1,
    },
    serviceTitleText: {
        fontSize: 11,
        fontWeight: "bold",
        letterSpacing: 1,
        color: "#111827",
        marginBottom: 3,
    },
    columnsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
    },
    columnSingle: {
        width: "100%",
    },
    columnHalf: {
        width: "45%",
    },
    columnHalfRight: {
        width: "45%",
        marginLeft: "5%",
    },
    bulletItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 6,
    },
    bulletDot: {
        width: 10,
        fontSize: 8,
        color: "#C5CAD3",
        marginTop: 1,
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
        lineHeight: 1.6,
        color: "#4B5563",
    },
    subBlock: {
        marginTop: 6,
    },
    subBlockLabel: {
        fontSize: 8.5,
        fontWeight: "bold",
        letterSpacing: 1,
        color: "#9CA3AF",
        marginBottom: 2,
    },
    subBlockText: {
        fontSize: 9,
        lineHeight: 1.4,
        color: "#6B7280",
    },


    //=========page 3 css start========

    // Page 3 — Commercial Details
    tableWrap: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 20,
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: "#F9FAFB",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    tableHeaderCellService: {
        width: "26%",
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    tableHeaderCellDesc: {
        width: "40%",
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    tableHeaderCellPrice: {
        width: "17%",
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignItems: "flex-end",
    },
    tableHeaderText: {
        fontSize: 8,
        letterSpacing: 1,
        color: "#9CA3AF",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    tableRowLast: {
        flexDirection: "row",
    },
    tableCellService: {
        width: "26%",
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    tableCellServiceText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#111827",
    },
    tableCellDesc: {
        width: "40%",
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    tableCellDescText: {
        fontSize: 9,
        color: "#6B7280",
        lineHeight: 1.4,
    },
    tableCellPrice: {
        width: "17%",
        paddingHorizontal: 10,
        paddingVertical: 10,
        alignItems: "flex-end",
    },
    tableCellPriceOriginal: {
        fontSize: 9,
        color: "#9CA3AF",
        textDecoration: "line-through",
    },
    tableCellPriceDiscounted: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#111827",
    },

    totalsWrap: {
        alignItems: "flex-end",
        marginBottom: 20,
    },
    totalsBox: {
        width: 220,
    },
    totalsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    totalsLabel: {
        fontSize: 9,
        color: "#9CA3AF",
    },
    totalsValue: {
        fontSize: 9,
        fontFamily: 'Noto Sans',
        color: "#374151",
    },
    totalsGrandRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#111827",
        paddingTop: 6,
        marginTop: 2,
    },
    totalsGrandLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#111827",
    },
    totalsGrandValue: {
        fontSize: 12,
        fontFamily: 'Noto Sans',
        fontWeight: "bold",
        color: "#111827",
    },

    hostingBox: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 18,
    },
    hostingColumnsRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    hostingColLeft: {
        width: "48%",
    },
    hostingColRight: {
        width: "48%",
        marginLeft: "4%",
        borderLeftWidth: 1,
        borderLeftColor: "#F3F4F6",
        paddingLeft: 16,
    },

    numberedItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    numberedIndex: {
        fontSize: 9,
        color: "#9CA3AF",
        width: 14,
    },
    numberedText: {
        flex: 1,
        fontSize: 9.5,
        color: "#4B5563",
        lineHeight: 1.75,
    },

    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 28,
        marginTop: 18,
    },
    footerCol: {
        width: "33%",
        alignItems: "center",
    },
    footerColLabel: {
        fontSize: 8.5,
        fontWeight: "bold",
        letterSpacing: 1,
        color: "#9CA3AF",
        marginBottom: 8,
    },
    footerCompanyName: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#111827",
    },
    footerContactText: {
        fontSize: 9,
        color: "#6B7280",
        marginBottom: 6,
        lineHeight: 1.6,
    },
    // signatureLine: {
    //     marginTop: 18,
    //     height: 42,
    //     borderBottomWidth: 1,
    //     borderBottomColor: "#9CA3AF",
    // },

    signatureLine: {
        width: "85%",
        borderBottomWidth: 1,
        borderBottomColor: "#9CA3AF",
        marginTop: 0,
    },
    signatureCaption: {
        fontSize: 8,
        color: "#9CA3AF",
        marginTop: 4,
    },

    thankYouBlock: {
        alignItems: "center",
        marginTop: 42,
        paddingTop: 18,
    },
    thankYouText: {
        fontSize: 16,
        letterSpacing: 4,
        fontWeight: "bold",
        color: "#111827",
        marginTop: 10,
        marginBottom: 8,
    },
    thankYouSub: {
        width: 340,
        textAlign: "center",
        fontSize: 10,
        lineHeight: 1.6,
        color: "#6B7280",
    },

    paymentTermsBlock: {

        marginTop: 24,

        marginBottom: 24,

    },

    paymentTermsTitle: {
        fontSize: 10,
        fontWeight: "bold",
        letterSpacing: 2,
        color: "#9CA3AF",
        marginBottom: 10,
    },

    termsCard: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FAFAFA",
        paddingHorizontal: 18,
        paddingVertical: 18,
        borderRadius: 4,
        marginBottom: 28,
    },

    termsHeading: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#000000ff",
        marginTop: 12,
        marginBottom: 6,
        textTransform: "uppercase",
    },

    signatureImage: {
        width: 95,
        height: 35,
        objectFit: "contain",
        marginTop: 2,
        marginBottom: 4,
    },

    signatureColumn: {
        width: "33%",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 2,
    },

    signatureName: {
        fontSize: 8,
        color: "#9CA3AF",
        marginTop: 2,
    },

    signatureHeading: {
        fontSize: 8.5,
        fontWeight: "bold",
        letterSpacing: 1,
        color: "#9CA3AF",
        marginBottom: 8,
    },

    clientSignatureName: {
        width: 140,
        textAlign: "center",
        fontSize: 11,
        fontWeight: "bold",
        color: "#111827",
        textTransform: "uppercase",
        marginBottom: 4,
    },

    clientSignatureDate: {
        width: 140,
        textAlign: "center",
        fontSize: 8,
        color: "#9CA3AF",
        marginTop: 4,
    },
});

export default function ProfessionalQuotationPDF({
    quotation,
    client,
    brandKit,
}: Props) {
    // console.log("PDF Client", client);
    // console.log("Quotation Client", quotation.client);

    const currentClient = (quotation as any)?.client || client || null;

    const serviceBlocks = getQuotationServiceBlocks(quotation);
    const primaryService = serviceBlocks?.[0];

    const companyName = brandKit?.company_name || "Triple S Production";
    const companyTagline = "";

    const quoteNumber = quotation.quotation_number || "QT-0000";

    const clientRows: { label: string; value: string }[] = [
        { label: "Client Name", value: currentClient?.name || "—" },
        { label: "Company", value: currentClient?.business_name || "—" },
        { label: "Contact Number", value: currentClient?.phone || "—" },
        { label: "Email Address", value: currentClient?.email || "—" },
        {
            label: "Address",
            value: currentClient?.address || currentClient?.location || "—",
        },
    ];

    const projectOverview =
        quotation.introduction ||
        `${companyName} is pleased to present this formal quotation for ${primaryService?.service_name
            ? primaryService.service_name.toLowerCase()
            : "the requested services"
        }, prepared specifically for ${currentClient?.business_name || currentClient?.name || "the client"
        }. The scope, deliverables, and detailed breakdown are outlined on the following pages of this proposal.`;
    // console.log("ProfessionalQuotationPDF Loaded");
    // console.log("Logo URL:", brandKit?.logo_url);

    const logoSource =
        brandKit?.logo_url
            ? { uri: brandKit.logo_url }
            : undefined;
    const totals = getQuotationTotalsForDisplay(quotation);
    const paginationSections =
        buildPaginationSections(quotation);

    const paginationEngine =
        new PDFPaginationEngine({

            pageHeight: 842,

            headerHeight: 90,

            topMargin: 38,

            bottomMargin: 42,

        });

    const renderablePages =
        paginationEngine.paginate(
            paginationSections
        );

    // console.log('renderable pages: ', renderablePages);

    if (import.meta.env.DEV) {

        // console.log("Pagination Sections", paginationSections);

        // console.log("Renderable Pages", renderablePages);

        renderablePages.forEach(page => {

            // console.log(
            //     page.pageNumber,
            //     page.containers.map(c => ({
            //         id: c.id,
            //         blocks: c.renderedBlocks.length,
            //     }))
            // );

        });

    }

    return (
        <Document>

            {/* =============================page 1 start===================================== */}
            <Page size="A4" style={styles.page}>
                {/* Top Header */}
                <PDFHeader
                    styles={styles}
                    logoSource={logoSource}
                    companyName={companyName}
                    companyTagline={companyTagline}
                    quoteNumber={quoteNumber}
                    quoteDate={quotation.quote_date}
                    validUntil={quotation.valid_until}
                    formatDate={formatDate}
                />

                {/* Title Block */}
                <View style={styles.titleBlock}>
                    <Text style={styles.formalProposal}>FORMAL PROPOSAL</Text>
                    <Text style={styles.quotationTitle}>QUOTATION</Text>
                    <View style={styles.decorativeRow}>
                        <View style={styles.decorativeLine} />
                        <View style={styles.decorativeDot} />
                        <View style={styles.decorativeLine} />
                    </View>
                </View>

                {/* Client Information */}
                <View style={styles.clientInfoBox}>
                    <View style={styles.clientInfoHeader}>
                        <Text style={styles.clientInfoHeaderText}>CLIENT INFORMATION</Text>
                    </View>

                    {clientRows.map((row, idx) => (
                        <View
                            key={row.label}
                            style={idx !== clientRows.length - 1 ? styles.clientRow : styles.clientRowLast}
                        >
                            <Text style={styles.clientRowLabel}>{row.label.toUpperCase()}</Text>
                            <Text style={styles.clientRowValue}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Service Type */}
                <View style={styles.serviceTypeSection}>
                    <Text style={styles.sectionLabel}>SERVICE TYPE</Text>
                    <Text style={styles.serviceTypeValue}>
                        {primaryService?.service_name || "General Services"}
                    </Text>
                </View>

                {/* Project Overview */}
                <View style={styles.overviewSection}>
                    <Text style={styles.sectionLabel}>PROJECT OVERVIEW</Text>
                    <Text style={styles.overviewParagraph}>{projectOverview}</Text>
                </View>

                {/* Note */}
                <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>NOTE</Text>
                    <Text style={styles.noteText}>
                        This quotation covers the complete scope as detailed in the
                        Scope of Work on the following pages. All features, pages,
                        integrations, and training are included under the quoted price
                        unless stated otherwise. Any requirements beyond the agreed scope
                        will be communicated in writing via a formal Change Request prior
                        to commencement.
                    </Text>
                </View>
            </Page>
            {/* =============================page 1 end===================================== */}

            {/* =============================page 2 start===================================== */}

            {renderablePages
                .filter(page =>
                    page.containers.some(
                        c => c.id === "scope"
                    )
                )
                .map(page => (

                    <PageRenderer
                        key={`scope-${page.pageNumber}`}
                        page={page}
                        styles={styles}
                        logoSource={logoSource}
                        companyName={companyName}
                        companyTagline={companyTagline}
                        quoteNumber={quoteNumber}
                        quoteDate={quotation.quote_date}
                        validUntil={quotation.valid_until}
                        formatDate={formatDate}
                    >

                        <ScopePage
                            styles={styles}
                            serviceBlocks={serviceBlocks}
                            primaryService={primaryService}
                        />

                    </PageRenderer>

                ))}
            {/* =============================page 2 end===================================== */}

            {/* =============================page 3 start===================================== */}

            {/* ================= Terms Pages ================= */}

            {renderablePages
                .filter(page =>
                    page.containers.some(
                        c =>
                            c.id === "payment-terms" ||
                            c.id === "terms"
                    )
                )
                .map(page => (

                    <PageRenderer
                        key={`terms-${page.pageNumber}`}
                        page={page}
                        styles={styles}
                        logoSource={logoSource}
                        companyName={companyName}
                        companyTagline={companyTagline}
                        quoteNumber={quoteNumber}
                        quoteDate={quotation.quote_date}
                        validUntil={quotation.valid_until}
                        formatDate={formatDate}
                    >

                        <TermsPage
                            page={page}
                            styles={styles}
                        />

                    </PageRenderer>

                ))}
            {/* =============================page 3 end===================================== */}
            {/* =============================page 4 start===================================== */}


            <PageRenderer
                page={renderablePages[0]!}
                styles={styles}
                logoSource={logoSource}
                companyName={companyName}
                companyTagline={companyTagline}
                quoteNumber={quoteNumber}
                quoteDate={quotation.quote_date}
                validUntil={quotation.valid_until}
                formatDate={formatDate}
            >

                <CommercialPage
                    styles={styles}
                    quotation={quotation}
                    totals={totals}
                    serviceBlocks={serviceBlocks}
                    brandKit={brandKit}
                    companyName={companyName}
                    currentClient={currentClient}
                    formatCurrency={formatCurrency}
                />

            </PageRenderer>
        </Document >
    );
}