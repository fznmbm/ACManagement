"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading";

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
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Check if user is a parent
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

      // Redirect to parent dashboard
      router.push("/parent/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Parent Portal
          </h1>
          <p className="text-muted-foreground">
            Al Hikmah Institute Crawley
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Welcome Back
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                  placeholder="parent@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/parent/forgot-password"
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText="Signing in..."
              variant="primary"
              size="lg"
              className="w-full"
            >
              Sign In
            </LoadingButton>
          </form>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              New to the portal?{" "}
              <span className="text-foreground font-medium">
                You should have received login credentials via email.
              </span>
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              If you haven't received your login details, please contact the
              school.
            </p>
          </div>
        </div>

        {/* Footer: staff sign-in + back to website */}
        <div className="mt-6 space-y-2 text-center text-sm">
          <p className="text-muted-foreground">
            Staff member?{" "}
            <a
              href={
                process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAINS === "true"
                  ? "https://al-hikmah.org/login"
                  : "https://ahic.vercel.app/login"
              }
              className="font-medium text-primary hover:underline"
            >
              Go to staff sign-in
            </a>
          </p>
          <Link
            href={
              process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAINS === "true"
                ? "https://al-hikmah.org"
                : "https://ahic.vercel.app"
            }
            className="inline-block text-muted-foreground hover:text-foreground"
          >
            ← Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
}
