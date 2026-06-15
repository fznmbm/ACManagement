"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading";

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  useEffect(() => {
    // Listen for auth state change FIRST before checking session
    // This handles the case where the token arrives via hash/code
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "Auth state:",
        event,
        session ? "session present" : "no session",
      );
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        setError("");
      }
    });

    const initializeAuth = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      // Check for errors first
      if (hash.includes("error=") || search.includes("error=")) {
        const params = new URLSearchParams(
          hash.substring(1) || search.substring(1),
        );
        const errorCode = params.get("error_code");
        const errorDesc = params.get("error_description");

        if (errorCode === "otp_expired") {
          setError(
            "This link has expired. Please request a new password reset.",
          );
        } else {
          setError(
            errorDesc || "An error occurred. Please request a new link.",
          );
        }
        return;
      }

      // If there's a code in the URL, exchange it for a session
      if (search.includes("code=")) {
        const code = new URLSearchParams(search).get("code");
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(
              "Link has expired or already been used. Please request a new one.",
            );
          }
          // Session will be set via onAuthStateChange above
          return;
        }
      }

      // Handle old hash-based tokens
      if (hash.includes("access_token")) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: new URLSearchParams(hash.substring(1)).get(
            "access_token",
          )!,
          refresh_token: new URLSearchParams(hash.substring(1)).get(
            "refresh_token",
          )!,
        });
        if (sessionError) {
          setError("Failed to establish session. Please try the link again.");
        }
        return;
      }

      // No token in URL — check if session already exists
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Don't show error immediately — wait 2 seconds for auth state change
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const {
          data: { session: retrySession },
        } = await supabase.auth.getSession();
        if (!retrySession) {
          setError("Auth session missing! Please click the magic link again.");
        }
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    });
  }, [password]);

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Get role before signing out
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      let redirectPath = "/login"; // default: admin

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (profile?.role === "parent") {
          redirectPath = "/parent/login";
          // Mark password as set — reliable indicator parent completed setup
          await supabase
            .from("profiles")
            .update({ password_set: true })
            .eq("id", currentUser.id);
        }
      }

      setSuccess(true);
      await supabase.auth.signOut();

      setTimeout(() => {
        window.location.href = redirectPath;
      }, 2000);
    } catch (err) {
      console.error("Set password error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Password Set Successfully!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Set Your Password
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create a secure password for your account
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSetPassword} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password must contain:
              </p>
              <ul className="space-y-1">
                <li
                  className={`text-xs flex items-center ${
                    passwordStrength.length
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <span className="mr-2">
                    {passwordStrength.length ? "✓" : "○"}
                  </span>
                  At least 8 characters
                </li>
                <li
                  className={`text-xs flex items-center ${
                    passwordStrength.uppercase
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <span className="mr-2">
                    {passwordStrength.uppercase ? "✓" : "○"}
                  </span>
                  One uppercase letter
                </li>
                <li
                  className={`text-xs flex items-center ${
                    passwordStrength.lowercase
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <span className="mr-2">
                    {passwordStrength.lowercase ? "✓" : "○"}
                  </span>
                  One lowercase letter
                </li>
                <li
                  className={`text-xs flex items-center ${
                    passwordStrength.number
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <span className="mr-2">
                    {passwordStrength.number ? "✓" : "○"}
                  </span>
                  One number
                </li>
              </ul>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* <button
              type="submit"
              disabled={
                loading || !isPasswordValid || !password || !confirmPassword
              }
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting password..." : "Set Password & Continue"}
            </button> */}
            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText="Setting password..."
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!isPasswordValid || !password || !confirmPassword}
            >
              Set Password & Continue
            </LoadingButton>
          </form>
        </div>
      </div>
    </div>
  );
}
