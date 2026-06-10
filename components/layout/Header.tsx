"use client";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut,
  Bell,
  AlertCircle,
  CreditCard,
  TrendingDown,
  BookOpen,
  Award,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import GlobalSearch from "@/components/search/GlobalSearch";
import Link from "next/link";

interface HeaderProps {
  profile: {
    full_name: string;
    role: string;
  };
}

interface AlertItem {
  id: string;
  event_type: string;
  metadata: Record<string, any>;
  triggered_at: string;
  students: {
    first_name: string;
    last_name: string;
  };
}

const ALERT_ICONS: Record<string, any> = {
  attendance_low: AlertCircle,
  fee_overdue: CreditCard,
  fine_issued: AlertCircle,
  grade_low: TrendingDown,
  prayer_missing: BookOpen,
  certificate_ready: Award,
};

const ALERT_COLORS: Record<string, string> = {
  attendance_low: "text-red-500",
  fee_overdue: "text-orange-500",
  fine_issued: "text-red-500",
  grade_low: "text-yellow-500",
  prayer_missing: "text-blue-500",
  certificate_ready: "text-green-500",
};

const ALERT_LABELS: Record<string, string> = {
  attendance_low: "Low Attendance",
  fee_overdue: "Fee Overdue",
  fine_issued: "Fine Issued",
  grade_low: "Low Grade",
  prayer_missing: "Prayer Missing",
  certificate_ready: "Certificate Ready",
};

const getAlertSummary = (
  event_type: string,
  metadata: Record<string, any>,
): string => {
  switch (event_type) {
    case "attendance_low":
      return `${metadata.absences} absences in ${metadata.month}`;
    case "fee_overdue":
      return `£${Number(metadata.amount_due).toFixed(2)} overdue`;
    case "fine_issued":
      return `£${Number(metadata.amount).toFixed(2)} — ${metadata.reason}`;
    case "grade_low":
      return `${metadata.percentage}% in ${metadata.subject_name}`;
    case "prayer_missing":
      return "Prayer sheet not submitted";
    case "certificate_ready":
      return `${metadata.subject_name} — ${metadata.average_percentage}%`;
    default:
      return "Needs attention";
  }
};

export default function Header({ profile }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowAlerts(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAlerts = async () => {
    const { data, count } = await supabase
      .from("student_events")
      .select(
        `
        id, event_type, metadata, triggered_at,
        students ( first_name, last_name )
      `,
        { count: "exact" },
      )
      .eq("status", "active")
      .order("triggered_at", { ascending: false })
      .limit(5);

    setAlerts((data || []) as any);
    setAlertCount(count || 0);
  };

  const clearAllAlerts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("student_events")
      .update({
        status: "dismissed",
        actioned_at: new Date().toISOString(),
        actioned_by: user?.id,
      })
      .eq("status", "active");
    setAlerts([]);
    setAlertCount(0);
    setShowAlerts(false);
  };

  const dismissAlert = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("student_events")
      .update({
        status: "dismissed",
        actioned_at: new Date().toISOString(),
        actioned_by: user?.id,
      })
      .eq("id", id);
    fetchAlerts();
  };

  const getPageTitle = () => {
    const path = pathname.split("/")[1];
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      students: "Students",
      classes: "Classes",
      attendance: "Attendance",
      progress: "Quran Progress",
      reports: "Reports",
      settings: "Settings",
      alerts: "Alert Centre",
      "prayer-sheets": "Prayer Sheets",
      "curriculum-assessment": "Curriculum & Assessment",
      fees: "Fee Management",
      fines: "Fine Management",
      messages: "Messages",
      events: "Events",
      applications: "Applications",
    };
    return titles[path] || "Dashboard";
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Page Title */}
      <div>
        <h1 className="text-lg md:text-2xl font-bold text-foreground">
          {getPageTitle()}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <GlobalSearch />
        <ThemeToggle />

        {/* Alert Bell */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => {
              setShowAlerts(!showAlerts);
              fetchAlerts();
            }}
            className="p-2 rounded-lg hover:bg-accent relative"
            title="Alerts"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showAlerts && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-lg shadow-xl z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">
                  Alerts
                  {alertCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {alertCount}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-3">
                  {alertCount > 0 && (
                    <button
                      onClick={clearAllAlerts}
                      className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                  <Link
                    href="/alerts"
                    onClick={() => setShowAlerts(false)}
                    className="text-xs text-primary hover:underline"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              {/* Alert List */}
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No active alerts ✓
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const Icon = ALERT_ICONS[alert.event_type] || AlertCircle;
                    const color =
                      ALERT_COLORS[alert.event_type] || "text-gray-500";
                    return (
                      <div
                        key={alert.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 border-b border-border/50 last:border-0 cursor-pointer"
                        onClick={() => {
                          setShowAlerts(false);
                          router.push("/alerts");
                        }}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {alert.students?.first_name}{" "}
                            {alert.students?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ALERT_LABELS[alert.event_type]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getAlertSummary(alert.event_type, alert.metadata)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => dismissAlert(alert.id, e)}
                          className="text-muted-foreground hover:text-foreground text-xs shrink-0 mt-0.5"
                          title="Dismiss"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {alertCount > 5 && (
                <div className="px-4 py-2 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    +{alertCount - 5} more alerts
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">
            <span className="hidden sm:inline">
              {loading ? "Logging out..." : "Logout"}
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}
