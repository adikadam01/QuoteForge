// src/lib/quotation/milestoneCal.ts

export interface MilestoneItem {

    id: string;

    label: string;

    percentage: number;

    amount: number;

}

export interface MilestoneResult {
    milestones: MilestoneItem[];
    total: number;
}

/**
 * Creates an empty milestone
 */
export function createMilestone(
    index: number
): MilestoneItem {

    return {

        id:
            "ms_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substring(2),

        label: `Milestone ${index + 1}`,

        percentage: 0,

        amount: 0

    }

}


export function generateMilestones(
    count: number
): MilestoneItem[] {

    return Array.from(

        { length: count },

        (_, i) => createMilestone(i)

    );

}

export function calculateTotalPercentage(

    milestones: MilestoneItem[]

) {

    return milestones.reduce(

        (sum, m) => sum + m.percentage,

        0

    );

}

export function calculateRemainingPercentage(

    milestones: MilestoneItem[]

) {

    return Math.max(

        0,

        100 - calculateTotalPercentage(milestones)

    );

}

export function updateMilestonePercentage(

    milestones: MilestoneItem[],

    id: string,

    percentage: number,

    total: number

) {

    return milestones.map(m => {

        if (m.id !== id) return m;

        const safe = Math.max(0, Number(percentage) || 0);

        return {

            ...m,

            percentage: safe,

            amount: Number(

                (

                    total * safe / 100

                ).toFixed(2)

            )

        }

    })

}



export function isMilestonePlanValid(

    milestones: MilestoneItem[]

) {

    return calculateTotalPercentage(

        milestones

    ) === 100;

}

/**
 * Adds a milestone
 */
export function addMilestone(
    milestones: MilestoneItem[]
): MilestoneItem[] {
    return [
        ...milestones,
        createMilestone(milestones.length),
    ];
}



/**
 * Removes a milestone
 */
export function removeMilestone(
    milestones: MilestoneItem[],
    id: string
): MilestoneItem[] {
    return milestones.filter(
        (m) => m.id !== id
    );
}

/**
 * Update milestone name
 */
export function updateMilestoneLabel(
    milestones: MilestoneItem[],
    id: string,
    label: string
): MilestoneItem[] {
    return milestones.map((m) =>
        m.id === id
            ? {
                ...m,
                label,
            }
            : m
    );
}


/**
 * Total of all milestones
 */
export function calculateMilestoneTotal(
    milestones: MilestoneItem[]
): number {
    return milestones.reduce(
        (sum, m) => sum + Number(m.amount || 0),
        0
    );
}

/**
 * Returns everything together
 */
export function calculateMilestones(
    milestones: MilestoneItem[]
): MilestoneResult {
    return {
        milestones,
        total: calculateMilestoneTotal(milestones),
    };
}