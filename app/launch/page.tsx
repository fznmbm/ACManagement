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
    let done = false;

    const routeFor = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      const role = profile?.role;
      if (role === "parent") {
        done = true;
        router.replace("/parent/dashboard");
      } else if (role === "admin" || role === "super_admin" || role === "teacher") {
        done = true;
        router.replace("/dashboard");
      }
      return done;
    };

    const check = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) return routeFor(session.user.id);
      } catch {
        /* fall through */
      }
      return false;
    };

    // Catch a session that hydrates a beat late (common in an installed PWA)
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!done && session?.user) routeFor(session.user.id);
    });

    (async () => {
      if (await check()) return;
      // one short retry before falling back to the sign-in chooser
      setTimeout(async () => {
        if (done) return;
        if (!(await check()) && !done) setShowChooser(true);
      }, 700);
    })();

    return () => sub.subscription.unsubscribe();
  }, [router, supabase]);

  if (!showChooser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/ahlogo_web_nobg.png"
          alt="Al Hikmah Institute"
          className="h-20 w-20 mx-auto mb-4 object-contain"
        />
        <h1 className="text-xl font-bold text-foreground">
          Al Hikmah Institute Crawley
        </h1>
        <p className="text-sm text-muted-foreground mt-1 mb-8">
          Choose how you want to sign in
        </p>

        <div className="space-y-3">
          <Link
            href="/parent/login"
            className="flex items-center gap-3 w-full rounded-xl bg-primary text-primary-foreground px-5 py-4 font-semibold hover:bg-primary/90 transition-colors"
          >
            <Users className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">Parent login</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-3 w-full rounded-xl bg-card border border-border text-foreground px-5 py-4 font-semibold hover:border-primary transition-colors"
          >
            <Shield className="h-5 w-5 shrink-0 text-primary" />
            <span className="flex-1 text-left">Staff login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
