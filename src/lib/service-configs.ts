// src/lib/service-configs.ts

/**
 * Master configuration for dynamic service pricing.
 *
 * Each entry maps a service NAME (as it appears in the Service Library / QuotationServiceBlock.service_name)
 * to a config describing what controls to show and how to price it.
 *
 * This file has NO UI and NO calculation logic — only data.
 * Calculations live in pricing-engine.ts.
 */

export type ServiceConfigFieldType =
    | "quantity"        // single slider -> qty * rate
    | "dual-quantity"    // two sliders multiplied together (e.g. videos * minutes)
    | "platform-select";  // checkbox group, each platform has its own rate

export interface QuantityFieldConfig {
    key: string;             // e.g. "blogs"
    label: string;           // e.g. "Number of Blogs"
    rate: number;             // price per unit
    min: number;
    max: number;
    step?: number;
    defaultValue: number;
}

export interface PlatformOption {
    key: string;              // e.g. "instagram"
    label: string;            // e.g. "Instagram"
    rate: number;
}

export interface ServiceConfig {
    /** Matches Service.name (case-insensitive) */
    serviceName: string;
    type: ServiceConfigFieldType;

    /** Used for "quantity" type (single slider) */
    field?: QuantityFieldConfig;

    /** Used for "dual-quantity" type (two sliders, multiplied) */
    fields?: [QuantityFieldConfig, QuantityFieldConfig];

    /** Used for "platform-select" type */
    platforms?: PlatformOption[];
}

export const SERVICE_CONFIGS: ServiceConfig[] = [
    {
        serviceName: "Blog Writing",
        type: "quantity",
        field: {
            key: "blogs",
            label: "Number of Blogs",
            rate: 750,
            min: 1,
            max: 50,
            defaultValue: 1,
        },
    },
    {
        serviceName: "Poster Design",
        type: "quantity",
        field: {
            key: "posters",
            label: "Number of Posters",
            rate: 750,
            min: 1,
            max: 50,
            defaultValue: 1,
        },
    },
    {
        serviceName: "Brochure Design",
        type: "quantity",
        field: {
            key: "brochures",
            label: "Number of Brochures",
            rate: 1200,
            min: 1,
            max: 30,
            defaultValue: 1,
        },
    },
    {
        serviceName: "Packaging Design",
        type: "quantity",
        field: {
            key: "packages",
            label: "Number of Designs",
            rate: 1200,
            min: 1,
            max: 30,
            defaultValue: 1,
        },
    },
    {
        serviceName: "Marketing Collaterals",
        type: "quantity",
        field: {
            key: "collaterals",
            label: "Number of Collaterals",
            rate: 2500,
            min: 1,
            max: 30,
            defaultValue: 1,
        },
    },
    {
        serviceName: "Social Media",
        type: "platform-select",
        platforms: [
            { key: "instagram", label: "Instagram", rate: 5000 },
            { key: "facebook", label: "Facebook", rate: 4000 },
            { key: "linkedin", label: "LinkedIn", rate: 6000 },
            { key: "other", label: "Other", rate: 3000 },
        ],
    },
    {
        serviceName: "Corporate Shoot",
        type: "quantity",
        field: {
            key: "images",
            label: "Number of Images",
            rate: 150,
            min: 1,
            max: 500,
            defaultValue: 10,
        },
    },
    {
        serviceName: "Product Shoot",
        type: "quantity",
        field: {
            key: "images",
            label: "Number of Images",
            rate: 200,
            min: 1,
            max: 500,
            defaultValue: 10,
        },
    },
   {
        serviceName: "Event Coverage",
        type: "dual-quantity",
        fields: [
            {
                key: "events",
                label: "Number of Events",
                rate: 7000,
                min: 1,
                max: 20,
                defaultValue: 1,
            },
            {
                key: "days",
                label: "Number of Days",
                rate: 3000,
                min: 1,
                max: 30,
                defaultValue: 1,
            },
        ],
    },
    {
        serviceName: "Promotional Video",
        type: "dual-quantity",
        fields: [
            {
                key: "videos",
                label: "Number of Videos",
                rate: 2500,
                min: 1,
                max: 20,
                defaultValue: 1,
            },
            {
                key: "hours",
                label: "Hours",
                rate: 2000,
                min: 1,
                max: 40,
                defaultValue: 1,
            },
        ],
    },
    {
        serviceName: "Reels Editing",
        type: "quantity",
        field: {
            key: "videos",
            label: "Number of Videos",
            rate: 600,
            min: 1,
            max: 100,
            defaultValue: 1,
        },
    },
    {
        serviceName: "YouTube Editing",
        type: "dual-quantity",
        fields: [
            {
                key: "videos",
                label: "Videos",
                rate: 600,
                min: 1,
                max: 50,
                defaultValue: 1,
            },
            {
                key: "minutes",
                label: "Minutes",
                rate: 300,
                min: 1,
                max: 120,
                defaultValue: 1,
            },
        ],
    },
    {
        serviceName: "Corporate Video Editing",
        type: "dual-quantity",
        fields: [
            {
                key: "videos",
                label: "Videos",
                rate: 600,
                min: 1,
                max: 50,
                defaultValue: 1,
            },
            {
                key: "minutes",
                label: "Minutes",
                rate: 300,
                min: 1,
                max: 120,
                defaultValue: 1,
            },
        ],
    },
    {
        serviceName: "Advertisement Video Editing",
        type: "quantity",
        field: {
            key: "videos",
            label: "Videos",
            rate: 5000,
            min: 1,
            max: 20,
            defaultValue: 1,
        },
    },
];

/**
 * Lookup helper — case-insensitive match on service name.
 * Returns undefined if the service has no dynamic config (falls back to manual price input).
 */
export function getServiceConfig(serviceName: string): ServiceConfig | undefined {
    const normalized = (serviceName || "").trim().toLowerCase();
    return SERVICE_CONFIGS.find((c) => c.serviceName.toLowerCase() === normalized);
}