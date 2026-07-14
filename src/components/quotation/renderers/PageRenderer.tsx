//PageRenderer

import React from "react";

import {
    Page,
    View,
} from "@react-pdf/renderer";

import PDFHeader from "@/documents/pdf/PDFHeader";

import type { RenderablePage } from "@/documents/pdf/PageModels";
import type { BrandKit } from "@/lib/types";

type Props = {

    page: RenderablePage;

    styles: any;

    logoSource?: any;

    companyName: string;

    companyTagline: string;

    quoteNumber: string;

    quoteDate?: string | null;

    validUntil?: string | null;

    formatDate: (value?: string | null) => string;

    children?: React.ReactNode;

};

export default function PageRenderer({

    page,

    styles,

    logoSource,

    companyName,

    companyTagline,

    quoteNumber,

    quoteDate,

    validUntil,

    formatDate,

    children,

}: Props) {

    return (

        <Page
            size="A4"
            style={styles.page}
        >

            <PDFHeader
                styles={styles}
                logoSource={logoSource}
                companyName={companyName}
                companyTagline={companyTagline}
                quoteNumber={quoteNumber}
                quoteDate={quoteDate}
                validUntil={validUntil}
                formatDate={formatDate}
            />

            {children}

        </Page>

    );

}