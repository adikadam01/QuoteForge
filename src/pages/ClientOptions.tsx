import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import type { ClientOptions } from "@/lib/types";

function normalizeList(items: string[]) {
  return Array.from(new Set(items.map((s) => s.trim()).filter(Boolean)));
}

function ListEditor(props: {
  title: string;
  description: string;
  items: string[];
  onChangeItems: (next: string[]) => void;
  addLabel: string;
  newValue: string;
  onChangeNewValue: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base">{props.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{props.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>{props.addLabel}</Label>
          <div className="flex gap-2">
            <Input
              value={props.newValue}
              onChange={(e) => props.onChangeNewValue(e.target.value)}
              className="rounded-xl"
            />
            <Button type="button" onClick={props.onAdd} disabled={!props.newValue.trim()} className="rounded-xl">
              Add
            </Button>
          </div>
        </div>

        {props.items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {props.items.map((t) => (
              <Button
                key={t}
                type="button"
                variant="secondary"
                className="rounded-xl h-8 px-3"
                onClick={() => {
                  if (t.trim() === "Other") return;
                  props.onChangeItems(props.items.filter((x) => x !== t));
                }}
                disabled={t.trim() === "Other"}
              >
                {t} <span className="ml-2 text-xs text-muted-foreground">×</span>
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No values yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientOptionsPage() {
  const { clientOptions, setClientOptions } = useApp();
  const { toast } = useToast();

  const [businessTypes, setBusinessTypes] = useState<string[]>(clientOptions.businessTypes);
  const [industries, setIndustries] = useState<string[]>(clientOptions.industries);

  const [newBusinessType, setNewBusinessType] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  useEffect(() => {
    setBusinessTypes(clientOptions.businessTypes);
    setIndustries(clientOptions.industries);
  }, [clientOptions.businessTypes, clientOptions.industries]);

  const onAddBusinessType = () => {
    const next = normalizeList([...businessTypes, newBusinessType]);
    setBusinessTypes(next);
    setNewBusinessType("");
  };

  const onAddIndustry = () => {
    const next = normalizeList([...industries, newIndustry]);
    setIndustries(next);
    setNewIndustry("");
  };

  const save = async () => {
    const next: ClientOptions = {
      businessTypes,
      industries,
    };
    await setClientOptions(next);
    toast({ title: "Saved", description: "Client fields updated." });
  };

  const hasChanges = useMemo(() => {
    const a = JSON.stringify(normalizeList(clientOptions.businessTypes));
    const b = JSON.stringify(normalizeList(businessTypes));
    const c = JSON.stringify(normalizeList(clientOptions.industries));
    const d = JSON.stringify(normalizeList(industries));
    return a !== b || c !== d;
  }, [businessTypes, clientOptions.businessTypes, clientOptions.industries, industries]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Client Fields</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage dropdown values used when creating/editing clients.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListEditor
          title="Business types"
          description="Shown in the Client form as Business Type."
          items={businessTypes}
          onChangeItems={setBusinessTypes}
          addLabel="Add business type"
          newValue={newBusinessType}
          onChangeNewValue={setNewBusinessType}
          onAdd={onAddBusinessType}
        />

        <ListEditor
          title="Industries"
          description="Shown in the Client form as Industry."
          items={industries}
          onChangeItems={setIndustries}
          addLabel="Add industry"
          newValue={newIndustry}
          onChangeNewValue={setNewIndustry}
          onAdd={onAddIndustry}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={!hasChanges} className="rounded-xl">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
