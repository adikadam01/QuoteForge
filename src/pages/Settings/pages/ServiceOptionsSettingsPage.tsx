import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";

const DEFAULT_CATEGORY_SUBCATEGORY: Record<string, string[]> = {
  Designing: ["Logo Design", "Poster Design", "Branding", "UI/UX Design"],
  Marketing: ["Social Media Marketing", "Performance Ads", "SEO", "Influencer Marketing"],
  Development: ["Website Development", "Web App", "Mobile App"],
  "Video & Production": ["Video Editing", "Shoot & Production", "Motion Graphics"],
};

export function ServiceOptionsSettingsPage() {
  const { serviceOptions, setServiceOptions } = useApp();
  const [local, setLocal] = React.useState(serviceOptions);
  const [newCategory, setNewCategory] = React.useState("");
  const [newSubcategory, setNewSubcategory] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setLocal(serviceOptions);
  }, [serviceOptions]);

  const categoryMap = (local.service_categories && Object.keys(local.service_categories).length > 0)
    ? local.service_categories
    : DEFAULT_CATEGORY_SUBCATEGORY;

  const save = async () => {
    // Persist only the category map (and any other future fields) via serviceOptions.
    await setServiceOptions({
      ...local,
      service_categories: categoryMap,
    });
  };

  const addMainCategory = () => {
    const key = newCategory.trim();
    if (!key) return;
    if (categoryMap[key]) return;

    setLocal((prev) => ({
      ...prev,
      service_categories: {
        ...(prev.service_categories || categoryMap),
        [key]: [],
      },
    }));
    setNewCategory("");
  };

  const removeMainCategory = (key: string) => {
    const next = { ...(categoryMap || {}) };
    delete next[key];
    setLocal((prev) => ({ ...prev, service_categories: next }));
  };

  const addSubcategory = (key: string) => {
    const raw = (newSubcategory[key] || "").trim();
    if (!raw) return;
    const nextSubs = Array.from(new Set([...(categoryMap[key] || []), raw]));

    setLocal((prev) => ({
      ...prev,
      service_categories: {
        ...(prev.service_categories || categoryMap),
        [key]: nextSubs,
      },
    }));
    setNewSubcategory((prev) => ({ ...prev, [key]: "" }));
  };

  const removeSubcategory = (key: string, sub: string) => {
    const nextSubs = (categoryMap[key] || []).filter((s) => s !== sub);
    setLocal((prev) => ({
      ...prev,
      service_categories: {
        ...(prev.service_categories || categoryMap),
        [key]: nextSubs,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">Service Options</CardTitle>
          <p className="text-sm text-muted-foreground">Manage category/sub-category dropdown options for Services.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Main category</Label>
            <div className="flex gap-2">
              <Input
                className="rounded-xl"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add new main category"
              />
              <Button className="rounded-xl" type="button" onClick={addMainCategory}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(categoryMap).map(([cat, subs]) => (
              <div key={cat} className="rounded-xl border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{cat}</div>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => removeMainCategory(cat)}>
                    Remove
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Sub-categories</Label>
                  <div className="flex gap-2">
                    <Input
                      className="rounded-xl"
                      value={newSubcategory[cat] || ""}
                      onChange={(e) => setNewSubcategory((prev) => ({ ...prev, [cat]: e.target.value }))}
                      placeholder={`Add sub-category for ${cat}`}
                    />
                    <Button className="rounded-xl" type="button" onClick={() => addSubcategory(cat)}>
                      Add
                    </Button>
                  </div>

                  {subs.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {subs.map((s) => (
                        <Button
                          key={s}
                          type="button"
                          variant="secondary"
                          className="rounded-xl h-8 px-3"
                          onClick={() => removeSubcategory(cat, s)}
                        >
                          {s} <span className="ml-2 text-xs text-muted-foreground">×</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No sub-categories.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button className="rounded-xl" onClick={() => void save()}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
