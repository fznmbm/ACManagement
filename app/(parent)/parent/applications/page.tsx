"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  ArrowLeft,
} from "lucide-react";

interface Application {
  id: string;
  student_first_name: string;
  student_last_name: string;
  student_date_of_birth: string;
  student_gender: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  status: "pending" | "accepted" | "rejected" | "waitlist";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  acceptance_date?: string;
  rejection_reason?: string;
  admin_notes?: string;
}

export default function ApplicationsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/parent/login");
        return;
      }

      // Get parent email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (!profile?.email) {
        setLoading(false);
        return;
      }

      // Fetch applications
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("parent_email", profile.email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setApplications(data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800";
      case "waitlist":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-5 w-5" />;
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "rejected":
        return <XCircle className="h-5 w-5" />;
      case "waitlist":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const filteredApplications =
    filter === "all"
      ? applications
      : applications.filter((app) => app.status === filter);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    waitlist: applications.filter((a) => a.status === "waitlist").length,
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/parent/dashboard")}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Applications
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {applications.length}{" "}
              {applications.length === 1 ? "application" : "applications"}{" "}
              submitted
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.total}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {stats.pending}
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              Pending
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {stats.accepted}
            </p>
            <p className="text-sm text-green-600 dark:text-green-500">
              Accepted
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {stats.waitlist}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-500">Waitlist</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              {stats.rejected}
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">Rejected</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Application History
          </h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="waitlist">Waitlist</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              {filter === "all"
                ? "No applications submitted yet"
                : `No ${filter} applications`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Application Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {app.student_first_name} {app.student_last_name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Submitted{" "}
                        {new Date(app.created_at).toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {getStatusIcon(app.status)}
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Application Details */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Student Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">
                            Date of Birth:
                          </span>
                          <span className="ml-2 text-slate-900 dark:text-white">
                            {new Date(
                              app.student_date_of_birth
                            ).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">
                            Gender:
                          </span>
                          <span className="ml-2 text-slate-900 dark:text-white capitalize">
                            {app.student_gender}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Parent Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Parent Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-900 dark:text-white">
                            {app.parent_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-900 dark:text-white">
                            {app.parent_email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-900 dark:text-white">
                            {app.parent_phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acceptance Info */}
                  {app.status === "accepted" && app.acceptance_date && (
                    <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-green-900 dark:text-green-400 mb-1">
                            Application Accepted
                          </h5>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Accepted on{" "}
                            {new Date(app.acceptance_date).toLocaleDateString(
                              "en-GB"
                            )}
                            . Please contact the school office to complete the
                            enrollment process.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Info */}
                  {app.status === "rejected" && app.rejection_reason && (
                    <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-red-900 dark:text-red-400 mb-1">
                            Application Not Accepted
                          </h5>
                          <p className="text-sm text-red-700 dark:text-red-400">
                            {app.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {app.admin_notes && (
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h5 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                        Additional Notes
                      </h5>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        {app.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
