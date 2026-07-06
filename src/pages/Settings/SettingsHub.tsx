import React from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";

import DataSettings from "@/pages/DataSettings";
import ClientOptionsPage from "@/pages/ClientOptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BusinessProfileSettingsPage } from "@/pages/Settings/pages/BusinessProfileSettingsPage";
import { ServiceOptionsSettingsPage } from "@/pages/Settings/pages/ServiceOptionsSettingsPage";
import { DocumentDefaultsSettingsPage } from "@/pages/Settings/pages/DocumentDefaultsSettingsPage";

const tabBase = "text-sm font-medium px-3 py-2 rounded-xl";
const active = "bg-muted text-foreground";
const inactive = "text-muted-foreground hover:text-foreground hover:bg-muted/50";

function SettingsShell(props: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
        {props.description ? <p className="text-muted-foreground mt-1">{props.description}</p> : null}
      </div>

      <div className="w-full overflow-x-auto">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-border/50 bg-background/50 p-1">
          <NavLink to="/settings/business-profile" className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            Business Profile
          </NavLink>
          <NavLink to="/settings/client-options" className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            Client Options
          </NavLink>
          <NavLink to="/settings/service-options" className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            Service Options
          </NavLink>
          <NavLink to="/settings/document-defaults" className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            Document Defaults
          </NavLink>
          <NavLink to="/settings/data" className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            Data
          </NavLink>
        </div>
      </div>

      {props.children}
    </div>
  );
}

function SettingsDataPage() {
  return (
    <SettingsShell title="Settings" description="Local backups and demo data">
      <div className="max-w-4xl">
        <DataSettings />
      </div>
    </SettingsShell>
  );
}

function ClientOptionsSettingsRoute() {
  return (
    <SettingsShell title="Settings" description="Client Options">
      <div className="max-w-5xl">
        <ClientOptionsPage />
      </div>
    </SettingsShell>
  );
}

export default function SettingsHub() {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route index element={<Navigate to="/settings/business-profile" replace />} />

      <Route
        path="business-profile"
        element={
          <SettingsShell title="Settings" description="Business Profile">
            <div className="max-w-5xl">
              <BusinessProfileSettingsPage />
            </div>
          </SettingsShell>
        }
      />

      <Route path="client-options" element={<ClientOptionsSettingsRoute />} />

      <Route
        path="service-options"
        element={
          <SettingsShell title="Settings" description="Service Options">
            <div className="max-w-5xl">
              <ServiceOptionsSettingsPage />
            </div>
          </SettingsShell>
        }
      />

      <Route
        path="document-defaults"
        element={
          <SettingsShell title="Settings" description="Document Defaults">
            <div className="max-w-5xl">
              <DocumentDefaultsSettingsPage />
            </div>
          </SettingsShell>
        }
      />

      <Route path="data" element={<SettingsDataPage />} />

      {/* Legacy routes kept working via redirects */}
      <Route path="business" element={<Navigate to="/settings/business-profile" replace />} />
      <Route path="brand-kit" element={<Navigate to="/settings/business-profile" replace />} />
      <Route path="client-fields" element={<Navigate to="/settings/client-options" replace />} />
      <Route path="quotation-templates" element={<Navigate to="/settings/document-defaults" replace />} />
    </Routes>
  );
}

export function SettingsPlaceholderCard(props: { title: string; description: string }) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading">{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{props.description}</CardContent>
    </Card>
  );
}
