import { NavLink } from "react-router-dom";

const linkBase = "text-sm font-medium px-3 py-2 rounded-xl";
const active = "bg-muted text-foreground";
const inactive = "text-muted-foreground hover:text-foreground hover:bg-muted/50";

export function SettingsTopMenu() {
  // Phase 3B: Settings are centralized. This menu is kept for backward compatibility but points to the new pages.
  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex items-center gap-1 rounded-2xl border border-border/50 bg-background/50 p-1">
        <NavLink
          to="/settings/business-profile"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Business Profile
        </NavLink>
        <NavLink
          to="/settings/client-options"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Client Fields
        </NavLink>
        <NavLink
          to="/settings/document-defaults"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Document Defaults
        </NavLink>
        <NavLink
          to="/settings/data"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Data
        </NavLink>
      </div>
    </div>
  );
}
