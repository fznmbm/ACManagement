"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
}

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Scroll to top to show message
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/parent/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      // setMessage({
      //   type: "success",
      //   text: "Profile updated successfully!",
      // });
      showMessage("success", "Profile updated successfully!");

      // Refresh profile
      await fetchProfile();
    } catch (err: any) {
      // setMessage({
      //   type: "error",
      //   text: err.message || "Failed to update profile",
      // });
      showMessage("error", err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Validation
    if (newPassword !== confirmPassword) {
      // setMessage({
      //   type: "error",
      //   text: "New passwords do not match",
      // });

      showMessage("error", "New passwords do not match");
      setSaving(false);
      return;
    }

    if (newPassword.length < 8) {
      // setMessage({
      //   type: "error",
      //   text: "Password must be at least 8 characters long",
      // });
      showMessage("error", "Password must be at least 8 characters long");
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // setMessage({
      //   type: "success",
      //   text: "Password changed successfully!",
      // });
      showMessage("success", "Password changed successfully!");

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      // setMessage({
      //   type: "error",
      //   text: err.message || "Failed to change password",
      // });
      showMessage("error", err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/parent/dashboard")}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            My Profile
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-lg p-4 flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <p
              className={`text-sm ${
                message.type === "success"
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Profile Information
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Update your personal information
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="flex-1 bg-transparent text-slate-600 dark:text-slate-400 text-sm"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Read-only
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <div className="flex items-center gap-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                <User className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 bg-transparent text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Phone Number
              </label>
              <div className="flex items-center gap-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                <Phone className="h-5 w-5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent text-slate-900 dark:text-white focus:outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Change Password
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Update your password to keep your account secure
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Password
              </label>
              <div className="flex items-center gap-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 bg-transparent text-slate-900 dark:text-white focus:outline-none"
                  placeholder="At least 8 characters"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div className="flex items-center gap-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 bg-transparent text-slate-900 dark:text-white focus:outline-none"
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            {/* Change Password Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="h-5 w-5" />
              {saving ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">
                Account Information
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                If you need to update your email address or have any
                account-related issues, please contact the school
                administration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
