"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ToastProvider } from "@/components/ui/toast";
import { useTheme } from "@/components/providers/ThemeProvider";
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

  // One theme system across the whole app — the shared provider from the root
  // layout. (Previously the parent portal ran its own `parent-theme` toggle
  // that the provider kept reverting, so the switch appeared dead.)
  const { actualTheme, setTheme, mounted } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [unreadEvents, setUnreadEvents] = useState(0);

  // Recount unread notices (non-event) and unread events for the bell/badges.
  const refreshCounts = async (uid: string) => {
    const { count } = await supabase
      .from("parent_notifications")
      .select("*", { count: "exact", head: true })
      .eq("parent_user_id", uid)
      .eq("is_read", false)
      .neq("type", "event");
    setUnreadTotal(count || 0);

    const { count: eventCount } = await supabase
      .from("parent_notifications")
      .select("*", { count: "exact", head: true })
      .eq("parent_user_id", uid)
      .eq("is_read", false)
      .eq("type", "event");
    setUnreadEvents(eventCount || 0);
  };

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
        setUserId(session.user.id);
        setLoading(false);

        await refreshCounts(session.user.id);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/parent/login");
      }
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase, pathname]);

  // Keep the bell/badges live: a new notice (INSERT) or a read/acknowledge
  // (UPDATE, including "mark all read" on the Updates page) refreshes the
  // count without needing a page reload or navigation.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("parent-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parent_notifications",
          filter: `parent_user_id=eq.${userId}`,
        },
        () => refreshCounts(userId),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggleTheme = () =>
    setTheme(actualTheme === "dark" ? "light" : "dark");

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
      badge: 0,
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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  Al Hikmah <span className="text-primary">Parent Portal</span>
                </h1>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                    {item.badge > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-destructive text-destructive-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>

              {/* Right Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Updates bell */}
                <Link
                  href="/parent/updates"
                  className="relative p-2 rounded-lg hover:bg-accent"
                  aria-label="Updates"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadTotal > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[1.05rem] h-[1.05rem] px-1 text-[10px] font-bold leading-none rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                      {unreadTotal > 9 ? "9+" : unreadTotal}
                    </span>
                  )}
                </Link>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
                  aria-label="Toggle light or dark mode"
                >
                  {!mounted ? (
                    <Moon className="h-5 w-5" />
                  ) : actualTheme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>

                {/* User Info */}
                <div className="hidden sm:flex items-center">
                  <div className="text-right mr-1">
                    <p className="text-sm font-medium text-foreground">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Parent</p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
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
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
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
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="leading-none">{item.name}</span>
                  {item.badge > 0 && (
                    <span className="absolute top-1 right-[calc(50%-1.25rem)] min-w-[1.1rem] px-1 py-0.5 text-[10px] font-bold leading-none rounded-full bg-destructive text-destructive-foreground text-center">
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
