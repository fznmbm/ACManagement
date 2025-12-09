"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  CheckCircle,
  XCircle,
  HelpCircle,
  Download,
  Send,
  Filter,
  Loader2,
} from "lucide-react";

interface EventRSVPManagementProps {
  eventId: string;
  eventTitle: string;
  rsvpType: "none" | "adults_only" | "family" | "students_only";
  collectAgeBreakdown: boolean;
}

interface RSVPData {
  id: string;
  parent_user_id: string;
  student_id: string | null;
  rsvp_status: "attending" | "not_attending" | "maybe";
  adults_count: number;
  children_under_12_count: number;
  children_under_5_count: number;
  notes: string | null;
  dietary_requirements: string | null;
  created_at: string;
  updated_at: string;
  students?: {
    first_name: string;
    last_name: string;
  };
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface RSVPSummary {
  total_responses: number;
  attending: number;
  not_attending: number;
  maybe: number;
  no_response: number;
  total_attending_families: number;
  total_adults: number;
  total_children_under_12: number;
  total_children_under_5: number;
  total_students_attending: number;
}

export default function EventRSVPManagement({
  eventId,
  eventTitle,
  rsvpType,
  collectAgeBreakdown,
}: EventRSVPManagementProps) {
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<RSVPData[]>([]);
  const [summary, setSummary] = useState<RSVPSummary>({
    total_responses: 0,
    attending: 0,
    not_attending: 0,
    maybe: 0,
    no_response: 0,
    total_attending_families: 0,
    total_adults: 0,
    total_children_under_12: 0,
    total_children_under_5: 0,
    total_students_attending: 0,
  });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [totalEnrolledFamilies, setTotalEnrolledFamilies] = useState(0);

  useEffect(() => {
    loadRSVPData();
  }, [eventId]);

  async function loadRSVPData() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Load all RSVPs for this event
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("event_rsvps")
        .select(
          `
          *,
          students (first_name, last_name),
          profiles (full_name, email, phone)
        `
        )
        .eq("event_id", eventId)
        .order("updated_at", { ascending: false });

      if (rsvpError) throw rsvpError;

      setRsvps(rsvpData || []);

      // Calculate summary
      const uniqueFamilies = new Set(
        rsvpData?.map((r) => r.parent_user_id) || []
      );
      const attendingRSVPs =
        rsvpData?.filter((r) => r.rsvp_status === "attending") || [];
      const attendingFamilies = new Set(
        attendingRSVPs.map((r) => r.parent_user_id)
      );

      const summaryData: RSVPSummary = {
        total_responses: uniqueFamilies.size,
        attending: attendingRSVPs.length,
        not_attending:
          rsvpData?.filter((r) => r.rsvp_status === "not_attending").length ||
          0,
        maybe: rsvpData?.filter((r) => r.rsvp_status === "maybe").length || 0,
        no_response: 0, // Will calculate below
        total_attending_families: attendingFamilies.size,
        total_adults: attendingRSVPs.reduce(
          (sum, r) => sum + (r.adults_count || 0),
          0
        ),
        total_children_under_12: attendingRSVPs.reduce(
          (sum, r) => sum + (r.children_under_12_count || 0),
          0
        ),
        total_children_under_5: attendingRSVPs.reduce(
          (sum, r) => sum + (r.children_under_5_count || 0),
          0
        ),
        total_students_attending: attendingRSVPs.length,
      };

      // Get total enrolled families to calculate no response
      const { count: familyCount } = await supabase
        .from("students")
        .select("parent_user_id", { count: "exact", head: true })
        .eq("status", "active");

      const uniqueEnrolledFamilies = familyCount || 0;
      setTotalEnrolledFamilies(uniqueEnrolledFamilies);
      summaryData.no_response = Math.max(
        0,
        uniqueEnrolledFamilies - summaryData.total_responses
      );

      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading RSVP data:", error);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    // Group by family
    const familyMap = new Map<string, RSVPData[]>();
    rsvps.forEach((rsvp) => {
      const family = familyMap.get(rsvp.parent_user_id) || [];
      family.push(rsvp);
      familyMap.set(rsvp.parent_user_id, family);
    });

    // Build CSV
    let csv = "";

    if (rsvpType === "adults_only") {
      csv = "Parent Name,Email,Phone,Status,Adults Count,Notes,Response Date\n";
      familyMap.forEach((rsvps) => {
        const rsvp = rsvps[0]; // Only one RSVP per family for adults-only
        const profile = rsvp.profiles;
        csv += `"${profile?.full_name || ""}","${profile?.email || ""}","${
          profile?.phone || ""
        }","${rsvp.rsvp_status}",${rsvp.adults_count},"${
          rsvp.notes || ""
        }","${new Date(rsvp.updated_at).toLocaleString()}"\n`;
      });
    } else {
      csv =
        "Parent Name,Email,Phone,Student Name,Status,Adults,Children <12,Children <5,Dietary,Notes,Response Date\n";
      familyMap.forEach((familyRSVPs) => {
        familyRSVPs.forEach((rsvp) => {
          const profile = rsvp.profiles;
          const student = rsvp.students;
          csv += `"${profile?.full_name || ""}","${profile?.email || ""}","${
            profile?.phone || ""
          }","${
            student ? `${student.first_name} ${student.last_name}` : ""
          }","${rsvp.rsvp_status}",${rsvp.adults_count},${
            rsvp.children_under_12_count
          },${rsvp.children_under_5_count},"${
            rsvp.dietary_requirements || ""
          }","${rsvp.notes || ""}","${new Date(
            rsvp.updated_at
          ).toLocaleString()}"\n`;
        });
      });
    }

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle.replace(/[^a-z0-9]/gi, "_")}_RSVPs.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function sendReminders() {
    alert(
      "Reminder functionality will send notifications to parents who haven't responded yet. This feature requires the notification system to be fully integrated."
    );
  }

