"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, HelpCircle, Loader2 } from "lucide-react";

interface ParentEventRSVPProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  rsvpType: "none" | "adults_only" | "family" | "students_only";
  collectAgeBreakdown: boolean;
  rsvpDeadline: string | null;
  maxCapacity: number | null;
}

interface StudentRSVP {
  student_id: string;
  student_name: string;
  rsvp_status: "attending" | "not_attending" | "maybe";
}

interface ExistingRSVP {
  id: string;
  student_id: string;
  rsvp_status: "attending" | "not_attending" | "maybe";
  adults_count: number;
  children_under_12_count: number;
  children_under_5_count: number;
  notes: string | null;
  dietary_requirements: string | null;
}

export default function ParentEventRSVP({
  eventId,
  eventTitle,
  eventDate,
  rsvpType,
  collectAgeBreakdown,
  rsvpDeadline,
  maxCapacity,
}: ParentEventRSVPProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [studentRSVPs, setStudentRSVPs] = useState<StudentRSVP[]>([]);
  const [existingRSVPs, setExistingRSVPs] = useState<ExistingRSVP[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [parentUserId, setParentUserId] = useState<string | null>(null);

  // Age breakdown state (for family events)
  const [adultsCount, setAdultsCount] = useState(0);
  const [childrenUnder12, setChildrenUnder12] = useState(0);
  const [childrenUnder5, setChildrenUnder5] = useState(0);
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [notes, setNotes] = useState("");

  // Adults-only state
  const [adultsOnlyCount, setAdultsOnlyCount] = useState(1);
  const [adultsOnlyStatus, setAdultsOnlyStatus] = useState<
    "attending" | "not_attending" | "maybe"
  >("attending");

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");
      setParentUserId(user.id);

      // Load children
      const { data: linkData, error: linkError } = await supabase
        .from("parent_student_links")
        .select(
          `
    student_id,
    students (
      id,
      first_name,
      last_name,
      status
    )
  `
        )
        .eq("parent_user_id", user.id);

      if (linkError) throw linkError;

      // Filter for active students and flatten the data
      const childrenData =
        linkData
          ?.filter((link: any) => link.students?.status === "active")
          .map((link: any) => link.students) || [];

      setChildren(childrenData || []);

      // Load existing RSVPs
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("parent_user_id", user.id);

      if (rsvpError) throw rsvpError;
      setExistingRSVPs(rsvpData || []);

      // Initialize student RSVPs
      if (childrenData && childrenData.length > 0) {
        const initialRSVPs = childrenData.map((child) => {
          const existing = rsvpData?.find((r) => r.student_id === child.id);
          return {
            student_id: child.id,
            student_name: `${child.first_name} ${child.last_name}`,
            rsvp_status: existing?.rsvp_status || "attending",
          };
        });
        setStudentRSVPs(initialRSVPs);

        // Load age breakdown from first existing RSVP
        if (rsvpData && rsvpData.length > 0) {
          const firstRSVP = rsvpData[0];
          setAdultsCount(firstRSVP.adults_count || 0);
          setChildrenUnder12(firstRSVP.children_under_12_count || 0);
          setChildrenUnder5(firstRSVP.children_under_5_count || 0);
          setDietaryRequirements(firstRSVP.dietary_requirements || "");
          setNotes(firstRSVP.notes || "");
        }
      }

      // For adults-only events
      if (rsvpType === "adults_only" && rsvpData && rsvpData.length > 0) {
        setAdultsOnlyCount(rsvpData[0].adults_count || 1);
        setAdultsOnlyStatus(rsvpData[0].rsvp_status);
        setNotes(rsvpData[0].notes || "");
      }
    } catch (error) {
      console.error("Error loading RSVP data:", error);
    } finally {
      setLoading(false);
    }
  }

  function updateStudentRSVP(
    studentId: string,
    status: "attending" | "not_attending" | "maybe"
  ) {
    setStudentRSVPs((prev) =>
      prev.map((rsvp) =>
        rsvp.student_id === studentId ? { ...rsvp, rsvp_status: status } : rsvp
      )
    );
  }

  async function handleSubmit() {
    if (!parentUserId) return;

    // Check deadline
    if (rsvpDeadline) {
      const deadline = new Date(rsvpDeadline);
      if (new Date() > deadline) {
        alert("The RSVP deadline has passed.");
        return;
      }
    }

    setSaving(true);
    try {
      const supabase = createClient();

      if (rsvpType === "adults_only") {
        // Adults-only event - single RSVP
        const rsvpData = {
          event_id: eventId,
          parent_user_id: parentUserId,
          student_id: null,
          rsvp_status: adultsOnlyStatus,
          adults_count: adultsOnlyCount,
          children_under_12_count: 0,
          children_under_5_count: 0,
          notes: notes || null,
          dietary_requirements: null,
        };

        // Delete existing and insert new
        await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("parent_user_id", parentUserId);

        const { error } = await supabase.from("event_rsvps").insert(rsvpData);
        if (error) throw error;
      } else {
        // Student-based events
        // Delete all existing RSVPs for this event
        await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("parent_user_id", parentUserId);

        // Insert new RSVPs for each student
        const rsvpsToInsert = studentRSVPs.map((studentRSVP) => ({
          event_id: eventId,
          parent_user_id: parentUserId,
          student_id: studentRSVP.student_id,
          rsvp_status: studentRSVP.rsvp_status,
          adults_count: rsvpType === "family" ? adultsCount : 0,
          children_under_12_count:
            rsvpType === "family" && collectAgeBreakdown ? childrenUnder12 : 0,
          children_under_5_count:
            rsvpType === "family" && collectAgeBreakdown ? childrenUnder5 : 0,
          notes: notes || null,
          dietary_requirements:
            rsvpType === "family" && collectAgeBreakdown
              ? dietaryRequirements || null
              : null,
        }));

        const { error } = await supabase
          .from("event_rsvps")
          .insert(rsvpsToInsert);
        if (error) throw error;
      }

      alert("RSVP submitted successfully! ✅");
      await loadData();
      setExpanded(false);
    } catch (error: any) {
      console.error("Error submitting RSVP:", error);
      alert(error.message || "Failed to submit RSVP");
    } finally {
      setSaving(false);
    }
  }

  // Check if deadline passed
  const deadlinePassed = rsvpDeadline
    ? new Date() > new Date(rsvpDeadline)
    : false;

  // Calculate totals
  const attendingCount = studentRSVPs.filter(
    (r) => r.rsvp_status === "attending"
  ).length;
  const notAttendingCount = studentRSVPs.filter(
    (r) => r.rsvp_status === "not_attending"
  ).length;
  const maybeCount = studentRSVPs.filter(
    (r) => r.rsvp_status === "maybe"
  ).length;
  const totalPeople =
    attendingCount +
    (rsvpType === "family"
      ? adultsCount + childrenUnder12 + childrenUnder5
      : 0);

  // Check if already responded
  const hasResponded = existingRSVPs.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rsvpType === "none") {
    return null; // No RSVP required
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      {/* RSVP Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">Will you attend?</div>
          {deadlinePassed && (
            <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              Deadline passed
            </span>
          )}
          {hasResponded && !expanded && (
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
              ✓ Responded
            </span>
          )}
        </div>
        {hasResponded && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            disabled={deadlinePassed}
            className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline"
          >
            Edit RSVP
          </button>
        )}
      </div>

      {/* Current Status (if already responded and not expanded) */}
      {hasResponded && !expanded && (
        <div className="p-3 bg-muted rounded-lg text-sm">
          {rsvpType === "adults_only" ? (
            <div>
              <p>
                Status:{" "}
                <span className="font-semibold">
                  {adultsOnlyStatus === "attending"
                    ? "Attending"
                    : adultsOnlyStatus === "not_attending"
                    ? "Not Attending"
                    : "Maybe"}
                </span>
              </p>
              <p>Adults: {adultsOnlyCount}</p>
            </div>
          ) : (
            <div>
              <p>
                ✓ {attendingCount} attending
                {notAttendingCount > 0 &&
                  ` • ✗ ${notAttendingCount} not attending`}
                {maybeCount > 0 && ` • ? ${maybeCount} maybe`}
              </p>
              {rsvpType === "family" && totalPeople > attendingCount && (
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {totalPeople} people
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* RSVP Form (if not responded or expanded) */}
      {(!hasResponded || expanded) && (
        <div className="space-y-4">
          {/* Adults-Only Event */}
          {rsvpType === "adults_only" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setAdultsOnlyStatus("attending")}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    adultsOnlyStatus === "attending"
                      ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                      : "border-input hover:border-green-300"
                  }`}
                >
                  <Check className="h-4 w-4 inline mr-1" />
                  Attending
                </button>
                <button
                  onClick={() => setAdultsOnlyStatus("not_attending")}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    adultsOnlyStatus === "not_attending"
                      ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                      : "border-input hover:border-red-300"
                  }`}
                >
                  <X className="h-4 w-4 inline mr-1" />
                  Not Attending
                </button>
                <button
                  onClick={() => setAdultsOnlyStatus("maybe")}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    adultsOnlyStatus === "maybe"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
                      : "border-input hover:border-orange-300"
                  }`}
                >
                  <HelpCircle className="h-4 w-4 inline mr-1" />
                  Maybe
                </button>
              </div>

              {adultsOnlyStatus === "attending" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of adults attending:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adultsOnlyCount}
                    onChange={(e) =>
                      setAdultsOnlyCount(parseInt(e.target.value) || 1)
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., 2 if both parents coming
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Student-Based Events (family or students_only) */}
          {(rsvpType === "family" || rsvpType === "students_only") && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Select for each child:</div>
              {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No enrolled children found.
                </p>
              ) : (
                children.map((child) => {
                  const studentRSVP = studentRSVPs.find(
                    (r) => r.student_id === child.id
                  );
                  const status = studentRSVP?.rsvp_status || "attending";

                  return (
                    <div
                      key={child.id}
                      className="p-3 border border-input rounded-lg"
                    >
                      <div className="font-medium text-sm mb-2">
                        {child.first_name} {child.last_name}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateStudentRSVP(child.id, "attending")
                          }
                          className={`flex-1 py-2 px-3 text-xs rounded-lg border-2 transition-colors ${
                            status === "attending"
                              ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                              : "border-input hover:border-green-300"
                          }`}
                        >
                          <Check className="h-3 w-3 inline mr-1" />
                          Attending
                        </button>
                        <button
                          onClick={() =>
                            updateStudentRSVP(child.id, "not_attending")
                          }
                          className={`flex-1 py-2 px-3 text-xs rounded-lg border-2 transition-colors ${
                            status === "not_attending"
                              ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                              : "border-input hover:border-red-300"
                          }`}
                        >
                          <X className="h-3 w-3 inline mr-1" />
                          Not Attending
                        </button>
                        <button
                          onClick={() => updateStudentRSVP(child.id, "maybe")}
                          className={`flex-1 py-2 px-3 text-xs rounded-lg border-2 transition-colors ${
                            status === "maybe"
                              ? "border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
                              : "border-input hover:border-orange-300"
                          }`}
                        >
                          <HelpCircle className="h-3 w-3 inline mr-1" />
                          Maybe
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Age Breakdown (for family events) */}
          {rsvpType === "family" && attendingCount > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="text-sm font-medium">
                Additional Family Members
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Adults (parents/guardians):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adultsCount}
                    onChange={(e) =>
                      setAdultsCount(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
                {collectAgeBreakdown && (
                  <>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Children under 12 (not enrolled):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={childrenUnder12}
                        onChange={(e) =>
                          setChildrenUnder12(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Children under 5 (not enrolled):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={childrenUnder5}
                        onChange={(e) =>
                          setChildrenUnder5(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      />
                    </div>
                  </>
                )}
              </div>
              {collectAgeBreakdown && (
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Dietary Requirements (Optional):
                  </label>
                  <input
                    type="text"
                    value={dietaryRequirements}
                    onChange={(e) => setDietaryRequirements(e.target.value)}
                    placeholder="e.g., Halal only, no nuts"
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
              )}
              <div className="p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs">
                <strong>Total attendees:</strong> {totalPeople} people
                {totalPeople > 0 && (
                  <div className="text-muted-foreground mt-1">
                    {attendingCount} enrolled student
                    {attendingCount !== 1 ? "s" : ""}
                    {adultsCount > 0 &&
                      ` + ${adultsCount} adult${adultsCount !== 1 ? "s" : ""}`}
                    {childrenUnder12 > 0 &&
                      ` + ${childrenUnder12} child${
                        childrenUnder12 !== 1 ? "ren" : ""
                      } under 12`}
                    {childrenUnder5 > 0 &&
                      ` + ${childrenUnder5} child${
                        childrenUnder5 !== 1 ? "ren" : ""
                      } under 5`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Additional Notes (Optional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any special requirements or notes..."
              className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
            />
          </div>

          {/* Deadline Warning */}
          {rsvpDeadline && (
            <p className="text-xs text-muted-foreground">
              ⏰ Please RSVP by:{" "}
              {new Date(rsvpDeadline).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={
                saving ||
                deadlinePassed ||
                (children.length === 0 && rsvpType !== "adults_only")
              }
              className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving
                ? "Submitting..."
                : hasResponded
                ? "Update RSVP"
                : "Submit RSVP"}
            </button>
            {expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
