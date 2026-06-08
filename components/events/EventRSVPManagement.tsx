"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface Props {
  eventId: string;
  eventTitle: string;
}

interface RSVPEntry {
  id: string;
  parent_user_id: string;
  rsvp_status: "attending" | "not_attending";
  notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
  students?: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function EventRSVPManagement({ eventId, eventTitle }: Props) {
  const supabase = createClient();
  const [rsvps, setRsvps] = useState<RSVPEntry[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "attending" | "not_attending" | "no_response"
  >("all");

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: rsvpData } = await supabase
      .from("event_rsvps")
      .select("*, profiles(full_name, phone), students(first_name, last_name)")
      .eq("event_id", eventId);

    // Get all parents linked to students
    const { data: parentLinks } = await supabase
      .from("parent_student_links")
      .select(
        "parent_user_id, students(first_name, last_name), profiles:parent_user_id(full_name, phone)",
      )
      .eq("is_primary", true);

    setRsvps(rsvpData || []);
    setAllStudents(parentLinks || []);
    setLoading(false);
  };

  const attending = rsvps.filter((r) => r.rsvp_status === "attending");
  const notAttending = rsvps.filter((r) => r.rsvp_status === "not_attending");
  const respondedIds = new Set(rsvps.map((r) => r.parent_user_id));
  const noResponse = allStudents.filter(
    (l: any) => !respondedIds.has(l.parent_user_id),
  );

  const generateReminderMessage = () => {
    const names = noResponse
      .map((l: any) =>
        l.students ? `${l.students.first_name} ${l.students.last_name}` : "",
      )
      .filter(Boolean)
      .map((n) => `• ${n}`)
      .join("\n");

    return `🕌 *Al Hikmah Institute Crawley*\n\n📢 *RSVP Reminder — ${eventTitle}*\n\nAssalamu Alaikum,\n\nWe haven't received your RSVP for this event yet. Please log in to the parent portal and confirm your attendance.\n\nPending responses:\n${names}\n\nJazakAllah Khair`;
  };

  const filteredRsvps =
    filter === "attending"
      ? attending
      : filter === "not_attending"
        ? notAttending
        : filter === "no_response"
          ? []
          : rsvps;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() =>
            setFilter(filter === "attending" ? "all" : "attending")
          }
          className={`p-3 rounded-lg border text-center transition-all ${
            filter === "attending"
              ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700"
              : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          }`}
        >
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {attending.length}
          </p>
          <p className="text-xs text-green-600 dark:text-green-500">
            Attending
          </p>
        </button>
        <button
          onClick={() =>
            setFilter(filter === "not_attending" ? "all" : "not_attending")
          }
          className={`p-3 rounded-lg border text-center transition-all ${
            filter === "not_attending"
              ? "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700"
              : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
          }`}
        >
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {notAttending.length}
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">
            Not Attending
          </p>
        </button>
        <button
          onClick={() =>
            setFilter(filter === "no_response" ? "all" : "no_response")
          }
          className={`p-3 rounded-lg border text-center transition-all ${
            filter === "no_response"
              ? "bg-slate-200 border-slate-400 dark:bg-slate-700 dark:border-slate-500"
              : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
          }`}
        >
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {noResponse.length}
          </p>
          <p className="text-xs text-slate-500">No Response</p>
        </button>
      </div>

      {/* List */}
      {filter === "no_response" ? (
        <div className="space-y-3">
          {noResponse.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Everyone has responded ✓
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {noResponse.map((link: any, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {link.students
                          ? `${link.students.first_name} ${link.students.last_name}`
                          : "Unknown"}
                      </p>
                      {link.profiles?.full_name && (
                        <p className="text-xs text-muted-foreground">
                          {link.profiles.full_name}
                        </p>
                      )}
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    generateReminderMessage(),
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 3000);
                }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                {copied ? "Copied!" : "Copy Reminder Message"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRsvps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No responses yet
            </p>
          ) : (
            filteredRsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
              >
                <div>
                  <p className="text-sm font-medium">
                    {rsvp.students
                      ? `${rsvp.students.first_name} ${rsvp.students.last_name}`
                      : rsvp.profiles?.full_name || "Unknown"}
                  </p>
                  {rsvp.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rsvp.notes}
                    </p>
                  )}
                </div>
                {rsvp.rsvp_status === "attending" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
