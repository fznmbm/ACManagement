"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ToastProvider } from "@/components/ui/toast";
import Link from "next/link";
import {
  Home,
  User,
  LogOut,
  Bell,
  Sun,
  Moon,
  Users,
  CreditCard,
  Calendar,
} from "lucide-react";

interface ParentLayoutProps {
  children: React.ReactNode;
}

export default function ParentLayout({ children }: ParentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [unreadEvents, setUnreadEvents] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      // Skip auth check for set-password page
      if (pathname === "/set-password") {
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          router.push("/parent/login");
          return;
        }

        // Check if user is a parent
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profile || profile.role !== "parent") {
          await supabase.auth.signOut();
          router.push("/parent/login");
          return;
        }

        setUser(profile);
        setLoading(false);

        const { count } = await supabase
          .from("parent_notifications")
          .select("*", { count: "exact", head: true })
          .eq("parent_user_id", session.user.id)
          .eq("is_read", false)
          .neq("type", "event");
        setUnreadTotal(count || 0);

        const { count: eventCount } = await supabase
          .from("parent_notifications")
          .select("*", { count: "exact", head: true })
          .eq("parent_user_id", session.user.id)
          .eq("is_read", false)
          .eq("type", "event");
        setUnreadEvents(eventCount || 0);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/parent/login");
      }
    };

    checkUser();

    // // Check theme
    // const savedTheme = localStorage.getItem("parent-theme") as
    //   | "light"
    //   | "dark"
    //   | null;
    // if (savedTheme) {
    //   setTheme(savedTheme);
    //   document.documentElement.classList.toggle("dark", savedTheme === "dark");
    // }

    // Check theme
    const savedTheme = localStorage.getItem("parent-theme") as
      | "light"
      | "dark"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [router, supabase, pathname]);

  // const toggleTheme = () => {
  //   const newTheme = theme === "light" ? "dark" : "light";
  //   setTheme(newTheme);
  //   localStorage.setItem("parent-theme", newTheme);
  //   document.documentElement.classList.toggle("dark", newTheme === "dark");
  // };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("parent-theme", newTheme);

    // Explicitly add/remove dark class
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/parent/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/parent/dashboard", icon: Home, badge: 0 },
    {
      name: "My Children",
      href: "/parent/children",
      icon: Users,
      badge: unreadTotal,
    },
    {
      name: "Events",
      href: "/parent/events",
      icon: Calendar,
      badge: unreadEvents,
    },
    { name: "Finances", href: "/parent/finances", icon: CreditCard, badge: 0 },
    { name: "Profile", href: "/parent/profile", icon: User, badge: 0 },
  ];

  const isActive = (href: string) => pathname === href;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Al Hikmah <span className="text-primary">Parent Portal</span>
                </h1>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                      isActive(item.href)
                        ? "bg-primary text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                    {item.badge > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>

              {/* Right Actions */}
              <div className="flex items-center space-x-3">
                {/* Updates bell */}
                <Link
                  href="/parent/updates"
                  className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Updates"
                >
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  {unreadTotal > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[1.05rem] h-[1.05rem] px-1 text-[10px] font-bold leading-none rounded-full bg-red-500 text-white flex items-center justify-center">
                      {unreadTotal > 9 ? "9+" : unreadTotal}
                    </span>
                  )}
                </Link>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {/* User Info */}
                <div className="hidden sm:flex items-center">
                  <div className="text-right mr-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Parent
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                    active
                      ? "text-primary"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="leading-none">{item.name}</span>
                  {item.badge > 0 && (
                    <span className="absolute top-1 right-[calc(50%-1.25rem)] min-w-[1.1rem] px-1 py-0.5 text-[10px] font-bold leading-none rounded-full bg-red-500 text-white text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ToastProvider>
  );
}
