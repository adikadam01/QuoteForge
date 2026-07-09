

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import type { QuotationServiceBlock } from "@/lib/quotationServiceBlocks";

type Props = {
    serviceBlocks: QuotationServiceBlock[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
};

export default function InvoiceServiceSelector({
    serviceBlocks,
    selectedIds,
    onSelectionChange,
}: Props) {

    const toggleService = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter((x) => x !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const selectedTotal = useMemo(() => {
        return serviceBlocks
            .filter((s) => selectedIds.includes(s.service_id))
            .reduce((sum, s) => sum + Number(s.price || 0), 0);
    }, [serviceBlocks, selectedIds]);

    return (
        <div className="space-y-5">

            <div>
                <h2 className="text-xl font-semibold">
                    Select Services
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                    Choose the services that should be included in this invoice.
                </p>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-modern">

                {serviceBlocks.map((service) => {

                    const selected = selectedIds.includes(service.service_id);

                    const completed =
                        service.invoice_progress?.completed ?? false;

                    const disabled = completed;

                    return (
                        <Card
                            key={service.service_id}
                            onClick={() => {
                                if (!disabled) {
                                    toggleService(service.service_id);
                                }
                            }}
                            className={`transition-all rounded-xl border-2 ${disabled
                                ? "opacity-50 cursor-not-allowed border-muted bg-muted/20"
                                : selected
                                    ? "cursor-pointer border-primary bg-primary/5"
                                    : "cursor-pointer border-border hover:border-primary/40"
                                }`}
                        >
                            <CardContent className="p-4 flex items-center justify-between">

                                <div>

                                    <div className="flex items-center gap-2">

                                        <h3 className="font-semibold text-base">
                                            {service.service_name}
                                        </h3>

                                        {completed && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                Completed
                                            </span>
                                        )}

                                    </div>

                                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                                        Billing : {service.billing_type?.replace("_", " ")}
                                    </p>

                                    <p className="text-sm mt-1">
                                        ₹{Number(service.price).toLocaleString()}
                                    </p>

                                </div>

                                <Checkbox
                                    checked={selected}
                                    disabled={disabled}
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card className="rounded-xl">
                <CardContent className="p-4 flex items-center justify-between">

                    <div>
                        <p className="text-sm text-muted-foreground">
                            Selected Services
                        </p>

                        <p className="font-semibold">
                            {selectedIds.length}
                        </p>
                    </div>

                    <div className="text-right">

                        <p className="text-sm text-muted-foreground">
                            Total
                        </p>

                        <p className="font-bold text-lg">
                            ₹{selectedTotal.toLocaleString()}
                        </p>

                    </div>

                </CardContent>
            </Card>

        </div>
    );
}