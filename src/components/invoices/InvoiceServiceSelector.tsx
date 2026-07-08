// import { useMemo, useState } from "react";

// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import type { QuotationServiceBlock } from "@/lib/quotationServiceBlocks";

// type Props = {
//     serviceBlocks: QuotationServiceBlock[];
//     selectedIds: string[];
//     onSelectionChange: (ids: string[]) => void;
// };

// export default function InvoiceServiceSelector({
//     serviceBlocks,
//     selectedIds,
//     onSelectionChange,
// }: Props) {
//     // const [selectedIds, setSelectedIds] = useState<string[]>([]);

//     const toggleService = (id: string) => {
//         setSelectedIds((prev) =>
//             prev.includes(id)
//                 ? prev.filter((x) => x !== id)
//                 : [...prev, id]
//         );
//     };



//     const selectedTotal = useMemo(() => {
//         return serviceBlocks
//             .filter((s) => selectedIds.includes(s.service_id))
//             .reduce((sum, s) => sum + Number(s.price || 0), 0);
//     }, [serviceBlocks, selectedIds]);

//     return (
//         <div className="space-y-5">

//             <div>
//                 <h2 className="text-xl font-semibold">
//                     Select Services
//                 </h2>

//                 <p className="text-sm text-muted-foreground mt-1">
//                     Choose the services that should be included in this invoice.
//                 </p>
//             </div>

//             <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-modern">

//                 {serviceBlocks.map((service) => {

//                     const selected =
//                         selectedIds.includes(service.service_id);

//                     return (
//                         <Card
//                             key={service.service_id}
//                             onClick={() => toggleService(service.service_id)}
//                             className={`cursor-pointer transition-all rounded-xl border-2
//               ${selected
//                                     ? "border-primary bg-primary/5"
//                                     : "border-border hover:border-primary/40"
//                                 }`}
//                         >
//                             <CardContent className="p-4 flex items-center justify-between">

//                                 <div>

//                                     <h3 className="font-semibold text-base">
//                                         {service.service_name}
//                                     </h3>

//                                     <p className="text-sm text-muted-foreground mt-1 capitalize">
//                                         Billing :
//                                         {" "}
//                                         {service.billing_type?.replace("_", " ")}
//                                     </p>

//                                     <p className="text-sm mt-1">
//                                         ₹{Number(service.price).toLocaleString()}
//                                     </p>

//                                 </div>

//                                 <Checkbox
//                                     checked={selected}
//                                 />

//                             </CardContent>
//                         </Card>
//                     );
//                 })}
//             </div>

//             <Card className="rounded-xl">
//                 <CardContent className="p-4 flex items-center justify-between">

//                     <div>

//                         <p className="text-sm text-muted-foreground">
//                             Selected Services
//                         </p>

//                         <p className="font-semibold">
//                             {selectedIds.length}
//                         </p>

//                     </div>

//                     <div className="text-right">

//                         <p className="text-sm text-muted-foreground">
//                             Total
//                         </p>

//                         <p className="font-bold text-lg">
//                             ₹{selectedTotal.toLocaleString()}
//                         </p>

//                     </div>

//                 </CardContent>
//             </Card>

//             {/*<div className="flex justify-end">

//                 <Button
//                     disabled={selectedIds.length === 0}
//                     onClick={() => onContinue(selectedIds)}
//                 >
//                     Continue
//                 </Button>

//             </div>*/}

//         </div>
//     );
// }


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

                    return (
                        <Card
                            key={service.service_id}
                            onClick={() => toggleService(service.service_id)}
                            className={`cursor-pointer transition-all rounded-xl border-2 ${selected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/40"
                                }`}
                        >
                            <CardContent className="p-4 flex items-center justify-between">

                                <div>

                                    <h3 className="font-semibold text-base">
                                        {service.service_name}
                                    </h3>

                                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                                        Billing : {service.billing_type?.replace("_", " ")}
                                    </p>

                                    <p className="text-sm mt-1">
                                        ₹{Number(service.price).toLocaleString()}
                                    </p>

                                </div>

                                <Checkbox checked={selected} />

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