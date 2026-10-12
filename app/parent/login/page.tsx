"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading";

const SITE_URL =
  process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAINS === "true"
    ? "https://al-hikmah.org"
    : "https://ahic.vercel.app";

const STAFF_LOGIN_URL =
  process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAINS === "true"
    ? "https://al-hikmah.org/login"
    : "https://ahic.vercel.app/login";

export default function ParentLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");
  const [error, setError] = useState(
    linkError === "link_expired"
      ? "Your setup link has expired or already been used. Please contact the school to request a new one."
      : "",
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || profile?.role !== "parent") {
        await supabase.auth.signOut();
        setError("Access denied. This portal is for parents only.");
        setLoading(false);
        return;
      }

      router.push("/parent/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header — matches the staff sign-in page */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Al Hikmah Institute Crawley
          </h1>
          <p className="text-muted-foreground">
            Islamic Educational Centre Management
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <h2 className="text-2xl font-bold text-center mb-6">Parent sign in</h2>

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
                placeholder="parent@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-10"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                href="/parent/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
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

          {/* Cross-links: staff sign-in + back to website */}
          <div className="mt-6 pt-6 border-t border-border space-y-3 text-center text-sm">
            <p className="text-muted-foreground">
              Staff member?{" "}
              <a
                href={STAFF_LOGIN_URL}
                className="font-medium text-primary hover:underline"
              >
                Go to staff sign-in
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

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} Al Hikmah Institute Crawley. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
