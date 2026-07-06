import LZString from "lz-string";
import type { BrandKit, Invoice, InvoiceItem, Client, Quotation } from "@/lib/types";

export type SharedInvoiceData = {
    v: number;
    invoice: Invoice;
    items: InvoiceItem[];
    client: Client | undefined;
    brandKit: BrandKit | null | undefined;
    senderName: string;
};

export type SharedQuotationData = {
    v: number;
    quotation: Quotation;
    client: Client | undefined;
    brandKit: BrandKit | null | undefined;
    senderName: string;
};

export function encodeInvoiceData(data: SharedInvoiceData): string {
    const json = JSON.stringify(data);
    return LZString.compressToEncodedURIComponent(json);
}

export function decodeInvoiceData(encoded: string): SharedInvoiceData | null {
    try {
        const json = LZString.decompressFromEncodedURIComponent(encoded);
        if (!json) return null;
        return JSON.parse(json) as SharedInvoiceData;
    } catch (e) {
        console.error("Failed to decode shared invoice data", e);
        return null;
    }
}

export function encodeQuotationData(data: SharedQuotationData): string {
    const json = JSON.stringify(data);
    return LZString.compressToEncodedURIComponent(json);
}

export function decodeQuotationData(encoded: string): SharedQuotationData | null {
    try {
        const json = LZString.decompressFromEncodedURIComponent(encoded);
        if (!json) return null;
        return JSON.parse(json) as SharedQuotationData;
    } catch (e) {
        console.error("Failed to decode shared quotation data", e);
        return null;
    }
}
