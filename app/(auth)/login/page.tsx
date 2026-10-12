// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/ui/loading";

const PARENT_LOGIN_URL =
  process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAINS === "true"
    ? "https://parent.al-hikmah.org/parent/login"
    : "https://ahic-parent.vercel.app/parent/login";

const SITE_URL =
  process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAINS === "true"
    ? "https://al-hikmah.org"
    : "https://ahic.vercel.app";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "parent") {
          router.push("/parent/dashboard");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Staff sign in</h2>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        <LoadingButton
          type="submit"
          isLoading={loading}
          loadingText="Signing in..."
          variant="primary"
          className="w-full"
        >
          Sign in
        </LoadingButton>
      </form>

      {/* Cross-links: parent sign-in + back to the website */}
      <div className="mt-6 pt-6 border-t border-border space-y-3 text-center text-sm">
        <p className="text-muted-foreground">
          Are you a parent?{" "}
          <a
            href={PARENT_LOGIN_URL}
            className="font-medium text-primary hover:underline"
          >
            Go to parent sign-in
          </a>
        </p>
        <a
          href={SITE_URL}
          className="inline-block text-muted-foreground hover:text-foreground"
        >
          ← Back to website
        </a>
      </div>
    </div>
  );
}
