/**
 * Phase 1: Workflow semantics (logic-only).
 *
 * No UI triggers/buttons are introduced here.
 *
 * Intended future lifecycle:
 * - QUOTATION → ACCEPTED
 * - ACCEPTED → CONTRACT (future)
 * - ACCEPTED → INVOICE (future)
 */

export const QUOTATION_WORKFLOW = {
  QUOTATION_TO_ACCEPTED: "quotation_to_accepted",

  // Future (not implemented in Phase 1)
  ACCEPTED_TO_CONTRACT: "accepted_to_contract",
  ACCEPTED_TO_INVOICE: "accepted_to_invoice",
} as const;

export type QuotationWorkflowTransition = (typeof QUOTATION_WORKFLOW)[keyof typeof QUOTATION_WORKFLOW];
