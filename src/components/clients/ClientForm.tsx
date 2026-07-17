import { useEffect, useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SafeClientOptions } from "@/components/clients/useClientOptions";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const OTHER = "Other";

const createSchema = (
  getBusinessTypes: () => string[],
  getIndustries: () => string[],
) => z
  .object({
    business_name: z.string().trim().min(1, "Business Name is required"),
    name: z.string().trim().min(1, "Contact Name is required"),

    business_type: z.string().trim().min(1, "Business Type is required"),
    custom_business_type: z.string().trim().optional(),

    industry: z.string().trim().min(1, "Industry is required"),
    custom_industry: z.string().trim().optional(),

    email: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: "Valid email is required" }),

    phone: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
    whatsapp_same_as_phone: z.boolean().default(false),

    location: z.string().trim().optional(),
    address: z.string().trim().optional(),
  })
  .superRefine((v, ctx) => {
    const businessTypes = getBusinessTypes();
    const industries = getIndustries();

    const btOk = businessTypes.includes(v.business_type);
    const indOk = industries.includes(v.industry);

    if (v.business_type === OTHER) {
      if (!v.custom_business_type?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["custom_business_type"],
          message: "Please enter a business type",
        });
      }
    } else if (!btOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["business_type"],
        message: "Please select a business type",
      });
    }

    if (v.industry === OTHER) {
      if (!v.custom_industry?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["custom_industry"],
          message: "Please enter an industry",
        });
      }
    } else if (!indOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["industry"],
        message: "Please select an industry",
      });
    }
  });

type ClientFormValues = z.infer<ReturnType<typeof createSchema>>;

export type ClientFormSubmitPayload = {
  business_name: string;
  name: string;
  business_type: string;
  custom_business_type: string | null;
  industry: string;
  custom_industry: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  address: string | null;
};

export type ClientFormInitialValues = Partial<ClientFormSubmitPayload> & {
  whatsapp_same_as_phone?: boolean;
};

function normalize(values: ClientFormValues): ClientFormSubmitPayload {
  const businessType = values.business_type === OTHER ? (values.custom_business_type || "").trim() : values.business_type.trim();
  const industry = values.industry === OTHER ? (values.custom_industry || "").trim() : values.industry.trim();

  return {
    business_name: values.business_name.trim(),
    name: values.name.trim(),
    business_type: businessType,
    custom_business_type: values.business_type === OTHER ? businessType : null,
    industry,
    custom_industry: values.industry === OTHER ? industry : null,
    email: (values.email || "").trim(),
    phone: values.phone?.trim() ? values.phone.trim() : null,
    whatsapp: values.whatsapp?.trim() ? values.whatsapp.trim() : null,
    location: values.location?.trim() ? values.location.trim() : null,
    address: values.address?.trim() ? values.address.trim() : null,
  };
}

function toComparable(values: ClientFormValues) {
  const payload = normalize(values);
  return {
    ...payload,
    whatsapp_same_as_phone: Boolean(values.whatsapp_same_as_phone),
    business_type_selection: values.business_type,
    industry_selection: values.industry,
    custom_business_type: (values.custom_business_type || "").trim() || null,
    custom_industry: (values.custom_industry || "").trim() || null,
  };
}

export type ClientFormProps = {
  options: SafeClientOptions;
  initialValues?: ClientFormInitialValues | null;
  submitLabel: string;
  onSubmit: (payload: ClientFormSubmitPayload) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
};

