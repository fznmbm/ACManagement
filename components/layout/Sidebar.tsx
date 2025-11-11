// components/layout/Sidebar.tsx
"use client";

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
} from "lucide-react";

interface SidebarProps {
  profile: {
    full_name: string;
    role: string;
    email: string;
  };
}

export default function Sidebar({ profile }: SidebarProps) {
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

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">Madrasa</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
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
