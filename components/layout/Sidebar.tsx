// components/layout/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/helpers";
import {
  LayoutDashboard,
  Users,
  Link as LinkIcon,
  FileText,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  BookMarked,
  MessageSquare,
  Calendar,
  Bell,
  Receipt,
  BarChart3,
  Shield,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  profile: {
    full_name: string;
    role: string;
    email: string;
  };
}

type Role = "super_admin" | "admin" | "teacher" | "parent";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ALL: Role[] = ["super_admin", "admin", "teacher"];

// Grouped navigation — the 15 flat items organised into 6 sections.
// Every destination is a direct link, so all of them are reachable on mobile
// (the old sidebar hid Link Parents / Add Student / History behind desktop-only
// submenus).
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Home",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["super_admin", "admin", "teacher", "parent"],
      },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Students", href: "/students", icon: Users, roles: ALL },
      {
        name: "Link Parents",
        href: "/students/link-parents",
        icon: LinkIcon,
        roles: ["super_admin", "admin", "teacher"],
      },
      {
        name: "Applications",
        href: "/applications",
        icon: FileText,
        roles: ["super_admin", "admin"],
      },
    ],
  },
  {
    label: "Teaching",
    items: [
      { name: "Classes", href: "/classes", icon: BookOpen, roles: ALL },
      {
        name: "Attendance",
        href: "/attendance",
        icon: ClipboardCheck,
        roles: ALL,
      },
      {
        name: "Learning",
        href: "/curriculum-assessment",
        icon: GraduationCap,
        roles: ALL,
      },
      {
        name: "Prayer Sheets",
        href: "/prayer-sheets",
        icon: BookMarked,
        roles: ALL,
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        name: "Send Update",
        href: "/send-update",
        icon: MessageSquare,
        roles: ALL,
      },
      {
        name: "Events",
        href: "/events",
        icon: Calendar,
        roles: ["super_admin", "admin", "teacher", "parent"],
      },
      { name: "Alert Centre", href: "/alerts", icon: Bell, roles: ALL },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        name: "Finance",
        href: "/fees",
        icon: Receipt,
        roles: ["super_admin", "admin"],
      },
    ],
  },
  {
    label: "Admin",
    items: [
      { name: "Reports", href: "/reports", icon: BarChart3, roles: ALL },
      {
        name: "Users",
        href: "/users",
        icon: Shield,
        roles: ["super_admin"],
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["super_admin", "admin"],
      },
    ],
  },
];

export default function Sidebar({ profile }: SidebarProps) {
  const [centreName, setCentreName] = useState("Loading...");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Groups filtered to the current role (and empty groups removed).
  const role = profile.role as Role;
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);

  useEffect(() => {
    const fetchCentreName = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "centre_info")
        .maybeSingle();

      if (data?.setting_value) {
        let settings = data.setting_value;
        if (typeof settings === "string") settings = JSON.parse(settings);
        setCentreName(settings?.centre_name || "Madrasa System");
      } else {
        setCentreName("Madrasa System");
      }
    };
    fetchCentreName();
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Longest-match-wins: only the most specific matching item is active, so
  // visiting /attendance/history highlights "Attendance History" alone, not
  // "Attendance" as well.
  const bestMatch = (() => {
    let best = "";
    for (const g of NAV_GROUPS) {
      for (const i of g.items) {
        const h = i.href;
        if (
          (pathname === h || pathname.startsWith(h + "/")) &&
          h.length > best.length
        ) {
          best = h;
        }
      }
    }
    return best;
  })();

  const isActive = (href: string) =>
    href === bestMatch ||
    // Finance is one entry (/fees) but also owns the Fines sub-page
    (href === "/fees" && pathname.startsWith("/fines"));

  const NavBody = (
    <>
      {/* Logo */}
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="min-w-0 flex-1 truncate text-base font-bold leading-tight text-primary">
            {centreName}
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-primary before:content-['']"
                          : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-semibold text-primary">
              {profile.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {profile.role.replace("_", " ")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        {NavBody}
      </aside>

      {/* Mobile hamburger (sits in the header's top-left gutter) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed left-0 top-0 z-40 flex h-16 w-16 items-center justify-center text-foreground md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-2 top-4 z-10 rounded-lg p-2 text-muted-foreground hover:bg-accent"
        >
          <X className="h-5 w-5" />
        </button>
        {NavBody}
      </aside>
    </>
  );
}
