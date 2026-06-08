"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: string;
  priority: string;
  rsvp_required: boolean;
  rsvp_deadline: string | null;
}

interface RSVPState {
  [eventId: string]: "attending" | "not_attending" | null;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  holiday: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  exam: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  meeting: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  celebration:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export default function ParentEventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvpStates, setRsvpStates] = useState<RSVPState>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentUserId, setParentUserId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setParentUserId(user.id);

    // Get first linked student
    const { data: links } = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_user_id", user.id)
      .limit(1);
    const sid = links?.[0]?.student_id || null;
    setStudentId(sid);

    // Load events
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .eq("visible_to_parents", true)
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true });

    setEvents(eventsData || []);

    // Load existing RSVPs
    if (eventsData && eventsData.length > 0) {
      const eventIds = eventsData.map((e) => e.id);
      const { data: rsvpData } = await supabase
        .from("event_rsvps")
        .select("event_id, rsvp_status")
        .eq("parent_user_id", user.id)
        .in("event_id", eventIds);

      const states: RSVPState = {};
      rsvpData?.forEach((r) => {
        states[r.event_id] = r.rsvp_status as any;
      });
      setRsvpStates(states);
    }

    setLoading(false);
  };

  const handleRSVP = async (
    eventId: string,
    status: "attending" | "not_attending",
  ) => {
    if (!parentUserId) return;

    // Check deadline
    const event = events.find((e) => e.id === eventId);
    if (event?.rsvp_deadline && new Date() > new Date(event.rsvp_deadline)) {
      alert("RSVP deadline has passed.");
      return;
    }

    setSaving(eventId);
    try {
      // Delete existing
      await supabase
        .from("event_rsvps")
        .delete()
        .eq("event_id", eventId)
        .eq("parent_user_id", parentUserId);

      // Insert new
      const { error } = await supabase.from("event_rsvps").insert({
        event_id: eventId,
        parent_user_id: parentUserId,
        student_id: studentId,
        rsvp_status: status,
        rsvp_type: "family",
      });

      if (error) throw error;
      setRsvpStates((prev) => ({ ...prev, [eventId]: status }));
    } catch (err: any) {
      alert(err.message || "Failed to submit RSVP");
    } finally {
      setSaving(null);
    }
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Events
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Upcoming school events and activities
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            No upcoming events
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const currentRSVP = rsvpStates[event.id];
            const isSaving = saving === event.id;
            const deadlinePassed = event.rsvp_deadline
              ? new Date() > new Date(event.rsvp_deadline)
              : false;

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-5">
                  {/* Priority banner */}
                  {event.priority === "urgent" && (
                    <div className="mb-3 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-medium text-orange-700 dark:text-orange-400">
                      ⚠️ Urgent — Please read
                    </div>
                  )}
                  {event.priority === "critical" && (
                    <div className="mb-3 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium text-red-700 dark:text-red-400">
                      🚨 Important — Action required
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.general}`}
                        >
                          {event.event_type.charAt(0).toUpperCase() +
                            event.event_type.slice(1)}
                        </span>
                        {event.rsvp_required &&
                          !currentRSVP &&
                          !deadlinePassed && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                              Response needed
                            </span>
                          )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {event.title}
                      </h3>

                      <div className="flex flex-col gap-1 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 shrink-0" />
                          {formatDate(event.event_date)}
                        </span>
                        {event.event_time && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 shrink-0" />
                            {event.event_time}
                            {event.end_time ? ` – ${event.end_time}` : ""}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RSVP Section */}
                  {event.rsvp_required && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      {deadlinePassed ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ⏰ RSVP deadline passed
                          {currentRSVP &&
                            ` — You responded: ${currentRSVP === "attending" ? "Attending" : "Not Attending"}`}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                            Will you attend?
                            {event.rsvp_deadline && (
                              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                                Respond by{" "}
                                {new Date(
                                  event.rsvp_deadline,
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            )}
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleRSVP(event.id, "attending")}
                              disabled={isSaving}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                                currentRSVP === "attending"
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : "border-slate-200 dark:border-slate-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Yes, Attending
                            </button>
                            <button
                              onClick={() =>
                                handleRSVP(event.id, "not_attending")
                              }
                              disabled={isSaving}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                                currentRSVP === "not_attending"
                                  ? "border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  : "border-slate-200 dark:border-slate-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Can't Attend
                            </button>
                          </div>
                          {currentRSVP && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              ✓ Response recorded — you can change it before the
                              deadline.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
