"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  CheckCircle2,
  X,
  MessageSquare,
  Award,
  TrendingDown,
  CreditCard,
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const WHATSAPP_NUMBER = "447411061242";

interface StudentEvent {
  id: string;
  student_id: string;
  event_type: string;
  metadata: Record<string, any>;
  status: string;
  triggered_at: string;
  students: {
    first_name: string;
    last_name: string;
    student_number: string;
    parent_phone: string;
    parent_name: string;
    classes?: { name: string } | null;
  };
}

const EVENT_CONFIG = {
  attendance_low: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    label: "Low Attendance",
    priority: 1,
  },
  fee_overdue: {
    icon: CreditCard,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    label: "Fee Overdue",
    priority: 2,
  },
  grade_low: {
    icon: TrendingDown,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    badge:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    label: "Low Grade",
    priority: 3,
  },
  prayer_missing: {
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Prayer Sheet Missing",
    priority: 4,
  },
  certificate_ready: {
    icon: Award,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    label: "Certificate Ready",
    priority: 5,
  },
};

const generateWhatsAppMessage = (event: StudentEvent): string => {
  const { students: s, event_type, metadata } = event;
  const name = `${s.first_name} ${s.last_name}`;

  switch (event_type) {
    case "attendance_low":
      return `Assalamu Alaikum ${s.parent_name},\n\nThis is Al Hikmah Institute Crawley. We wanted to let you know that ${name} has been absent ${metadata.absences} times this month.\n\nPlease contact us if there is anything we can help with.\n\nJazakAllah Khair,\nAl Hikmah Institute`;

    case "grade_low":
      return `Assalamu Alaikum ${s.parent_name},\n\nThis is Al Hikmah Institute Crawley. We wanted to let you know that ${name} scored ${metadata.percentage}% in their recent ${metadata.subject_name} assessment.\n\nWe encourage extra practice at home. Please contact us if you would like to discuss their progress.\n\nJazakAllah Khair,\nAl Hikmah Institute`;

    case "fee_overdue":
      return `Assalamu Alaikum ${s.parent_name},\n\nThis is a gentle reminder that ${name}'s fee payment of £${Number(metadata.amount_due).toFixed(2)} (Invoice: ${metadata.invoice_number}) was due on ${new Date(metadata.due_date).toLocaleDateString("en-GB")}.\n\nPlease arrange payment at your earliest convenience.\n\nJazakAllah Khair,\nAl Hikmah Institute`;

    case "prayer_missing":
      return `Assalamu Alaikum ${s.parent_name},\n\nThis is a reminder to submit ${name}'s prayer sheet for this week on the parent portal.\n\nJazakAllah Khair,\nAl Hikmah Institute`;

    case "certificate_ready":
      return `Assalamu Alaikum ${s.parent_name},\n\nAlhamdulillah! We are pleased to inform you that ${name} has successfully completed ${metadata.subject_name} with an average of ${metadata.average_percentage}%.\n\nA certificate will be awarded at the next class. MashaAllah, well done to ${s.first_name}!\n\nJazakAllah Khair,\nAl Hikmah Institute`;

    default:
      return `Assalamu Alaikum ${s.parent_name},\n\nThis is Al Hikmah Institute Crawley regarding ${name}.\n\nJazakAllah Khair`;
  }
};

const getEventSummary = (event: StudentEvent): string => {
  const { event_type, metadata } = event;
  switch (event_type) {
    case "attendance_low":
      return `${metadata.absences} absences in ${metadata.month}`;
    case "grade_low":
      return `${metadata.percentage}% in ${metadata.subject_name}`;
    case "fee_overdue":
      return `£${Number(metadata.amount_due).toFixed(2)} overdue — ${metadata.days_overdue} days`;
    case "prayer_missing":
      return `Prayer sheet not submitted`;
    case "certificate_ready":
      return `${metadata.subject_name} — avg ${metadata.average_percentage}%`;
    default:
      return "Needs attention";
  }
};

interface Props {
  compact?: boolean; // For dashboard widget vs full page
}

