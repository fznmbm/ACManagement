"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Users, Shield } from "lucide-react";

/**
 * Role-aware launcher for the installed app (PWA start_url).
 *   signed-in parent        -> /parent/dashboard
 *   signed-in admin/teacher -> /dashboard
 *   signed-out              -> a login chooser (never the public marketing site)
 */
export default function LaunchPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showChooser, setShowChooser] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setShowChooser(true);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const role = profile?.role;
        if (role === "parent") {
          router.replace("/parent/dashboard");
        } else if (
          role === "admin" ||
          role === "super_admin" ||
          role === "teacher"
        ) {
          router.replace("/dashboard");
        } else {
          setShowChooser(true);
        }
      } catch {
        setShowChooser(true);
      }
    })();
  }, [router, supabase]);

  if (!showChooser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/ahlogo_web_nobg.png"
          alt="Al Hikmah Institute"
          className="h-20 w-20 mx-auto mb-4 object-contain"
        />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Al Hikmah Institute Crawley
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-8">
          Choose how you want to sign in
        </p>

        <div className="space-y-3">
          <Link
            href="/parent/login"
            className="flex items-center gap-3 w-full rounded-xl bg-primary text-white px-5 py-4 font-semibold hover:opacity-90 transition-opacity"
          >
            <Users className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">Parent login</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-3 w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-5 py-4 font-semibold hover:border-primary transition-colors"
          >
            <Shield className="h-5 w-5 shrink-0 text-primary" />
            <span className="flex-1 text-left">Staff login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
