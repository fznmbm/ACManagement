// components/layout/Header.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Bell } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  profile: {
    full_name: string;
    role: string;
  };
}

export default function Header({ profile }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Get page title from pathname
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
        <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications (placeholder for future) */}
        <button
          className="p-2 rounded-lg hover:bg-accent relative"
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {/* Notification badge */}
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">
            {loading ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </header>
  );
}
