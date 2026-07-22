import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, XCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
    // Postgres often returns naive timestamps with no timezone marker (e.g.
    // "2026-07-22 04:10:27.18287"). JS's Date parser then wrongly assumes
    // local time instead of UTC, causing a several-hour offset. Force UTC
    // interpretation by appending "Z" if no timezone info is already present.
    const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(dateStr);
    const isoSafe = hasTimezone ? dateStr : `${dateStr.replace(" ", "T")}Z`;

    const diffMs = Date.now() - new Date(isoSafe).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return new Date(isoSafe).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
export function NotificationBell() {
    const { notifications, refreshNotifications, markNotificationAsRead } = useApp();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Light polling so new notifications show up without a manual refresh.
    // Background polling — checks for new notifications every 8s so the bell
    // updates on its own without the user ever pressing refresh.
    useEffect(() => {
        const interval = setInterval(() => {
            refreshNotifications().catch(() => { });
        }, 8000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Also refresh immediately whenever the tab regains focus/visibility —
    // covers the common case of switching away, client accepting, then
    // coming back to this tab.
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                refreshNotifications().catch(() => { });
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("focus", handleVisibility);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("focus", handleVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNotificationClick = async (id: string, quotationId: string, isRead: boolean) => {
        if (!isRead) {
            await markNotificationAsRead(id);
        }
        setOpen(false);
        navigate(`/quotations/${quotationId}/preview`);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted/60 transition-colors duration-200"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-foreground" strokeWidth={2} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[360px] max-h-[480px] rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <p className="font-heading font-bold text-sm text-foreground">Notifications</p>
                        {unreadCount > 0 && (
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>

                    <div className="overflow-y-auto scrollbar-modern" style={{ maxHeight: 420 }}>
                        {notifications.length === 0 ? (
                            <div className="py-14 text-center">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" strokeWidth={1.5} />
                                <p className="text-sm text-muted-foreground">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => handleNotificationClick(n.id, n.quotation_id, n.is_read)}
                                    className={cn(
                                        "w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-border/40 last:border-b-0 transition-colors duration-150 hover:bg-muted/40",
                                        !n.is_read && "bg-accent/5"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5",
                                            n.type === "accepted" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                        )}
                                    >
                                        {n.type === "accepted" ? (
                                            <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
                                        ) : (
                                            <XCircle className="w-4 h-4" strokeWidth={2.2} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo(n.created_at)}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}