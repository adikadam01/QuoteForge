//QuotationBuilder.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Pencil, Save, Send, UserPlus, X } from "lucide-react";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/pages/DatePicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import AddClientDialog from "@/components/clients/AddClientDialog";
import { RichEditor } from "@/components/ui/RichText";
import type { PricingModel, Quotation, QuotationSectionToggles } from "@/lib/types";
import { nowIso } from "@/lib/dates";
import { QuotationLayout } from "@/components/quotation/QuotationLayout";
import {
  getQuotationServiceBlocks,
  getServiceBlockTotals,
  type QuotationServiceBlock,
  type QuotationServiceBlockBillingType,
} from "@/lib/quotationServiceBlocks";
import { calculateMonthly } from "@/components/quotation/pricing";

import {

  generateMilestones,

  updateMilestonePercentage,
  calculateMilestoneTotal,
  calculateRemainingPercentage,
  updateMilestoneLabel,
  calculateTotalPercentage,
  createMilestone,
  isMilestonePlanValid

} from "@/components/quotation/milestoneCal";


// const monthly = calculateMonthly(
//   block.price,
//   block.durationMonths
// );

type BuilderStep = 1 | 2 | 3 | 4 | 5;

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function dedupeTitles(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of list) {
    const s = String(t || "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export default function QuotationBuilder() {
  // const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const {
    clients,
    services,
    termsConditions,
    quotations,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    refreshQuotations,
    getQuotationById,
    currency,
    brandKit,
  } = useApp();


  const serviceLibraryById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const today = new Date().toISOString().split("T")[0];
  const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const DRAFT_LS_KEY = "currentDraftId";
  const draftIdParam = searchParams.get("draftId");



  // Never auto-resume from localStorage — only resume via explicit URL param
  // This prevents old quotations from being overwritten when creating new ones
  const [draftId, setDraftId] = useState<string | null>(draftIdParam ?? null);

  const DEFAULT_SECTION_TOGGLES = useMemo<QuotationSectionToggles>(
    () => ({
      introduction: true,
      scope_of_work: true,
      payment_terms: true,
      terms_conditions: true,
    }),
    [],
  );

  const [step, setStep] = useState<BuilderStep>(1);
  const [serviceSearch, setServiceSearch] = useState("");

  // STEP 1 — Basic Info (NO notes here)
  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    quote_date: today,
    valid_until: defaultValidUntil,
  });

  // STEP 2-3 — Service Blocks (source of truth)
  const [serviceBlocks, setServiceBlocks] = useState<QuotationServiceBlock[]>([]);

  const quotationTerms = useMemo(() => {
    if (!termsConditions.length) return [];

    // General Terms
    const general = termsConditions.filter(
      (t) => Number(t.is_general) === 1
    );

    // Unique categories of selected services
    const selectedCategories = [
      ...new Set(
        serviceBlocks
          .map((b) => {
            const service = services.find((s) => s.id === b.service_id);
            return service?.category;
          })
          .filter(Boolean)
      ),
    ];

    // Category specific terms (max 3)
    const categoryTerms = selectedCategories.flatMap((category) =>
      termsConditions
        .filter(
          (t) =>
            Number(t.is_general) === 0 &&
            t.category === category
        )
        .slice(0, 3)
    );

    return [...general, ...categoryTerms];
  }, [termsConditions, serviceBlocks, services]);




  // STEP 4 — Global Terms
  const [sectionToggles, setSectionToggles] = useState<QuotationSectionToggles>(() => DEFAULT_SECTION_TOGGLES);
  const [globalTerms, setGlobalTerms] = useState({
    introduction: "",
    payment_terms_text: "",
    terms_conditions_text: "",
  });

  const [resuming, setResuming] = useState(false);

  // Draft conflict modal (preserve existing behavior)
  const [draftConflictOpen, setDraftConflictOpen] = useState(false);
  const [conflictDraftId, setConflictDraftId] = useState<string | null>(null);
  const [conflictDraftIds, setConflictDraftIds] = useState<string[]>([]);
  const conflictCheckedRef = useRef(false);
  const conflictRefreshAttemptedRef = useRef(false);

  const resumeHydratedRef = useRef<string | null>(null);
  const resumeRefreshAttemptedRef = useRef<string | null>(null);

  // Add Client Dialog
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clientSelectOpen, setClientSelectOpen] = useState(false);

  const titleSuggestions = useMemo(() => dedupeTitles((quotations || []).map((q) => q.title || "")).slice(0, 30), [quotations]);

  const openAddClientDialog = useCallback(() => {
    setClientSelectOpen(false);
    // Radix Select can swallow the immediate open; defer to next tick.
    setTimeout(() => setIsAddClientOpen(true), 0);
  }, []);

  const resetToFreshWizard = useCallback(() => {
    resumeHydratedRef.current = null;
    resumeRefreshAttemptedRef.current = null;

    setDraftId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("draftId");
      return next;
    });
    localStorage.removeItem(DRAFT_LS_KEY);

    setStep(1);
    setFormData({ title: "", client_id: "", quote_date: today, valid_until: defaultValidUntil });
    setServiceBlocks([]);
    setSectionToggles(DEFAULT_SECTION_TOGGLES);
    setGlobalTerms({ introduction: "", payment_terms_text: "", terms_conditions_text: "" });
  }, [DEFAULT_SECTION_TOGGLES, defaultValidUntil, setSearchParams, today]);

  // Cross-tab sync: if currentDraftId changes elsewhere, reflect it here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DRAFT_LS_KEY) return;

      const nextId = e.newValue;
      if (!nextId) {
        resetToFreshWizard();
        return;
      }

      if (nextId !== draftId) {
        resumeHydratedRef.current = null;
        resumeRefreshAttemptedRef.current = null;
        setDraftId(nextId);
        setSearchParams({ draftId: nextId });
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [draftId, resetToFreshWizard, setSearchParams]);

  // If user clicked "New Quotation" while an unfinished draft exists, prompt for action.
  useEffect(() => {
    if (draftIdParam) return; // explicit resume via URL
    if (draftId) return; // resuming via stored pointer
    if (conflictCheckedRef.current) return;

    // Refresh exactly once, then decide based on current state.
    if (!conflictRefreshAttemptedRef.current) {
      conflictRefreshAttemptedRef.current = true;
      refreshQuotations().catch((err) => {
        if (import.meta.env.DEV) console.error("Failed to refresh quotations", err);
      });
      return;
    }

    conflictCheckedRef.current = true;

    const activeDrafts = quotations
      .filter((q) => q.status === "draft" && !q.is_template)
      .filter((q) => !q.sent_at && !q.accepted_at && !q.invoiced_at);

    if (activeDrafts.length === 0) {
      localStorage.removeItem(DRAFT_LS_KEY);
      return;
    }

    const byUpdatedAtDesc = activeDrafts
      .slice()
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));

    const preferred = byUpdatedAtDesc[0];
    if (!preferred) return;

    setConflictDraftIds(byUpdatedAtDesc.map((d) => d.id));
    setConflictDraftId(preferred.id);
    setDraftConflictOpen(true);
  }, [draftId, draftIdParam, quotations, refreshQuotations]);

  // useEffect(() => {

  //   if (!draftId) return;

  //   const quotation = quotations.find(q => q.id === draftId);

  //   if (!quotation) return;

  //   setFormData({
  //     title: quotation.title,
  //     client_id: quotation.client_id,
  //     quote_date: quotation.quote_date,
  //     valid_until: quotation.valid_until,
  //   });

  //   setServiceBlocks(quotation.service_blocks || []);

  //   setGlobalTerms({
  //     introduction: quotation.introduction || "",
  //     payment_terms_text: quotation.payment_terms_text || "",
  //     terms_conditions_text: quotation.terms_conditions_text || "",
  //   });

  //   setSectionToggles(
  //     quotation.section_toggles || DEFAULT_SECTION_TOGGLES
  //   );

  //   setStep(quotation.current_step || 1);

  // }, [draftId, quotations]);


  const handleContinuePrevious = () => {
    if (!conflictDraftId) return;
    setDraftConflictOpen(false);
    localStorage.setItem(DRAFT_LS_KEY, conflictDraftId);
    resumeHydratedRef.current = null;
    resumeRefreshAttemptedRef.current = null;
    setDraftId(conflictDraftId);
    setSearchParams({ draftId: conflictDraftId });
  };

  const startNewInProgressRef = useRef(false);
  const handleStartNew = async () => {
    if (startNewInProgressRef.current) return;
    startNewInProgressRef.current = true;

    const idsToDelete = conflictDraftIds.length > 0 ? conflictDraftIds : conflictDraftId ? [conflictDraftId] : [];

    try {
      await Promise.all(idsToDelete.map((id) => deleteQuotation(id)));
      await refreshQuotations();

      localStorage.removeItem(DRAFT_LS_KEY);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("draftId");
        return next;
      });
      setDraftId(null);

      setDraftConflictOpen(false);

      // Reset UI state
      setStep(1);
      setFormData({ title: "", client_id: "", quote_date: today, valid_until: defaultValidUntil });
      setServiceBlocks([]);
      setSectionToggles(DEFAULT_SECTION_TOGGLES);
      setGlobalTerms({ introduction: "", payment_terms_text: "", terms_conditions_text: "" });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to start a new quotation", err);
      toast({
        title: "Could not start a new quotation",
        description: "We couldn't reset your draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      startNewInProgressRef.current = false;
    }
  };

  // Resume draft (URL param or stored pointer)
  useEffect(() => {
    if (!draftId) return;
    if (resumeHydratedRef.current === draftId) return;

    const q = getQuotationById(draftId) ?? quotations.find((x) => x.id === draftId);

    if (!q) {
      if (resumeRefreshAttemptedRef.current !== draftId) {
        resumeRefreshAttemptedRef.current = draftId;
        setResuming(true);
        refreshQuotations().finally(() => {
          setResuming(false);
        });
        return;
      }

      localStorage.removeItem(DRAFT_LS_KEY);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("draftId");
        return next;
      });
      setDraftId(null);
      return;
    }

    resumeHydratedRef.current = draftId;

    // Always resume at Step 1 for predictable UX.
    // setStep(1);

    setStep(((q as any).current_step || 1) as BuilderStep);

    setFormData({
      title: q.title || "",
      client_id: q.client_id || "",
      quote_date: q.quote_date || today,
      valid_until: q.valid_until || defaultValidUntil,
    });

    // Source of truth: service_blocks. If missing, fall back to legacy line-items.
    const blocksUnknown = (q as unknown as { service_blocks?: unknown }).service_blocks;
    if (Array.isArray(blocksUnknown) && blocksUnknown.length > 0) {
      setServiceBlocks(
        getQuotationServiceBlocks(q).map((b) => {

          const lib = serviceLibraryById.get(b.service_id);

          console.log("Selected Service:", lib);

          return {

            ...b,

            // ---------- Repair Monthly Amount ----------
            monthly_amount:
              b.billing_type === "monthly"
                ? (
                  b.monthly_amount ??
                  calculateMonthly(
                    Number(b.price || 0),
                    Number(b.duration_months || 1)
                  ).monthlyAmount
                )
                : b.monthly_amount,

            // ---------- Repair Missing Fields ----------
            description:
              b.description || lib?.description || "",

            scope_of_work:
              b.scope_of_work || lib?.scope_of_work || "",

            deliverables:
              b.deliverables || lib?.deliverables || "",

            timeline:
              b.timeline || lib?.timeline || "",

            payment_terms:
              b.payment_terms || lib?.payment_terms || "",

            service_terms:
              b.service_terms || lib?.service_terms || "",

          };

        })
      );
    } else if ((q.services || []).length > 0) {
      setServiceBlocks(
        (q.services || []).map((it) => {
          const lib = serviceLibraryById.get(it.service_id || "");
          return {
            service_id: String(it.service_id || "default"),
            service_name: String(it.service_name || "Service"),
            description: String(it.description || lib?.description || ""),
            scope_of_work: String(lib?.scope_of_work || ""),
            deliverables: String(lib?.deliverables || ""),
            timeline: String(lib?.timeline || ""),
            price: n(it.total),
            billing_type: (
              (it as any).billing_type || "one_time"
            ) as QuotationServiceBlockBillingType,
            payment_terms: String(lib?.payment_terms || ""),
            service_terms: String(lib?.service_terms || ""),
          };
        }),
      );
    } else {
      setServiceBlocks([]);
    }

    setGlobalTerms({
      introduction: q.introduction || "",
      payment_terms_text: q.payment_terms_text || "",
      terms_conditions_text: q.terms_conditions_text || "",
    });

    setSectionToggles((q.section_toggles || DEFAULT_SECTION_TOGGLES) as QuotationSectionToggles);

    setSearchParams({ draftId });
  }, [
    DEFAULT_SECTION_TOGGLES,
    defaultValidUntil,
    draftId,
    getQuotationById,
    quotations,
    refreshQuotations,
    setSearchParams,
    today,
    serviceLibraryById,
  ]);

  // Create a draft immediately if we don't have one (required for Step 1 autosave)

  // Draft will only be created when the user clicks "Save to Draft".

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      toast({ title: "Missing title", description: "Please enter a quotation title", variant: "destructive" });
      return false;
    }
    if (!formData.client_id) {
      toast({ title: "Missing client", description: "Please select a client", variant: "destructive" });
      return false;
    }
    if (!formData.quote_date || !formData.valid_until) {
      toast({ title: "Missing dates", description: "Please select quotation dates", variant: "destructive" });
      return false;
    }
    return true;
  };


  const derivedTotals = useMemo(() => getServiceBlockTotals(serviceBlocks), [serviceBlocks]);

  const autoGeneratedTerms = useMemo(() => {
    if (!termsConditions?.length) return "";

    // Get unique categories from selected services
    const selectedCategories = [
      ...new Set(
        serviceBlocks
          .map((s) => s.category)
          .filter(Boolean)
      ),
    ];

    // General terms
    const generalTerms = termsConditions
      .filter((t) => t.is_general)
      .sort((a, b) => a.sort_order - b.sort_order);

    // Category terms
    const categoryTerms = selectedCategories.flatMap((category) => {
      const rows = termsConditions
        .filter(
          (t) =>
            !t.is_general &&
            t.category?.toLowerCase() === category?.toLowerCase()
        )
        .sort((a, b) => a.sort_order - b.sort_order);



      if (!rows.length) return [];

      return [
        {
          heading: category,
        },
        ...rows,
      ];
    });

    let text = "GENERAL TERMS\n\n";

    generalTerms.forEach((t, index) => {
      text += `${index + 1}. ${t.clause}\n`;
    });

    categoryTerms.forEach((item) => {
      if ("heading" in item) {
        text += `\n\n${item.heading.toUpperCase()}\n\n`;
      } else {
        text += `• ${item.clause}\n`;
      }
    });
    console.log("SERVICE BLOCKS", serviceBlocks);

    console.log("SELECTED CATEGORIES", selectedCategories);

    console.log(
      "CATEGORY TERMS",
      categoryTerms
    );

    console.log(
      "ALL TERMS",
      termsConditions
    );

    console.log("AUTO GENERATED TEXT");
    console.log(text);
    return text;

  }, [serviceBlocks, termsConditions]);

  useEffect(() => {

    setGlobalTerms(prev => {

      if (prev.terms_conditions_text === autoGeneratedTerms) {
        return prev;
      }

      return {
        ...prev,
        terms_conditions_text: autoGeneratedTerms,
      };

    });

  }, [autoGeneratedTerms]);

  const filteredServices = useMemo(() => {
    const search = serviceSearch.toLowerCase().trim();

    return services.filter((service) => {
      if (!service.is_active) return false;

      if (!search) return true;

      return (
        service.name?.toLowerCase().includes(search) ||
        service.category?.toLowerCase().includes(search) ||
        service.subcategory?.toLowerCase().includes(search) ||
        service.description?.toLowerCase().includes(search)
      );
    });
  }, [services, serviceSearch]);

  const persistDraft = useCallback(
    async (partial: Partial<Quotation>) => {
      if (!draftId) return;
      const q = getQuotationById(draftId);
      if (!q) return;

      // Keep legacy quotation.services in sync for compatibility (DO NOT remove).
      const legacyServices = serviceBlocks.map((b, idx) => {
        const lib = serviceLibraryById.get(b.service_id);
        const pricing_model = (lib?.pricing_model || "fixed") as PricingModel;

        return {
          id: `${draftId}-${b.service_id}-${idx}`,
          quotation_id: draftId,
          service_id: b.service_id,
          service_name: b.service_name,
          description: b.description || null,
          pricing_model,
          quantity: 1,
          unit_price: n(b.price),
          total: n(b.price),
          is_included: true,
          custom_notes: null,
          sort_order: idx,
          created_at: q.created_at,
        };
      });

      const updated: Quotation = {
        ...q,
        ...partial,
        title: partial.title ?? q.title,
        client_id: partial.client_id ?? q.client_id,
        quote_date: partial.quote_date ?? q.quote_date,
        valid_until: partial.valid_until ?? q.valid_until,
        section_toggles: partial.section_toggles ?? q.section_toggles,
        introduction: partial.introduction ?? q.introduction,
        payment_terms_text: partial.payment_terms_text ?? q.payment_terms_text,
        terms_conditions_text: partial.terms_conditions_text ?? q.terms_conditions_text,
        current_step:
          partial.current_step ??
          q.current_step,
        // service_blocks: partial.service_blocks ?? (q as unknown as { service_blocks?: QuotationServiceBlock[] }).service_blocks,
        service_blocks: partial.service_blocks !== undefined ? partial.service_blocks : serviceBlocks,
        services: partial.services ?? legacyServices,
        subtotal: partial.subtotal ?? derivedTotals.total,
        total: partial.total ?? derivedTotals.total,
        updated_at: nowIso(),
      } as Quotation;

      await updateQuotation(updated);
    },
    [derivedTotals.total, draftId, getQuotationById, serviceBlocks, serviceLibraryById, updateQuotation],
  );

  // STEP 1 — Auto-save draft immediately
  // useEffect(() => {
  //   if (!draftId) return;
  //   persistDraft({
  //     title: formData.title,
  //     client_id: formData.client_id || null,
  //     quote_date: formData.quote_date,
  //     valid_until: formData.valid_until,
  //   }).catch(() => {
  //     // swallow
  //   });
  // }, [draftId, formData, persistDraft]);

  // Step 1 is no longer auto-saved.
  // Data stays in local state until Save Draft.


  // STEP 2-3 — Auto-save per change
  // const lastPersistedBlocksRef = useRef<{ draftId: string; signature: string } | null>(null);
  // useEffect(() => {
  //   if (!draftId) return;
  //   const signature = JSON.stringify(serviceBlocks);

  //   if (lastPersistedBlocksRef.current?.draftId !== draftId) {
  //     lastPersistedBlocksRef.current = { draftId, signature };
  //     return;
  //   }
  //   if (lastPersistedBlocksRef.current.signature === signature) return;
  //   lastPersistedBlocksRef.current = { draftId, signature };

  //   persistDraft({ service_blocks: serviceBlocks, subtotal: derivedTotals.total, total: derivedTotals.total }).catch((err) => {
  //     if (import.meta.env.DEV) console.error("Failed to autosave service blocks", err);
  //   });
  // }, [derivedTotals.total, draftId, persistDraft, serviceBlocks]);

  // Step 2 is saved only when Save Draft is clicked.

  // STEP 4 — Auto-save
  // const lastPersistedGlobalRef = useRef<{ draftId: string; signature: string } | null>(null);
  // useEffect(() => {
  //   if (!draftId) return;
  //   const signature = JSON.stringify({ sectionToggles, globalTerms });

  //   if (lastPersistedGlobalRef.current?.draftId !== draftId) {
  //     lastPersistedGlobalRef.current = { draftId, signature };
  //     return;
  //   }

  //   if (lastPersistedGlobalRef.current.signature === signature) return;
  //   lastPersistedGlobalRef.current = { draftId, signature };

  //   persistDraft({
  //     section_toggles: sectionToggles,
  //     introduction: globalTerms.introduction || null,
  //     payment_terms_text: globalTerms.payment_terms_text || null,
  //     terms_conditions_text: globalTerms.terms_conditions_text || null,
  //   }).catch((err) => {
  //     if (import.meta.env.DEV) console.error("Failed to autosave global terms", err);
  //   });
  // }, [draftId, globalTerms, persistDraft, sectionToggles]);

  // Global terms are saved only when Save Draft is clicked.

  const addOrRemoveServiceAsBlock = (serviceId: string, checked: boolean) => {
    const lib = serviceLibraryById.get(serviceId);
    if (!lib) return;
    console.log("Selected Service Object:", lib);
    console.log("Base Price:", lib?.base_price);
    console.log("MILESTONE TEMPLATE", lib.milestone_template);

    setServiceBlocks((prev) => {
      if (checked) {
        if (prev.some((b) => b.service_id === serviceId)) return prev;
        return [
          ...prev,
          {
            service_id: lib.id,
            service_name: lib.name,
            description: String(lib.description || ""),
            category: String(lib.category || ""),
            subcategory: String(("subcategory" in lib ? (lib as { subcategory?: string | null }).subcategory : "") || ""),
            scope_of_work: String(lib.scope_of_work || ""),
            deliverables: String(lib.deliverables || ""),
            timeline: String(lib.timeline || ""),
            price:
              lib.billing_type === "milestone"
                ? (
                  Array.isArray(lib.milestone_template) &&
                  lib.milestone_template.length > 0
                )
                  ? lib.milestone_template.reduce(
                    (sum, m) => sum + Number(m.amount || 0),
                    0
                  )
                  : Number(lib.base_price)
                : Number(lib.base_price),
            billing_type: (
              lib.billing_type === "one_time" ||
                lib.billing_type === "monthly" ||
                lib.billing_type === "milestone" ||
                lib.billing_type === "retainer"
                ? lib.billing_type
                : "one_time"

            ) as QuotationServiceBlockBillingType,

            duration_months: (() => {
              const months =
                ("duration_months" in lib
                  ? (lib as { duration_months?: number | null }).duration_months
                  : null) ?? 1;

              return Number(months) || 1;
            })(),

            monthly_amount:
              lib.billing_type === "monthly"
                ? calculateMonthly(
                  Number(lib.base_price),
                  Number(
                    ("duration_months" in lib
                      ? (lib as { duration_months?: number | null }).duration_months
                      : 1) || 1
                  )
                ).monthlyAmount
                : undefined,
            payment_terms: String(("payment_terms" in lib ? (lib as { payment_terms?: string | null }).payment_terms : "") || ""),
            service_terms: String(lib.service_terms || ""),
            milestone_template:
              lib.billing_type === "milestone"
                ? (
                  typeof lib.milestone_template === "string"
                    ? JSON.parse(lib.milestone_template)
                    : lib.milestone_template || []
                )
                : [],
          },
        ];
      }
      return prev.filter((b) => b.service_id !== serviceId);
    });
  };

  const updateBlock = (idx: number, patch: Partial<QuotationServiceBlock>) => {
    setServiceBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  // const goNext = () => {
  //   if (step === 1) {
  //     if (!validateStep1()) return;
  //     setStep(2);
  //     return;
  //   }
  //   if (step === 2) {
  //     setStep(3);
  //     return;
  //   }
  //   if (step === 3) {
  //     setStep(4);
  //     return;
  //   }
  //   if (step === 4) {
  //     setStep(5);
  //     return;
  //   }
  // };

  const goNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
      return;
    }
    if (step === 4) {
      setStep(5);
      return;
    }
  };

  const goBack = () => {
    if (step === 1) return;
    setStep((s) => (s - 1) as BuilderStep);
  };

  // const buildPreviewQuotation = (): Quotation | null => {
  //   if (!draftId) return null;
  //   const q = getQuotationById(draftId);
  //   if (!q) return null;

  //   const currentClient = clients.find(c => c.id === formData.client_id) || q.client;

  //   return {
  //     ...q,
  //     title: formData.title,
  //     client_id: formData.client_id || null,
  //     quote_date: formData.quote_date,
  //     valid_until: formData.valid_until,
  //     introduction: sectionToggles.introduction ? (globalTerms.introduction || null) : null,
  //     payment_terms_text: sectionToggles.payment_terms ? (globalTerms.payment_terms_text || null) : null,
  //     terms_conditions_text: sectionToggles.terms_conditions ? (globalTerms.terms_conditions_text || null) : null,
  //     section_toggles: sectionToggles,
  //     service_blocks: serviceBlocks,
  //     subtotal: derivedTotals.total,
  //     total: derivedTotals.total,
  //     client: currentClient,
  //   } as Quotation;
  // };

  const buildPreviewQuotation = (): Quotation | null => {

    // console.log("draftId =", draftId);
    if (!draftId) {
      return {
        id: "preview",
        quotation_number: "Preview",

        title: formData.title,
        client_id: formData.client_id || null,

        quote_date: formData.quote_date,
        valid_until: formData.valid_until,

        introduction: globalTerms.introduction || null,
        scope_of_work: null,

        payment_terms_text: globalTerms.payment_terms_text || null,
        terms_conditions_text: globalTerms.terms_conditions_text || null,

        currency,

        subtotal: derivedTotals.total,
        total: derivedTotals.total,

        discount: 0,
        discount_type: "percentage",
        tax_rate: 0,
        tax_amount: 0,

        status: "draft",

        services: [],
        service_blocks: serviceBlocks,

        section_toggles: sectionToggles,

        quotation_sections: null,
        selected_points: null,

        notes: null,

        is_template: false,
        template_name: null,

        share_token: null,

        sent_at: null,
        accepted_at: null,
        invoiced_at: null,

        current_step: step,

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        client: clients.find(c => c.id === formData.client_id),

      } as unknown as Quotation;
    }

    // const q = getQuotationById(draftId);

    // console.log("quotation from store =", q);

    // if (!q) {
    //   console.log("Quotation not found");
    //   return null;
    // }

    const q =
      getQuotationById(draftId) ||
      quotations.find(x => x.id === draftId);

    // console.log("quotation =", q);

    if (!q) {
      console.log('Quotation Not found');
      return {
        id: draftId,
        title: formData.title,
        client_id: formData.client_id || null,
        quote_date: formData.quote_date,
        valid_until: formData.valid_until,
        quotation_number: `QT-${draftId}`,
        status: 'draft',
        service_blocks: serviceBlocks,
        services: [],
        subtotal: derivedTotals.total,
        total: derivedTotals.total,
        discount: 0,
        tax_rate: 0,
        tax_amount: 0,
        currency,
        introduction: sectionToggles.introduction ? (globalTerms.introduction || null) : null,
        payment_terms_text: sectionToggles.payment_terms ? (globalTerms.payment_terms_text || null) : null,
        terms_conditions_text: sectionToggles.terms_conditions ? (globalTerms.terms_conditions_text || null) : null,
        section_toggles: sectionToggles,
        client: clients.find(c => c.id === formData.client_id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Quotation;
    }

    const currentClient =
      clients.find(c => c.id === formData.client_id) || q.client;

    return {
      ...q,
      title: formData.title,
      client_id: formData.client_id || null,
      quote_date: formData.quote_date,
      valid_until: formData.valid_until,
      introduction: sectionToggles.introduction
        ? (globalTerms.introduction || null)
        : null,
      payment_terms_text: sectionToggles.payment_terms
        ? (globalTerms.payment_terms_text || null)
        : null,
      terms_conditions_text: sectionToggles.terms_conditions
        ? (globalTerms.terms_conditions_text || null)
        : null,
      section_toggles: sectionToggles,
      service_blocks: serviceBlocks,
      subtotal: derivedTotals.total,
      total: derivedTotals.total,
      client: currentClient,
    } as Quotation;
  };

  // const handleSaveDraft = async () => {
  //   if (!draftId) return;
  //   await persistDraft({ status: "draft" });
  //   toast({ title: "Saved", description: "Draft saved." });
  // };

  const handleSaveDraft = async () => {
    try {
      if (draftId) {
        await persistDraft({
          status: "draft",
          current_step: step,
        });

        toast({
          title: "Draft Updated",
          description: `Quotation saved at Step ${step}.`,
        });

        return;
      }

      const createdId = await addQuotation({

        quotation_number: `QT-${Date.now()}`,
        title: formData.title,
        client_id: formData.client_id || null,

        quote_date: formData.quote_date,
        valid_until: formData.valid_until,

        introduction: globalTerms.introduction || null,

        scope_of_work: null,

        payment_terms_text:
          globalTerms.payment_terms_text || null,

        terms_conditions_text:
          globalTerms.terms_conditions_text || null,

        currency,

        subtotal: derivedTotals.total,

        total: derivedTotals.total,

        discount: 0,

        discount_type: "percentage",

        tax_rate: 0,

        tax_amount: 0,

        status: "draft",

        services: [],

        service_blocks: serviceBlocks,

        // section_toggles: DEFAULT_SECTION_TOGGLES,
        section_toggles: sectionToggles,

        quotation_sections: null,

        selected_points: null,

        notes: null,

        is_template: false,

        template_name: null,

        share_token: null,

        sent_at: null,

        accepted_at: null,

        invoiced_at: null,

        // created_at: nowIso(),
        // updated_at: nowIso(),

        current_step: step,
      });
      if (!createdId) {
        throw new Error("Failed to create draft");
      }

      setDraftId(createdId);

      localStorage.setItem(DRAFT_LS_KEY, createdId);

      setSearchParams({ draftId: createdId });

      toast({
        title: "Draft Saved",
        description: `Quotation saved at Step ${step}.`,
      });

    } catch (err) {
      console.error(err);

      toast({
        title: "Error",
        description: "Unable to save draft.",
        variant: "destructive",
      });
    }
  };


  const handleMarkSent = async () => {
    if (!draftId) return;
    if (!validateStep1()) return;
    const now = new Date().toISOString();
    await persistDraft({ status: "sent", sent_at: now });

    localStorage.removeItem(DRAFT_LS_KEY);

    const publicUrl = `${window.location.origin}/public/quotation/${draftId}`;

    // Try clipboard API first, fall back to execCommand for HTTP
    let copied = false;
    try {
      await navigator.clipboard.writeText(publicUrl);
      copied = true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = publicUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      toast({ title: "Link copied", description: "Public quotation link copied to clipboard." });
    } else {
      // Show the URL so user can copy manually
      window.prompt("Copy this quotation link:", publicUrl);
    }
  };

  const handleDownloadPdf = async () => {
    const q = buildPreviewQuotation();
    if (!q) return;

    try {
      const { printDocument } = await import("@/lib/printer");
      const { QuotationDocument } = await import("@/documents/QuotationDocument");

      const clientName = q.client?.business_name || q.client?.name || 'Client';
      const safeClientName = clientName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
      const safeNumber = q.quotation_number.replace(/[^a-zA-Z0-9-_]/g, "_");

      const title = `${safeClientName} - ${safeNumber}`;

      await printDocument(
        <QuotationDocument quotation={q} client={q.client} brandKit={brandKit} />,
        { title }
      );

      toast({ title: "Generated", description: "PDF print dialog opened." });
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast({ title: "Print failed", description: "Could not generate PDF.", variant: "destructive" });
    }
  };

  const stepLabel =
    step === 1
      ? "Basic Info"
      : step === 2
        ? "Services Selection"
        : step === 3
          ? "Service Details"
          : step === 4
            ? "Global Terms"
            : "Review";

  // const previewQuotation = step === 5 ? buildPreviewQuotation() : null;

  // const previewQuotation = step === 5 ? buildPreviewQuotation() : null;
  const previewQuotation = step === 5 ? buildPreviewQuotation() : null;

  // console.log("STEP:", step);
  // console.log("PREVIEW:", previewQuotation);

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <AlertDialog open={draftConflictOpen} onOpenChange={setDraftConflictOpen}>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/quotations">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">New Quotation</h1>
            <p className="text-muted-foreground mt-1">Step {step} of 5 — {stepLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">


          {step > 1 && (
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={goBack}
              disabled={resuming}
            >
              Back
            </Button>
          )}

          {step < 5 && (
            <Button
              className="rounded-xl"
              onClick={goNext}
              disabled={resuming}
            >
              Next

            </Button>
          )}

        </div>
      </div>

      {/* Step content */}
      {step === 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading">Basic Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Label>Quotation Title</Label>
                  <Input
                    list="quotation-title-suggestions"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="rounded-xl"
                    placeholder="e.g., Social Media Management Proposal"
                  />
                  <datalist id="quotation-title-suggestions">
                    {titleSuggestions.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select
                    open={clientSelectOpen}
                    onOpenChange={setClientSelectOpen}
                    value={formData.client_id || undefined}
                    onValueChange={(value) => setFormData((p) => ({ ...p, client_id: value }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <div
                        role="button"
                        tabIndex={0}
                        className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary outline-none focus:bg-accent  "
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openAddClientDialog();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            openAddClientDialog();
                          }
                        }}
                      >
                        <UserPlus className="w-4 h-4 scrollbar-modern" /> + Add New Client
                      </div>
                      <div className="h-px bg-muted my-1" />
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.business_name && `- ${client.business_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quotation Date</Label>
                    <DatePicker
                      value={formData.quote_date}
                      onChange={(value) =>
                        setFormData((p) => ({
                          ...p,
                          quote_date: value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <DatePicker
                      value={formData.valid_until}
                      onChange={(value) =>
                        setFormData((p) => ({
                          ...p,
                          valid_until: value,
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* <div>
            <Card className="glass-card lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="font-heading">Saved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Saved automatically as you type.</p>
              </CardContent>
            </Card>

          </div> */}

          <div>
            <Card className="glass-card lg:sticky lg:top-6 rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base">Client Summary</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Information updates automatically when a client is selected.
                </p>
              </CardHeader>

              <CardContent className="p-0">
                {!formData.client_id || !clients.find((c) => c.id === formData.client_id) ? (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center text-center py-12 px-6 animate-in fade-in-20 duration-200">
                    <div className="w-24 h-24 mb-3 rounded-full bg-gray-100 flex items-center justify-center animate-in [animation-duration:5s] shadow-sm">
                      <img
                        src="/public/office-man.png"
                        alt="Person"
                        className="w-18 h-18 object-contain opacity-70 select-none pointer-events-none"
                        draggable={false}
                      />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No Client Selected</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                      Select a client from the form to view their information here.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const selectedClient = clients.find(
                      (c) => c.id === formData.client_id
                    );

                    if (!selectedClient) return null;

                    return (
                      <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                        {/* Name / Business */}
                        <div className="p-5 border-b border-border/50 bg-muted/30 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/10 transition-transform duration-300 hover:scale-105">
                              <span className="text-sm font-bold text-primary">
                                {(selectedClient.name || "?").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold font-heading truncate">
                                {selectedClient.name || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {selectedClient.business_name || "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Business Details */}
                        <div className="border-b border-border/50">
                          <div className="flex items-center justify-between px-5 py-2.5 transition-colors duration-200 hover:bg-muted/40">
                            <span className="text-xs text-muted-foreground">Business Type</span>
                            <span className="text-sm font-bold text-right truncate max-w-[60%]">
                              {selectedClient.business_type || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-5 py-2.5 transition-colors duration-200 hover:bg-muted/40">
                            <span className="text-xs text-muted-foreground">Industry</span>
                            <span className="text-sm font-bold text-right truncate max-w-[60%]">
                              {selectedClient.industry || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-5 py-2.5 transition-colors duration-200 hover:bg-muted/40">
                            <span className="text-xs text-muted-foreground">Location</span>
                            <span className="text-sm font-bold text-right truncate max-w-[60%]">
                              {selectedClient.city || selectedClient.location || "—"}
                            </span>
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="border-b border-border/50">
                          <div className="flex items-center justify-between px-5 py-2.5 transition-colors duration-200 hover:bg-muted/40">
                            <span className="text-xs text-muted-foreground">Email</span>
                            <span className="text-sm font-bold text-right truncate max-w-[60%]">
                              {selectedClient.email || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-5 py-2.5 transition-colors duration-200 hover:bg-muted/40">
                            <span className="text-xs text-muted-foreground">Phone</span>
                            <span className="text-sm font-bold text-right truncate max-w-[60%]">
                              {selectedClient.phone || "—"}
                            </span>
                          </div>
                          {/* <div className="flex items-center justify-between px-5 py-2.5 transition-colors duration-200 hover:bg-muted/40">
                            <span className="text-xs text-muted-foreground">GSTIN</span>
                            <span className="text-sm font-bold text-right truncate max-w-[60%]">
                              {selectedClient.gstin || "—"}
                            </span>
                          </div> */}
                        </div>

                        {/* Created */}
                        <div className="flex items-center justify-between px-5 py-3.5 transition-colors duration-200 hover:bg-muted/40">
                          <span className="text-xs text-muted-foreground">Created</span>
                          <span className="text-sm font-bold">
                            {selectedClient.created_at
                              ? new Date(selectedClient.created_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                              : "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null
      }

      {/* Step content */}
      {/* Step 1 Footer */}
      {step === 1 && (
        <div className="flex justify-between items-center mt-8">
          {/* Approve / Reject */}


          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          {/* <Button
            onClick={goNext}
            className="rounded-xl"
          >
            Next
          </Button> */}
        </div>
      )}


      {
        step === 2 ? (
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">

            {/* Left */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading">Services Selection</CardTitle>
                  <Input
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="rounded-xl"
                  />
                </CardHeader>
                <CardContent className="lg:col-span-5 space-y-6">
                  {services.length > 0 ? (
                    <div className="space-y-2">
                      {filteredServices.map((service) => {
                        const checked = serviceBlocks.some((b) => b.service_id === service.id);
                        return (
                          <label
                            key={service.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => addOrRemoveServiceAsBlock(service.id, e.target.checked)}
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{service.name}</p>
                              {service.description ? (
                                <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                              ) : null}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      {serviceSearch
                        ? `No services found for "${serviceSearch}"`
                        : "No services available."}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* {serviceBlocks.length > 0 ? (
              
            ) : null} */}
            </div>

            <div className="w-[500px]">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="lg:col-span-4 space-y-6">
                  {serviceBlocks.map((b, idx) => {

                    const monthlyPlan =
                      b.billing_type === "monthly"
                        ? calculateMonthly(
                          b.price,
                          b.duration_months || 1
                        )
                        : null;

                    return (
                      <div
                        key={`${b.service_id}-${idx}`}
                        className="p-4 rounded-xl border border-purple-500/40 bg-purple-600/10 space-y-4 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]">


                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {b.service_name || "Service"}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Set price and billing type
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              addOrRemoveServiceAsBlock(
                                b.service_id,
                                false
                              )
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>


                        {/* Billing Type */}
                        <div className="space-y-2">
                          <Label>Billing Type</Label>

                          <Select
                            value={b.billing_type}
                            onValueChange={(value) => {

                              const billing =
                                value as QuotationServiceBlockBillingType;

                              updateBlock(idx, {

                                billing_type: billing,

                                milestone_template:

                                  billing === "milestone"

                                    ? (
                                      b.milestone_template?.length
                                        ? b.milestone_template
                                        : [
                                          createMilestone(0),
                                          createMilestone(1)
                                        ]
                                    )

                                    : b.milestone_template

                              });

                            }}
                          >
                            <SelectTrigger className="rounded-xl w-full">
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="one_time">
                                One-Time
                              </SelectItem>

                              <SelectItem value="monthly">
                                Monthly
                              </SelectItem>

                              <SelectItem value="retainer">
                                Retainer
                              </SelectItem>

                              <SelectItem value="milestone">
                                Milestone
                              </SelectItem>
                            </SelectContent>

                          </Select>
                        </div>
                        <div className="space-y-5">

                          {/* Total Project Price */}
                          <div className="space-y-2">
                            <Label>Total Project Price</Label>

                            <Input
                              type="number"
                              value={b.price}
                              onChange={(e) => {

                                const price = Number(e.target.value);

                                if (b.billing_type === "monthly") {

                                  const plan = calculateMonthly(
                                    price,
                                    b.duration_months || 1
                                  );

                                  updateBlock(idx, {
                                    price,
                                    monthly_amount: plan.monthlyAmount,
                                  });

                                } else {

                                  updateBlock(idx, {
                                    price,
                                  });

                                }

                              }}
                            />
                          </div>

                          {/* Show only for milestone billing */}
                          {b.billing_type === "milestone" && (
                            <>
                              {/* Number of Milestones */}

                              <div className="space-y-2">

                                <Label>Number of Milestones</Label>

                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={b.milestone_count ?? 1}
                                  onChange={(e) => {

                                    const count = Math.max(
                                      1,
                                      Number(e.target.value)
                                    );

                                    updateBlock(idx, {
                                      milestone_count: count,
                                      milestone_template: generateMilestones(count),
                                    });

                                  }}
                                />

                              </div>

                              {/* Milestone Rows */}

                              <div className="space-y-3">

                                {(b.milestone_template ?? []).map((m) => (

                                  <div
                                    key={m.id}
                                    className="grid grid-cols-[2fr_110px_150px] gap-3 items-center"
                                  >

                                    <Input
                                      value={m.label}
                                      placeholder="Milestone Name"
                                      onChange={(e) => {

                                        updateBlock(idx, {
                                          milestone_template: updateMilestoneLabel(
                                            b.milestone_template ?? [],
                                            m.id,
                                            e.target.value
                                          ),
                                        });

                                      }}
                                    />

                                    <div className="relative">

                                      <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={m.percentage}
                                        className="pr-8"
                                        onChange={(e) => {

                                          const updated =
                                            updateMilestonePercentage(
                                              b.milestone_template ?? [],
                                              m.id,
                                              Number(e.target.value),
                                              b.price
                                            );

                                          updateBlock(idx, {
                                            milestone_template: updated,
                                          });

                                        }}
                                      />

                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        %
                                      </span>

                                    </div>

                                    <div className="h-10 rounded-xl border bg-muted/40 flex items-center justify-center font-semibold">

                                      {currency === "INR" ? "₹" : "$"}

                                      {m.amount.toLocaleString()}

                                    </div>

                                  </div>

                                ))}

                              </div>

                              {/* Summary */}

                              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">

                                <div className="flex justify-between">

                                  <span>Total Percentage</span>

                                  <span
                                    className={
                                      calculateTotalPercentage(
                                        b.milestone_template ?? []
                                      ) === 100
                                        ? "font-semibold text-green-600"
                                        : "font-semibold text-red-600"
                                    }
                                  >
                                    {calculateTotalPercentage(
                                      b.milestone_template ?? []
                                    )}
                                    %
                                  </span>

                                </div>

                                <div className="flex justify-between">

                                  <span>Remaining</span>

                                  <span className="font-semibold">

                                    {calculateRemainingPercentage(
                                      b.milestone_template ?? []
                                    )}
                                    %

                                  </span>

                                </div>

                                <div className="border-t pt-3 flex justify-between text-lg font-bold">

                                  <span>Total Amount</span>

                                  <span>

                                    {currency === "INR" ? "₹" : "$"}

                                    {calculateMilestoneTotal(
                                      b.milestone_template ?? []
                                    ).toLocaleString()}

                                  </span>

                                </div>

                              </div>
                            </>
                          )}

                        </div>

                        {/* Monthly Duration */}

                        {b.billing_type === "monthly" && (

                          <div className="space-y-2">

                            <Label>Duration (Months)</Label>

                            <Input
                              type="number"
                              min={1}
                              value={b.duration_months || 1}
                              onChange={(e) => {

                                const months = Math.max(
                                  1,
                                  Number(e.target.value)
                                );

                                const plan = calculateMonthly(
                                  b.price,
                                  months
                                );

                                updateBlock(idx, {

                                  duration_months: months,

                                  monthly_amount:
                                    plan.monthlyAmount,

                                });

                              }}
                              className="rounded-xl"
                            />

                          </div>

                        )}

                        {/* Monthly Summary */}

                        {monthlyPlan && (

                          <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 space-y-3">

                            <div className="flex justify-between text-sm">

                              <span className="text-muted-foreground">
                                Total Project Cost
                              </span>

                              <span className="font-semibold">
                                {currency === "INR" ? "₹" : "$"}
                                {monthlyPlan.totalAmount.toLocaleString()}
                              </span>

                            </div>

                            <div className="flex justify-between text-sm">

                              <span className="text-muted-foreground">
                                Monthly Payment
                              </span>

                              <span className="font-bold text-primary text-lg">
                                {currency === "INR" ? "₹" : "$"}
                                {(monthlyPlan.monthlyAmount ?? 0).toLocaleString()}
                              </span>

                            </div>

                            <div className="text-xs text-center text-muted-foreground border-t pt-2">

                              {monthlyPlan.durationMonths} Monthly Payments

                            </div>

                          </div>

                        )}

                      </div>
                    );

                  })}
                </CardContent>
              </Card>
              <Card className="glass-card lg:sticky lg:top-6">
                <CardHeader>
                  <CardTitle className="font-heading">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Selected services</span>
                    <span className="text-foreground font-medium">{serviceBlocks.length}</span>
                  </div>
                  {derivedTotals.monthly > 0 ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Monthly</span>
                      <span className="text-foreground font-medium">{(currency === "INR" ? "₹" : "$")}{derivedTotals.monthly.toLocaleString()}</span>
                    </div>
                  ) : null}
                  {derivedTotals.one_time > 0 ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">One-time</span>
                      <span className="text-foreground font-medium">{(currency === "INR" ? "₹" : "$")}{derivedTotals.one_time.toLocaleString()}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-heading font-semibold text-foreground">Total</span>
                    <span className="font-heading font-bold text-foreground">{(currency === "INR" ? "₹" : "$")}{derivedTotals.total.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null
      }

      {step === 2 && (
        <div className="flex justify-between items-center mt-8">

          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          <div className="flex gap-3">

            <Button
              variant="outline"
              onClick={goBack}
              className="rounded-xl"
            >
              Back
            </Button>

            <Button
              onClick={goNext}
              className="rounded-xl"
            >
              Next
            </Button>

          </div>

        </div>
      )}
      {
        step === 3 ? (
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-foreground">Service Details</h2>
              <span className="text-sm text-muted-foreground">Add details for {serviceBlocks.length} services</span>
            </div>

            {serviceBlocks.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No services selected. Go back to Step 2.</p>
                  <Button variant="link" onClick={goBack}>Back to Services</Button>
                </CardContent>
              </Card>
            ) : (
              serviceBlocks.map((b, idx) => (

                <Card key={`${b.service_id}-${idx}`} className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-primary flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                        {idx + 1}
                      </div>
                      {b.service_name || "Service"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <RichEditor
                        value={b.description || ""}
                        onChange={(val) => updateBlock(idx, { description: val })}
                        className="min-h-[100px]"
                        placeholder="Service description..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Scope of Work</Label>
                      <RichEditor
                        value={b.scope_of_work || ""}
                        onChange={(val) => updateBlock(idx, { scope_of_work: val })}
                        className="min-h-[120px]"
                        placeholder="Write scope of work for this service..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Deliverables (optional)</Label>
                      <RichEditor
                        value={b.deliverables || ""}
                        onChange={(val) => updateBlock(idx, { deliverables: val })}
                        className="min-h-[80px]"
                        placeholder="Optional deliverables for this service..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Timeline (optional)</Label>
                      <Input
                        value={b.timeline || ""}
                        onChange={(e) => updateBlock(idx, { timeline: e.target.value })}
                        className="rounded-xl"
                        placeholder="e.g., 2 weeks"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Service-specific payment terms (optional)</Label>
                        <RichEditor
                          value={b.payment_terms || ""}
                          onChange={(val) => updateBlock(idx, { payment_terms: val })}
                          className="min-h-[100px]"
                          placeholder="Optional payment terms..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Service-specific terms (optional)</Label>
                        <RichEditor
                          value={b.service_terms || ""}
                          onChange={(val) => updateBlock(idx, { service_terms: val })}
                          className="min-h-[100px]"
                          placeholder="Optional terms..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : null
      }

      {step === 3 && (
        <div className="flex justify-between items-center mt-8">

          <Button
            variant="outline"
            onClick={handleSaveDraft}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>

            <Button onClick={goNext}>
              Next
            </Button>
          </div>

        </div>
      )}

      {
        step === 4 ? (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading">Global Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-sm text-foreground">Show Introduction</Label>
                    <Switch checked={sectionToggles.introduction} onCheckedChange={(checked) => setSectionToggles((p) => ({ ...p, introduction: checked }))} />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-sm text-foreground">Show Payment Terms</Label>
                    <Switch checked={sectionToggles.payment_terms} onCheckedChange={(checked) => setSectionToggles((p) => ({ ...p, payment_terms: checked }))} />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-sm text-foreground">Show Terms & Conditions</Label>
                    <Switch checked={sectionToggles.terms_conditions} onCheckedChange={(checked) => setSectionToggles((p) => ({ ...p, terms_conditions: checked }))} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These global sections apply only when a service does not define its own terms.
                  </p>
                </div>

                {sectionToggles.introduction ? (
                  <div className="space-y-2">
                    <Label>Introduction</Label>
                    <Textarea
                      value={globalTerms.introduction}
                      onChange={(e) => setGlobalTerms((p) => ({ ...p, introduction: e.target.value }))}
                      className="min-h-[100px] rounded-xl"
                      placeholder="Optional introduction shown at the top of the quotation."
                    />
                  </div>
                ) : null}

                {sectionToggles.payment_terms ? (
                  <div className="space-y-2">
                    <Label>Overall payment terms (fallback)</Label>
                    <Textarea
                      value={globalTerms.payment_terms_text}
                      onChange={(e) => setGlobalTerms((p) => ({ ...p, payment_terms_text: e.target.value }))}
                      className="min-h-[100px] rounded-xl"
                      placeholder="Used if a service doesn't specify its own payment terms."
                    />
                  </div>
                ) : null}

                {sectionToggles.terms_conditions ? (
                  <div className="space-y-2">
                    <Label>Overall terms & conditions (fallback)</Label>
                    <Textarea
                      value={
                        globalTerms.terms_conditions_text}
                      onChange={(e) => setGlobalTerms((p) => ({ ...p, terms_conditions_text: e.target.value }))}
                      className="min-h-[120px] rounded-xl"
                      placeholder="Used if a service doesn't specify its own terms."
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null
      }

      {step === 4 && (
        <div className="flex justify-between items-center mt-8">

          <Button
            variant="outline"
            onClick={handleSaveDraft}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>

            <Button onClick={goNext}>
              Review
            </Button>
          </div>

        </div>
      )}

      {
        step === 5 && (() => {
          const pq = previewQuotation ?? buildPreviewQuotation();
          if (!pq) return null;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 max-w-[1320px] mx-auto">
              <div>
                <QuotationLayout quotation={pq} brandKit={brandKit} mode="screen" />
              </div>

              <aside className="no-print lg:sticky lg:top-6 h-fit">
                <div className="glass-card p-6 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Review</p>
                    <p className="font-heading font-bold text-xl text-foreground mt-1">{pq.client?.business_name || pq.client?.name || "Client"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{pq.title || "Quotation"}</p>
                  </div>
                  <div className="border-t border-border/50 pt-4 space-y-2">
                    {derivedTotals.monthly > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Monthly total</span>
                        <span className="text-foreground font-medium">{(currency === "INR" ? "₹" : "$")}{derivedTotals.monthly.toLocaleString()}</span>
                      </div>
                    ) : null}
                    {derivedTotals.one_time > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">One-time total</span>
                        <span className="text-foreground font-medium">{(currency === "INR" ? "₹" : "$")}{derivedTotals.one_time.toLocaleString()}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-heading font-semibold text-foreground">Total</span>
                      <span className="font-heading font-bold text-2xl text-foreground">{(currency === "INR" ? "₹" : "$")}{derivedTotals.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={goBack}>
                      <Pencil className="w-4 h-4" /> Edit Quotation
                    </Button>

                    <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={handleSaveDraft}>
                      <Save className="w-4 h-4" /> Save Draft
                    </Button>
                    <Button className="w-full gap-2 rounded-xl" onClick={handleMarkSent}>
                      <Send className="w-4 h-4" /> Share Quotation Link
                    </Button>
                    <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={handleDownloadPdf}>
                      <Download className="w-4 h-4" /> Generate PDF
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Quotation is not saved automatically.

                    Click "Save Draft" to save your progress.

                    Your draft will reopen from the same step.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">

                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={async () => {

                      let quotationId = draftId;

                      // Create quotation first if it hasn't been saved
                      if (!quotationId) {

                        await handleSaveDraft();

                        quotationId =
                          localStorage.getItem("currentDraftId");

                      }

                      if (!quotationId) return;

                      const quotation =
                        getQuotationById(quotationId);

                      if (!quotation) return;

                      await updateQuotation({

                        ...quotation,

                        status: "accepted",

                        accepted_at: new Date().toISOString(),

                      });

                      toast({
                        title: "Quotation Approved",
                        description: "Quotation moved to Accepted."
                      });

                    }}
                  >
                    Approve
                  </Button>


                  <Button
                    variant="destructive"
                    onClick={async () => {

                      let quotationId = draftId;

                      if (!quotationId) {

                        await handleSaveDraft();

                        quotationId =
                          localStorage.getItem("currentDraftId");

                      }

                      if (!quotationId) return;

                      const quotation =
                        getQuotationById(quotationId);

                      if (!quotation) return;

                      await updateQuotation({

                        ...quotation,

                        status: "declined",

                      });

                      toast({
                        title: "Quotation Declined",
                        description: "Quotation moved to Declined."
                      });

                    }}
                  >
                    Reject
                  </Button>

                </div>
              </aside>
            </div>
          );
        })()
      }

      <AddClientDialog
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onClientCreated={(clientId) => {
          setFormData((p) => ({ ...p, client_id: clientId }));
        }}
      />
    </div>

  )
}