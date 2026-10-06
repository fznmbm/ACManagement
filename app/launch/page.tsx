"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Role-aware launcher for the installed app (PWA start_url).
 *   parent        -> /parent/dashboard
 *   admin/teacher -> /dashboard
 *   not signed in -> /home
 */
export default function LaunchPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/home");
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
          router.replace("/home");
        }
      } catch {
        router.replace("/home");
      }
    })();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );
}
