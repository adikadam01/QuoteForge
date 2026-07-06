// src/lib/quotation/pricing.ts

export type BillingType =
    | "one_time"
    | "monthly"
    | "retainer"
    | "milestone";

export interface PricingResult {
    billingType: BillingType;

    // Original quotation value
    totalAmount: number;

    // Monthly / Retainer
    durationMonths?: number;
    monthlyAmount?: number;

    // Milestone
    milestoneTotal?: number;

    // Display
    label: string;
}

/**
 * --------------------------
 * One-Time
 * --------------------------
 */
export function calculateOneTime(
    amount: number
): PricingResult {
    return {
        billingType: "one_time",
        totalAmount: amount,
        label: "One-Time Payment",
    };
}

/**
 * --------------------------
 * Monthly
 * Example:
 * ₹75,000
 * 3 months
 * =
 * ₹25,000/month
 * --------------------------
 */
export function calculateMonthly(
    totalAmount: number,
    months: number
): PricingResult {

    const safeMonths = Math.max(1, Number(months || 1));

    return {
        billingType: "monthly",

        totalAmount,

        durationMonths: safeMonths,

        monthlyAmount: Number(
            (totalAmount / safeMonths).toFixed(2)
        ),

        label: `${safeMonths} Monthly Installments`,
    };
}

/**
 * --------------------------
 * Retainer
 * Example:
 * ₹25,000/month
 * 6 months
 * =
 * Total ₹150,000
 * --------------------------
 */
export function calculateRetainer(
    monthlyAmount: number,
    months: number
): PricingResult {

    const safeMonths = Math.max(1, Number(months || 1));

    return {
        billingType: "retainer",

        monthlyAmount,

        durationMonths: safeMonths,

        totalAmount: monthlyAmount * safeMonths,

        label: `${safeMonths} Month Retainer`,
    };
}

/**
 * --------------------------
 * Milestone
 * --------------------------
 */
export function calculateMilestone(
    milestones: { amount: number }[]
): PricingResult {

    const total = milestones.reduce(
        (sum, m) => sum + Number(m.amount || 0),
        0
    );

    return {
        billingType: "milestone",

        totalAmount: total,

        milestoneTotal: total,

        label: `${milestones.length} Milestones`,
    };
}

/**
 * ---------------------------------------------------
 * Master Calculator
 * ---------------------------------------------------
 */
export function calculatePricing({
    billingType,
    amount,
    months = 1,
    milestones = [],
}: {
    billingType: BillingType;
    amount: number;
    months?: number;
    milestones?: { amount: number }[];
}): PricingResult {

    switch (billingType) {

        case "monthly":
            return calculateMonthly(amount, months);

        case "retainer":
            return calculateRetainer(amount, months);

        case "milestone":
            return calculateMilestone(milestones);

        default:
            return calculateOneTime(amount);

    }
}