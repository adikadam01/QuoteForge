import type { QuotationPointTemplateRow } from "@/repo/types";
import { nowIso } from "@/lib/dates";
import { newId } from "@/lib/id";

export function makeDefaultPointTemplates(): QuotationPointTemplateRow[] {
  const now = nowIso();
  const mk = (
    section: string,
    key: string,
    title: string,
    default_content: string,
    sort_order: number,
  ): QuotationPointTemplateRow => ({
    id: newId(),
    section,
    key,
    title,
    default_content,
    sort_order,
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  return [
    mk(
      'introduction',
      'intro.project_overview',
      'Project Overview',
      'This quotation outlines the proposed services, scope of work,\n and commercial terms for {{Project / Service Name}}.',
      1,
    ),
    mk(
      'introduction',
      'intro.engagement_context',
      'Engagement Context',
      'The objective of this engagement is to support the client\n with professional creative and marketing services as discussed.',
      2,
    ),
    mk(
      'introduction',
      'intro.scope_reference',
      'Scope Reference Line',
      'Any services not explicitly mentioned in this quotation\n are considered outside the scope.',
      3,
    ),

    mk(
      'scope_of_work',
      'scope.services_included',
      'Services Included',
      'The agency will provide the services listed in this quotation\n as per the agreed scope and timelines.',
      1,
    ),
    mk(
      'scope_of_work',
      'scope.platforms',
      'Platforms / Channels',
      'Services will be executed across agreed platforms such as\n Instagram, Facebook, YouTube, Website, or other mediums.',
      2,
    ),
    mk(
      'scope_of_work',
      'scope.duration',
      'Duration / Frequency',
      'The scope is valid for {{duration / frequency}} unless\n revised in writing.',
      3,
    ),
    mk(
      'scope_of_work',
      'scope.client_responsibilities',
      'Client Responsibilities',
      'The client shall provide timely approvals, access, and\n required materials to ensure smooth execution.',
      4,
    ),
    mk(
      'scope_of_work',
      'scope.out_of_scope',
      'Out-of-Scope Clause',
      'Any additional work beyond this scope will be charged\n separately upon mutual agreement.',
      5,
    ),

    mk(
      'payment_terms',
      'pay.advance',
      'Advance Payment',
      'An advance payment of {{percentage / amount}} is required\n before commencement of work.',
      1,
    ),
    mk(
      'payment_terms',
      'pay.balance',
      'Balance Payment',
      'The remaining balance must be cleared within {{X}} days\n from the date of invoice or delivery.',
      2,
    ),
    mk(
      'payment_terms',
      'pay.mode',
      'Payment Mode',
      'Payments can be made via bank transfer, UPI, or other\n mutually agreed methods.',
      3,
    ),
    mk(
      'payment_terms',
      'pay.late',
      'Late Payment Policy',
      'Delayed payments may result in work being paused until\n outstanding dues are cleared.',
      4,
    ),
    mk(
      'payment_terms',
      'pay.taxes',
      'Taxes',
      'Applicable taxes will be charged as per government norms,\n unless stated otherwise.',
      5,
    ),

    mk(
      'terms_conditions',
      'tac.revisions',
      'Revisions Policy',
      'The quotation includes {{number}} rounds of revisions.\n Additional revisions will be charged separately.',
      1,
    ),
    mk(
      'terms_conditions',
      'tac.ownership',
      'Ownership of Work',
      'All creative assets remain the property of the agency\n until full payment is received.',
      2,
    ),
    mk(
      'terms_conditions',
      'tac.usage',
      'Usage & Portfolio Rights',
      'The agency reserves the right to use completed work\n for portfolio, website, and social media purposes unless\n confidentiality is requested in writing.',
      3,
    ),
    mk(
      'terms_conditions',
      'tac.confidentiality',
      'Confidentiality',
      'All shared information, pricing, and materials are\n confidential and must not be shared with third parties.',
      4,
    ),
    mk(
      'terms_conditions',
      'tac.cancellation',
      'Cancellation & Termination',
      'Either party may discontinue the project with written\n notice. Work completed until that point will be billed.',
      5,
    ),
    mk(
      'terms_conditions',
      'tac.liability',
      'Liability Limitation',
      'The agency shall not be liable for indirect or\n consequential losses arising from the engagement.',
      6,
    ),
  ];
}