export default function AlertsDashboard({ compact = false }: Props) {
  const supabase = createClient();
  const [events, setEvents] = useState<StudentEvent[]>([]);
  const [actionedEvents, setActionedEvents] = useState<StudentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showActioned, setShowActioned] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState<string | null>(null);
  const [whatsAppMsg, setWhatsAppMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data: active } = await supabase
      .from("student_events")
      .select(
        `
        *,
        students (
          first_name, last_name, student_number,
          parent_phone, parent_name,
          classes ( name )
        )
      `,
      )
      .eq("status", "active")
      .order("triggered_at", { ascending: false });

    const { data: actioned } = await supabase
      .from("student_events")
      .select(
        `
        *,
        students (
          first_name, last_name, student_number,
          parent_phone, parent_name,
          classes ( name )
        )
      `,
      )
      .in("status", ["actioned", "dismissed"])
      .order("actioned_at", { ascending: false })
      .limit(20);

    setEvents((active || []) as any);
    setActionedEvents((actioned || []) as any);
    setLoading(false);
  };

  const updateEventStatus = async (
    eventId: string,
    newStatus: "actioned" | "dismissed",
    phoneNumber?: string,
    messageText?: string,
  ) => {
    setUpdating(eventId);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("student_events")
      .update({
        status: newStatus,
        actioned_at: new Date().toISOString(),
        actioned_by: user?.id,
      })
      .eq("id", eventId);

    // Log to delivery log if whatsapp was sent
    if (newStatus === "actioned" && phoneNumber && messageText) {
      await supabase.from("message_delivery_log").insert({
        event_id: eventId,
        student_id: events.find((e) => e.id === eventId)?.student_id,
        sent_by: user?.id,
        delivery_method: "whatsapp",
        message_text: messageText,
        recipient_phone: phoneNumber,
      });
    }

    setUpdating(null);
    setShowWhatsApp(null);
    fetchEvents();
  };

  const handleWhatsAppClick = (event: StudentEvent) => {
    const msg = generateWhatsAppMessage(event);
    setWhatsAppMsg(msg);
    setShowWhatsApp(event.id);
    setCopied(false);
  };

  const handleSendWhatsApp = (event: StudentEvent) => {
    const phone = event.students.parent_phone
      ?.replace(/\s+/g, "")
      .replace(/^\+/, "");
    const encoded = encodeURIComponent(whatsAppMsg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    updateEventStatus(
      event.id,
      "actioned",
      event.students.parent_phone,
      whatsAppMsg,
    );
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(whatsAppMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleIssueCertificate = async (event: StudentEvent) => {
    setUpdating(event.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Generate certificate
    const year = new Date().getFullYear();
    const { data: lastCert } = await supabase
      .from("certificates")
      .select("certificate_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const lastNum = lastCert
      ? parseInt(lastCert.certificate_number.split("-")[2] || "0")
      : 0;
    const certNumber = `CERT-${year}-${String(lastNum + 1).padStart(3, "0")}`;

    await supabase.from("certificates").insert({
      student_id: event.student_id,
      certificate_type: "subject_completion",
      certificate_number: certNumber,
      title: `${event.metadata.subject_name} Completion`,
      description: `Successfully completed ${event.metadata.subject_name} with an average of ${event.metadata.average_percentage}%`,
      issue_date: new Date().toISOString().split("T")[0],
      issued_by: user?.id,
    });

    await updateEventStatus(event.id, "actioned");
    setUpdating(null);
  };

  // Group by priority
  const filteredEvents =
    filterType === "all"
      ? events
      : events.filter((e) => e.event_type === filterType);

  const urgentEvents = filteredEvents.filter((e) =>
    ["attendance_low", "fee_overdue"].includes(e.event_type),
  );
  const attentionEvents = filteredEvents.filter((e) =>
    ["grade_low", "prayer_missing"].includes(e.event_type),
  );
  const readyEvents = filteredEvents.filter(
    (e) => e.event_type === "certificate_ready",
  );

  const typeCounts = {
    attendance_low: events.filter((e) => e.event_type === "attendance_low")
      .length,
    fee_overdue: events.filter((e) => e.event_type === "fee_overdue").length,
    grade_low: events.filter((e) => e.event_type === "grade_low").length,
    prayer_missing: events.filter((e) => e.event_type === "prayer_missing")
      .length,
    certificate_ready: events.filter(
      (e) => e.event_type === "certificate_ready",
    ).length,
  };

  const renderEvent = (event: StudentEvent) => {
    const config = EVENT_CONFIG[event.event_type as keyof typeof EVENT_CONFIG];
    if (!config) return null;
    const Icon = config.icon;
    const isUpdating = updating === event.id;
    const isShowingWhatsApp = showWhatsApp === event.id;
    const isCertificate = event.event_type === "certificate_ready";

    return (
      <div
        key={event.id}
        className={`border rounded-lg overflow-hidden ${config.border}`}
      >
        {/* Event Header */}
        <div className={`flex items-start justify-between p-4 ${config.bg}`}>
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">
                  {event.students?.first_name} {event.students?.last_name}
                </p>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}
                >
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.students?.student_number} ·{" "}
                {event.students?.classes?.name || "No class"} ·{" "}
                {event.students?.parent_name}
              </p>
              <p className="text-sm font-medium mt-1">
                {getEventSummary(event)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(event.triggered_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                {isCertificate ? (
                  <button
                    onClick={() => handleIssueCertificate(event)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                  >
                    <Award className="h-3 w-3" />
                    Issue Certificate
                  </button>
                ) : (
                  <button
                    onClick={() => handleWhatsAppClick(event)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                  >
                    <MessageSquare className="h-3 w-3" />
                    WhatsApp
                  </button>
                )}
                <button
                  onClick={() => updateEventStatus(event.id, "dismissed")}
                  title="Dismiss"
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* WhatsApp Message Panel */}
        {isShowingWhatsApp && (
          <div className="p-4 border-t border-border bg-card">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Pre-filled message — edit if needed then send:
            </p>
            <textarea
              value={whatsAppMsg}
              onChange={(e) => setWhatsAppMsg(e.target.value)}
              className="w-full h-32 p-3 text-xs bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                📱 {event.students?.parent_phone}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowWhatsApp(null)}
                  className="px-3 py-1.5 text-xs btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyMessage}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-slate-600 text-white hover:bg-slate-700"
                  }`}
                >
                  {copied ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <MessageSquare className="h-3 w-3" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => handleSendWhatsApp(event)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                >
                  <MessageSquare className="h-3 w-3" />
                  Open WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    // Compact widget for dashboard
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Alerts
            {events.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                {events.length}
              </span>
            )}
          </h3>
          <a href="/alerts" className="text-xs text-primary hover:underline">
            View all →
          </a>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active alerts ✓
          </p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 5).map((event) => {
              const config =
                EVENT_CONFIG[event.event_type as keyof typeof EVENT_CONFIG];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
                    <div>
                      <p className="text-xs font-medium">
                        {event.students?.first_name} {event.students?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getEventSummary(event)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${config.badge}`}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
            {events.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{events.length - 5} more alerts
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full page
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert Centre</h2>
          <p className="text-muted-foreground">
            Review alerts and take action via WhatsApp
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="btn-outline text-sm flex items-center gap-2"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(EVENT_CONFIG).map(([type, config]) => {
          const Icon = config.icon;
          const count = typeCounts[type as keyof typeof typeCounts];
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? "all" : type)}
              className={`p-3 rounded-lg border text-left transition-all ${
                filterType === type
                  ? `${config.bg} ${config.border}`
                  : "bg-card border-border hover:bg-accent"
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${config.color}`} />
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </button>
          );
        })}
      </div>

      {events.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium">All clear!</p>
          <p className="text-muted-foreground text-sm mt-1">
            No active alerts at the moment
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Urgent */}
          {urgentEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                Urgent ({urgentEvents.length})
              </h3>
              <div className="space-y-3">{urgentEvents.map(renderEvent)}</div>
            </div>
          )}

          {/* Attention */}
          {attentionEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-2 w-2 bg-yellow-500 rounded-full" />
                Needs Attention ({attentionEvents.length})
              </h3>
              <div className="space-y-3">
                {attentionEvents.map(renderEvent)}
              </div>
            </div>
          )}

          {/* Certificate Ready */}
          {readyEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-2 w-2 bg-green-500 rounded-full" />
                Ready to Action ({readyEvents.length})
              </h3>
              <div className="space-y-3">{readyEvents.map(renderEvent)}</div>
            </div>
          )}
        </div>
      )}

      {/* Actioned/Dismissed History */}
      {actionedEvents.length > 0 && (
        <div>
          <button
            onClick={() => setShowActioned(!showActioned)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {showActioned ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Recent Actions ({actionedEvents.length})
          </button>

          {showActioned && (
            <div className="mt-3 space-y-2">
              {actionedEvents.map((event) => {
                const config =
                  EVENT_CONFIG[event.event_type as keyof typeof EVENT_CONFIG];
                if (!config) return null;
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border opacity-60"
                  >
                    <div>
                      <p className="text-sm">
                        {event.students?.first_name} {event.students?.last_name}
                        {" — "}
                        {getEventSummary(event)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.status === "actioned"
                          ? "✓ Actioned"
                          : "✗ Dismissed"}{" "}
                        {event.actioned_at &&
                          new Date(event.actioned_at).toLocaleDateString(
                            "en-GB",
                          )}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${config.badge}`}
                    >
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
