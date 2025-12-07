// components/layout/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/helpers";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Settings,
  GraduationCap,
  BookMarked,
  Coins,
  Receipt,
  FileText,
  MessageSquare,
  Calendar,
  Bell,
} from "lucide-react";

interface SidebarProps {
  profile: {
    full_name: string;
    role: string;
    email: string;
  };
}

export default function Sidebar({ profile }: SidebarProps) {
  const [centreName, setCentreName] = useState("Loading...");
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "admin", "teacher", "parent"],
    },
    {
      name: "Students",
      href: "/students",
      icon: Users,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      name: "Applications",
      href: "/applications",
      icon: FileText,
      roles: ["super_admin", "admin"],
    },
    {
      name: "Classes",
      href: "/classes",
      icon: BookOpen,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: ClipboardCheck,
      roles: ["super_admin", "admin", "teacher"],
      submenu: [
        // ADD THIS SUBMENU
        {
          name: "Mark Attendance",
          href: "/attendance",
        },
        {
          name: "History",
          href: "/attendance/history",
        },
      ],
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      name: "Events",
      href: "/events",
      icon: Calendar,
      roles: ["super_admin", "admin", "teacher", "parent"],
    },
    {
      name: "Alerts",
      href: "/alerts",
      icon: Bell,
      roles: ["super_admin", "admin"],
    },
    {
      name: "Curriculum & Assessment",
      href: "/curriculum-assessment",
      icon: BookOpen,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      name: "Fine Management",
      href: "/fines",
      icon: Coins,
      roles: ["admin", "super_admin"],
    },
    {
      name: "Fee Management",
      href: "/fees",
      icon: Receipt,
      roles: ["admin", "super_admin"],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["super_admin", "admin"],
    },
  ];

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(profile.role)
  );

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
        if (typeof settings === "string") {
          settings = JSON.parse(settings);
        }
        setCentreName(settings?.centre_name || "Madrasa System");
      }
    };

    fetchCentreName();
  }, []);

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-primary leading-tight">
              {centreName}
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 m-2">
        <ul className="space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold">
              {profile.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile.role.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