export default function ClientForm({ options, initialValues, submitLabel, onSubmit, onCancel, className }: ClientFormProps) {
  const businessTypes = useMemo(() => options?.businessTypes ?? [], [options?.businessTypes]);
  const industries = useMemo(() => options?.industries ?? [], [options?.industries]);

  // Keep the latest options available inside Zod refinements without recreating the schema.
  const optionsBusinessTypesRef = useRef<string[]>([]);
  const optionsIndustriesRef = useRef<string[]>([]);
  optionsBusinessTypesRef.current = businessTypes.map((s) => s.trim()).filter(Boolean);
  optionsIndustriesRef.current = industries.map((s) => s.trim()).filter(Boolean);

  const defaultValues: ClientFormValues = useMemo(() => {
    const bt = (initialValues?.business_type || "").trim();
    const ind = (initialValues?.industry || "").trim();

    return {
      business_name: initialValues?.business_name || "",
      name: initialValues?.name || "",

      // Prefill: if stored value isn't in Settings options, fall back to Other + custom input.
      business_type: optionsBusinessTypesRef.current.includes(bt) ? bt : (bt ? OTHER : ""),
      custom_business_type: optionsBusinessTypesRef.current.includes(bt) ? "" : bt,

      industry: optionsIndustriesRef.current.includes(ind) ? ind : (ind ? OTHER : ""),
      custom_industry: optionsIndustriesRef.current.includes(ind) ? "" : ind,

      email: initialValues?.email || "",

      phone: initialValues?.phone || "",
      whatsapp: initialValues?.whatsapp || "",
      whatsapp_same_as_phone: Boolean(initialValues?.whatsapp_same_as_phone),

      location: initialValues?.location || "",
      address: initialValues?.address || "",
    };
  }, [initialValues]);

  const schema = useMemo(
    () =>
      createSchema(
        () => optionsBusinessTypesRef.current,
        () => optionsIndustriesRef.current,
      ),
    [],
  );

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const { watch, setValue, handleSubmit, formState, control } = form;
  const phone = watch("phone");
  const whatsappSame = watch("whatsapp_same_as_phone");
  const register = form.register;

  useEffect(() => {
    if (whatsappSame) {
      setValue("whatsapp", phone || "", { shouldValidate: true, shouldDirty: true });
    }
  }, [phone, setValue, whatsappSame]);


  const businessTypeOptions = useMemo(() => {
    const base = (businessTypes || []).map((s) => s.trim()).filter(Boolean);
    const withOther = base.includes(OTHER) ? base : [...base, OTHER];
    return withOther.length ? withOther : [OTHER];
  }, [businessTypes]);

  const industryOptions = useMemo(() => {
    const base = (industries || []).map((s) => s.trim()).filter(Boolean);
    const withOther = base.includes(OTHER) ? base : [...base, OTHER];
    return withOther.length ? withOther : [OTHER];
  }, [industries]);

  const initialComparable = useMemo(() => toComparable(defaultValues), [defaultValues]);
  const currentValues = watch();
  const currentComparable = useMemo(() => toComparable(currentValues), [currentValues]);
  const hasAnyChange = JSON.stringify(currentComparable) !== JSON.stringify(initialComparable);

  const submit = handleSubmit(async (values) => {
    await onSubmit(normalize(values));
  });

  const err = (key: keyof ClientFormValues) => formState.errors[key]?.message;

  return (
    <form className={cn("space-y-5", className)} onSubmit={submit}>
      {businessTypes.length === 0 || industries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Client options are empty in Settings. Use “Other” to enter a value.</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Row 1 */}
        <div className="space-y-2">
          <Label>Business Name</Label>
          <Input {...register("business_name")} />
          {err("business_name") ? <p className="text-sm text-destructive">{err("business_name")}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Contact Name</Label>
          <Input {...register("name")} />
          {err("name") ? <p className="text-sm text-destructive">{err("name")}</p> : null}
        </div>

        {/* Row 2 */}
        <div className="space-y-2">
          <Label>Business Type</Label>
          <Controller
            control={control}
            name="business_type"
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(v) => field.onChange(v)}
                disabled={false}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="max-h-[300px] overflow-y-auto"
                >
                  {businessTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {err("business_type") ? <p className="text-sm text-destructive">{err("business_type")}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Industry</Label>
          <Controller
            control={control}
            name="industry"
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(v) => field.onChange(v)}
                disabled={false}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="max-h-[300px] overflow-y-auto"
                >
                  {industryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {err("industry") ? <p className="text-sm text-destructive">{err("industry")}</p> : null}
        </div>

        {/* Other inputs */}
        {watch('business_type') === OTHER ? (
          <div className="space-y-2">
            <Label>Other Business Type</Label>
            <Input {...register('custom_business_type')} />
            {err('custom_business_type') ? <p className="text-sm text-destructive">{err('custom_business_type')}</p> : null}
          </div>
        ) : (
          <div className="hidden md:block" />
        )}

        {watch('industry') === OTHER ? (
          <div className="space-y-2">
            <Label>Other Industry</Label>
            <Input {...register('custom_industry')} />
            {err('custom_industry') ? <p className="text-sm text-destructive">{err('custom_industry')}</p> : null}
          </div>
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Row 4 */}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register("email")} inputMode="email" />
          {err("email") ? <p className="text-sm text-destructive">{err("email")}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Location (City/State)</Label>
          <Input {...register("location")} placeholder="e.g. Mumbai, Maharashtra" />
        </div>

        {/* Row 5 */}
        {/* Row 5 */}
        <div className="space-y-2">
          <Label>Phone</Label>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <PhoneInput
                international
                defaultCountry="IN"
                value={field.value}
                onChange={(value) => field.onChange(value || "")}
                onBlur={field.onBlur}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              />
            )}
          />
          {err("phone") ? <p className="text-sm text-destructive">{err("phone")}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Controller
            control={control}
            name="whatsapp"
            render={({ field }) => (
              <PhoneInput
                international
                defaultCountry="IN"
                value={field.value}
                onChange={(value) => field.onChange(value || "")}
                onBlur={field.onBlur}
                disabled={whatsappSame}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Full Address (Bill To)</Label>
        <div className="relative">
          <textarea
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            )}
            {...register("address")}
            placeholder="Full legal address for invoicing..."
          />
        </div>
        <p className="text-[0.8rem] text-muted-foreground">Appears on invoices and receipts</p>
      </div>

      {/* WhatsApp same as phone */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={whatsappSame}
          onCheckedChange={(checked) => {
            const next = Boolean(checked);
            setValue("whatsapp_same_as_phone", next, { shouldDirty: true });
            if (next) {
              setValue("whatsapp", phone || "", { shouldValidate: true, shouldDirty: true });
            }
          }}
          id="wa_same"
        />
        <Label htmlFor="wa_same" className="text-sm text-muted-foreground">
          WhatsApp same as Phone
        </Label>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={!formState.isValid || formState.isSubmitting || !hasAnyChange}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
