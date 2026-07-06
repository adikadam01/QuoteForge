import { useCallback, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import ClientForm, { type ClientFormSubmitPayload } from "@/components/clients/ClientForm";
import { useClientOptions } from "@/components/clients/useClientOptions";

export type AddClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (clientId: string) => void;
};

export default function AddClientDialog({ open, onOpenChange, onClientCreated }: AddClientDialogProps) {
  const { toast } = useToast();
  const { addClient, clients } = useApp();
  const options = useClientOptions();

  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(
    async (payload: ClientFormSubmitPayload) => {
      const emailLower = payload.email.trim().toLowerCase();
      const existing = emailLower ? clients.find((c) => (c.email || "").toLowerCase() === emailLower) : undefined;
      if (existing) {
        toast({
          title: "Duplicate email",
          description: "A client with this email already exists.",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);
      try {
        const newId = await addClient({
          name: payload.name,
          email: payload.email,
          business_name: payload.business_name,
          // keep legacy field stable
          size: "small",
          business_type: payload.business_type,
          custom_business_type: payload.custom_business_type,
          industry: payload.industry,
          custom_industry: payload.custom_industry,
          phone: payload.phone,
          whatsapp: payload.whatsapp,
          location: payload.location,
          notes: null,
        });

        if (!newId) throw new Error("Client id missing");

        toast({ title: "Client created", description: "Client has been added successfully." });
        onOpenChange(false);
        onClientCreated(newId);
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
        toast({ title: "Error", description: "Failed to create client", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [addClient, clients, onClientCreated, onOpenChange, toast],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Create a new client.</DialogDescription>
        </DialogHeader>

        <ClientForm
          options={options}
          submitLabel={saving ? "Saving…" : "Create Client"}
          onCancel={() => onOpenChange(false)}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
