"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Home,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Users,
  CreditCard,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // useEffect(() => {
  //   const checkUser = async () => {
  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();

  //     if (!session) {
  //       router.push("/parent/login");
  //       return;
  //     }

  //     // Check if user is a parent
  //     const { data: profile } = await supabase
  //       .from("profiles")
  //       .select("*")
  //       .eq("id", session.user.id)
  //       .single();

  //     if (!profile || profile.role !== "parent") {
  //       await supabase.auth.signOut();
  //       router.push("/parent/login");
  //       return;
  //     }

  //     setUser(profile);
  //     setLoading(false);
  //   };

  //   checkUser();

  //   // Check theme
  //   const savedTheme = localStorage.getItem("parent-theme") as
  //     | "light"
  //     | "dark"
  //     | null;
  //   if (savedTheme) {
  //     setTheme(savedTheme);
  //     document.documentElement.classList.toggle("dark", savedTheme === "dark");
  //   }
  // }, []);

  useEffect(() => {
    const checkUser = async () => {
      // Skip auth check for set-password page
      if (pathname === "/parent/set-password") {
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
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/parent/login");
      }
    };

    checkUser();

    // Check theme
    const savedTheme = localStorage.getItem("parent-theme") as
      | "light"
      | "dark"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, [router, supabase, pathname]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("parent-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/parent/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/parent/dashboard", icon: Home },
    { name: "My Children", href: "/parent/children", icon: Users },
    { name: "Finances", href: "/parent/finances", icon: CreditCard },
    { name: "Applications", href: "/parent/applications", icon: FileText },
    { name: "Profile", href: "/parent/profile", icon: User },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Menu className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                )}
              </button>
              <h1 className="ml-3 md:ml-0 text-xl font-bold text-slate-900 dark:text-white">
                Al Hikma <span className="text-primary">Parent Portal</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <nav className="px-4 py-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-12">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} Al Hikma Institute Crawley. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