  // Filter RSVPs
  const filteredRSVPs = rsvps.filter((rsvp) => {
    if (filterStatus === "all") return true;
    return rsvp.rsvp_status === filterStatus;
  });

  // Group by family for display
  const familyMap = new Map<string, RSVPData[]>();
  filteredRSVPs.forEach((rsvp) => {
    const family = familyMap.get(rsvp.parent_user_id) || [];
    family.push(rsvp);
    familyMap.set(rsvp.parent_user_id, family);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Attending
            </span>
          </div>
          <div className="text-3xl font-bold text-green-700 dark:text-green-300">
            {summary.total_attending_families}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {rsvpType === "adults_only"
              ? "families"
              : `${summary.total_students_attending} students`}
          </div>
        </div>

        <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-900 dark:text-red-100">
              Not Attending
            </span>
          </div>
          <div className="text-3xl font-bold text-red-700 dark:text-red-300">
            {summary.not_attending}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            responses
          </div>
        </div>

        <div className="p-4 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Maybe
            </span>
          </div>
          <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {summary.maybe}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            responses
          </div>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              No Response
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
            {summary.no_response}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            families
          </div>
        </div>
      </div>

      {/* Age Breakdown (for family events) */}
      {rsvpType === "family" && collectAgeBreakdown && (
        <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Total Attendees Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                Adults
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {summary.total_adults}
              </div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                Students
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {summary.total_students_attending}
              </div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                Children &lt;12
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {summary.total_children_under_12}
              </div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                Children &lt;5
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {summary.total_children_under_5}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            <div className="text-blue-900 dark:text-blue-100 font-semibold">
              Total People:{" "}
              {summary.total_adults +
                summary.total_students_attending +
                summary.total_children_under_12 +
                summary.total_children_under_5}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={exportToCSV}
          disabled={rsvps.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </button>
        <button
          onClick={sendReminders}
          disabled={summary.no_response === 0}
          className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
          Send Reminders ({summary.no_response})
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
        >
          <option value="all">All Responses ({rsvps.length})</option>
          <option value="attending">Attending ({summary.attending})</option>
          <option value="not_attending">
            Not Attending ({summary.not_attending})
          </option>
          <option value="maybe">Maybe ({summary.maybe})</option>
        </select>
      </div>

      {/* Family List */}
      <div className="border border-input rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-3 font-semibold text-sm border-b border-input">
          Family Responses ({familyMap.size})
        </div>
        {familyMap.size === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No responses yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Array.from(familyMap.entries()).map(([parentId, familyRSVPs]) => {
              const profile = familyRSVPs[0]?.profiles;
              const attendingCount = familyRSVPs.filter(
                (r) => r.rsvp_status === "attending"
              ).length;
              const totalCount = familyRSVPs.length;

              return (
                <div
                  key={parentId}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {profile?.full_name || "Unknown Parent"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {profile?.email || "No email"} •{" "}
                        {profile?.phone || "No phone"}
                      </div>
                      {rsvpType === "adults_only" ? (
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              familyRSVPs[0].rsvp_status === "attending"
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : familyRSVPs[0].rsvp_status === "not_attending"
                                ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                : "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                            }`}
                          >
                            {familyRSVPs[0].rsvp_status === "attending" &&
                              "✓ Attending"}
                            {familyRSVPs[0].rsvp_status === "not_attending" &&
                              "✗ Not Attending"}
                            {familyRSVPs[0].rsvp_status === "maybe" &&
                              "? Maybe"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {familyRSVPs[0].adults_count} adult
                            {familyRSVPs[0].adults_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="text-sm">
                            {attendingCount} of {totalCount} attending
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {familyRSVPs.map((rsvp) => (
                              <span
                                key={rsvp.id}
                                className={`px-2 py-1 text-xs font-medium rounded ${
                                  rsvp.rsvp_status === "attending"
                                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                    : rsvp.rsvp_status === "not_attending"
                                    ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                    : "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                                }`}
                              >
                                {rsvp.students
                                  ? `${rsvp.students.first_name} ${rsvp.students.last_name}`
                                  : "Unknown"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {rsvpType === "family" &&
                        familyRSVPs[0].rsvp_status === "attending" && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Adults: {familyRSVPs[0].adults_count}
                            {collectAgeBreakdown && (
                              <>
                                {" • Children <12: "}
                                {familyRSVPs[0].children_under_12_count}
                                {" • Children <5: "}
                                {familyRSVPs[0].children_under_5_count}
                              </>
                            )}
                          </div>
                        )}
                      {familyRSVPs[0].dietary_requirements && (
                        <div className="mt-2 text-xs">
                          <span className="font-medium">Dietary: </span>
                          {familyRSVPs[0].dietary_requirements}
                        </div>
                      )}
                      {familyRSVPs[0].notes && (
                        <div className="mt-2 text-xs">
                          <span className="font-medium">Notes: </span>
                          {familyRSVPs[0].notes}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(familyRSVPs[0].updated_at).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                        }
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
