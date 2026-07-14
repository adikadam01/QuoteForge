//QuotationPginationMapper

import type { Quotation } from "@/lib/types";

import {
    BlockContentType,
    BlockRenderKind,
    BlockType,
    type PaginationBlock,
    type PaginationContainer,
    type PaginationSection,
} from "./DocumentLayoutEngine";

import {
    DEFAULT_TERMS_CONDITIONS,
    DEFAULT_PAYMENT_TERMS,
} from "@/lib/quotationDefaults";

import {
    getQuotationServiceBlocks,
} from "@/lib/quotationServiceBlocks";

/**
 * ============================================================================
 * Quotation → Pagination Mapper
 * ============================================================================
 *
 * Converts quotation data into sections/containers/blocks.
 *
 * NO pagination happens here.
 *
 * ============================================================================
 */

function buildTermsContainer(
    quotation: Quotation
): PaginationContainer {

    const lines =
        String(
            quotation.terms_conditions_text ||
            DEFAULT_TERMS_CONDITIONS ||
            ""
        )
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);

    return {

        id: "terms",

        restartOnNewPage: true,

        closeBorderOnBreak: true,

        originalBlocks: lines.map((line, index) => {

            const isHeading =
                line === line.toUpperCase() &&
                !line.startsWith("•") &&
                !line.startsWith("-") &&
                !/^\d/.test(line);

            return {

                id: `terms-${index}`,

                type: BlockType.Splittable,

                contentType: BlockContentType.Text,

                renderKind: isHeading
                    ? BlockRenderKind.Heading
                    : BlockRenderKind.Bullet,

                content: line
                    .replace(/^\d+\.\s*/, "")
                    .replace(/^[-•]\s*/, ""),

            };

        }),

        renderedBlocks: [],

    };
}

function buildScopeContainer(
    quotation: Quotation
): PaginationContainer {

    const serviceBlocks =
        getQuotationServiceBlocks(quotation);

    const blocks: PaginationBlock[] = [];

    for (const service of serviceBlocks) {

        // Service Heading
        blocks.push({

            id: `service-${service.service_id}`,

            type: BlockType.Atomic,

            contentType: BlockContentType.Text,

            renderKind: BlockRenderKind.Heading,

            content: service.service_name,

        });

        // Scope bullets
        const items =
            String(service.scope_of_work || "")
                .split("\n")
                .map(i => i.trim())
                .filter(Boolean);

        items.forEach((item, index) => {

            blocks.push({

                id: `${service.service_id}-${index}`,

                type: BlockType.Splittable,

                contentType: BlockContentType.Text,

                renderKind: BlockRenderKind.Bullet,

                content: item,

            });

        });

    }

    return {

        id: "scope",

        restartOnNewPage: true,

        closeBorderOnBreak: true,

        originalBlocks: blocks,

        renderedBlocks: [],

    };

}

function buildPaymentTermsContainer(
    quotation: Quotation
): PaginationContainer {

    const lines =
        String(
            quotation.payment_terms_text ||
            DEFAULT_PAYMENT_TERMS ||
            ""
        )
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);

    return {

        id: "payment-terms",

        title: "PAYMENT TERMS",

        restartOnNewPage: true,

        closeBorderOnBreak: true,

        originalBlocks: lines.map((line, index) => ({

            id: `payment-${index}`,

            type: BlockType.Splittable,

            contentType: BlockContentType.Text,

            renderKind: BlockRenderKind.Numbered,

            content: line
                .replace(/^\d+\.\s*/, "")
                .replace(/^[-•]\s*/, ""),

            data: index + 1,

        })),

        renderedBlocks: [],

    };

}

export function buildPaginationSections(
    quotation: Quotation
): PaginationSection[] {

    const rootContainer: PaginationContainer = {

        id: "quotation",

        title: quotation.title,

        originalBlocks: [],

        renderedBlocks: [],

        restartOnNewPage: true,

        closeBorderOnBreak: true,

    };
    
    const scopeContainer =
        buildScopeContainer(quotation);

    const paymentTermsContainer =
        buildPaymentTermsContainer(quotation);

    const termsContainer =
        buildTermsContainer(quotation);



    const titleBlock: PaginationBlock = {

        id: "quotation-title",

        type: BlockType.Atomic,

        contentType: BlockContentType.Text,

        content: quotation.title,

    };

    rootContainer.originalBlocks.push(titleBlock);

    return [

        // ================= Page 1 =================
        {
            id: "cover",

            title: quotation.title,

            includeHeader: true,

            containers: [
                rootContainer,
            ],
        },

        // ================= Page 2 =================
        {
            id: "scope",

            title: "Scope",

            includeHeader: true,

            containers: [
                scopeContainer,
            ],
        },

        // ================= Page 3 =================
        {
            id: "terms",

            title: "Terms",

            includeHeader: true,

            containers: [
                paymentTermsContainer,
                termsContainer,
            ],
        },

    ];
}