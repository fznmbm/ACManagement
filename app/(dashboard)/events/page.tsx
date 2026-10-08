"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  MessageSquare,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import EventRSVPManagement from "@/components/events/EventRSVPManagement";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: "holiday" | "exam" | "meeting" | "celebration" | "general";
  priority: "normal" | "urgent" | "critical";
  show_to_all: boolean;
  class_id?: string | null;
  visible_to_parents: boolean;
  rsvp_required: boolean;
  rsvp_deadline: string | null;
  created_at: string;
  classes?: { name: string } | null;
}

interface Class {
  id: string;
  name: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  holiday: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  exam: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  meeting: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  celebration:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  general: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
};

const BLANK = {
  title: "",
  description: "",
  event_date: "",
  event_time: "",
  end_time: "",
  location: "",
  event_type: "general" as Event["event_type"],
  priority: "normal" as Event["priority"],
  show_to_all: true,
  class_id: "",
  visible_to_parents: true,
  rsvp_required: false,
  rsvp_deadline: "",
  notify_parents: false,
};

export default function EventsPage() {
  const supabase = createClient();
  const { toast, confirm } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState<string | null>(null);
  const [whatsAppMsg, setWhatsAppMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({ ...BLANK });

  useEffect(() => {
    loadUserRole();
    loadEvents();
    loadClasses();
  }, []);

  async function loadUserRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data) setUserRole(data.role);
    }
  }

  async function loadEvents() {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*, classes(name)")
      .order("event_date", { ascending: true });
    setEvents(data || []);
    setLoading(false);
  }

  async function loadClasses() {
    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setClasses(data || []);
  }

  function openCreate() {
    setEditingId(null);
    setFormData({ ...BLANK });
    setShowForm(true);
  }

  function openEdit(event: Event) {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date,
      event_time: event.event_time || "",
      end_time: event.end_time || "",
      location: event.location || "",
      event_type: event.event_type,
      priority: event.priority,
      show_to_all: event.show_to_all,
      class_id: event.class_id || "",
      visible_to_parents: event.visible_to_parents,
      rsvp_required: event.rsvp_required,
      rsvp_deadline: event.rsvp_deadline || "",
      notify_parents: false,
    });
    setShowForm(true);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Post an "event" notice to linked parents (school-wide or the event's class).
  async function notifyParentsOfEvent(event: Event): Promise<number> {
    let q = supabase.from("students").select("id").eq("status", "active");
    if (!event.show_to_all && event.class_id)
      q = q.eq("class_id", event.class_id);
    const { data: studs } = await q;
    if (!studs || studs.length === 0) return 0;

    const { data: links } = await supabase
      .from("parent_student_links")
      .select("parent_user_id, student_id")
      .in(
        "student_id",
        studs.map((s) => s.id),
      )
      .neq("can_receive_notifications", false);
    if (!links || links.length === 0) return 0;

    const dateStr = new Date(event.event_date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const message =
      `${dateStr}` +
      (event.event_time ? ` at ${event.event_time}` : "") +
      (event.location ? ` · ${event.location}` : "") +
      (event.description ? `\n${event.description}` : "");

    await supabase.from("parent_notifications").insert(
      links.map((l) => ({
        parent_user_id: l.parent_user_id,
        student_id: l.student_id,
        type: "event",
        priority: event.priority === "normal" ? "normal" : "urgent",
        title: event.title,
        message,
        is_read: false,
      })),
    );
    return links.length;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.event_date) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        end_time: formData.end_time || null,
        location: formData.location || null,
        event_type: formData.event_type,
        priority: formData.priority,
        show_to_all: formData.show_to_all,
        visible_to_parents: formData.visible_to_parents,
        rsvp_required: formData.rsvp_required,
        rsvp_deadline:
          formData.rsvp_required && formData.rsvp_deadline
            ? formData.rsvp_deadline
            : null,
        rsvp_type: "family",
        class_id:
          !formData.show_to_all && formData.class_id
            ? formData.class_id
            : null,
      };

      let saved: Event;
      if (editingId) {
        const { data, error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single();
        if (error) throw error;
        saved = data;
      } else {
        payload.created_by = user?.id;
        const { data, error } = await supabase
          .from("events")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        saved = data;
      }

      let notified = 0;
      if (formData.notify_parents && formData.visible_to_parents) {
        notified = await notifyParentsOfEvent(saved);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...BLANK });
      await loadEvents();

      toast.success(
        editingId
          ? `Event updated${notified ? ` · ${notified} parent${notified === 1 ? "" : "s"} notified` : ""}`
          : `Event created${notified ? ` · ${notified} parent${notified === 1 ? "" : "s"} notified` : ""}`,
      );

      // Offer the WhatsApp copy for the saved event.
      generateWhatsAppMessage(saved);
      setShowWhatsApp(saved.id);
      setCopied(false);
    } catch (err: any) {
      toast.error(err.message || "Couldn't save the event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Delete this event?",
      message: "This removes the event for everyone. It can't be undone.",
      destructive: true,
      confirmText: "Delete event",
    });
    if (!ok) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete the event.");
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Event deleted");
  }

  function generateWhatsAppMessage(event: Event) {
    const dateStr = new Date(event.event_date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    let msg = `🕌 *Al Hikmah Institute Crawley*\n\n`;
    if (event.priority === "urgent") msg += `⚠️ *URGENT*\n\n`;
    if (event.priority === "critical") msg += `🚨 *IMPORTANT*\n\n`;
    msg += `📢 *${event.title}*\n`;
    msg += `📅 ${dateStr}\n`;
    if (event.event_time) {
      msg += `🕐 ${event.event_time}`;
      if (event.end_time) msg += ` – ${event.end_time}`;
      msg += `\n`;
    }
    if (event.location) msg += `📍 ${event.location}\n`;
    if (event.description) msg += `\n${event.description}\n`;
    if (event.rsvp_required) {
      msg += `\n📝 *RSVP required`;
      if (event.rsvp_deadline) {
        const deadline = new Date(event.rsvp_deadline).toLocaleDateString(
          "en-GB",
          { day: "numeric", month: "short", year: "numeric" },
        );
        msg += ` by ${deadline}`;
      }
      msg += `*\nPlease confirm attendance on the parent portal.`;
    }
    msg += `\n\nJazakAllah Khair`;
    setWhatsAppMsg(msg);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const canManage = ["super_admin", "admin", "teacher"].includes(userRole);
  const todayStr = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => e.event_date >= todayStr);
  const past = events.filter((e) => e.event_date < todayStr).reverse();

  const renderEvent = (event: Event) => (
    <div
      key={event.id}
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_COLORS[event.event_type]}`}
              >
                {event.event_type.charAt(0).toUpperCase() +
                  event.event_type.slice(1)}
              </span>
              {event.priority !== "normal" && (
                <span className="text-xs font-medium text-orange-600">
                  {event.priority === "urgent" ? "⚠️ Urgent" : "🚨 Critical"}
                </span>
              )}
              {event.rsvp_required && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  RSVP required
                </span>
              )}
              {!event.show_to_all && event.classes && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {event.classes.name}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold">{event.title}</h3>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(event.event_date)}
              </span>
              {event.event_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {event.event_time}
                  {event.end_time ? ` – ${event.end_time}` : ""}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </span>
              )}
            </div>
            {event.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {event.description}
              </p>
            )}
          </div>

          {canManage && (
            <div className="flex shrink-0 items-center gap-1">
              {event.rsvp_required && (
                <button
                  onClick={() =>
                    setSelectedEventId(
                      selectedEventId === event.id ? null : event.id,
                    )
                  }
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1.5 text-xs text-white hover:bg-blue-700"
                >
                  <Users className="h-3 w-3" />
                  RSVPs
                  {selectedEventId === event.id ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  generateWhatsAppMessage(event);
                  setShowWhatsApp(showWhatsApp === event.id ? null : event.id);
                  setCopied(false);
                }}
                className="flex items-center gap-1 rounded-lg bg-green-600 px-2 py-1.5 text-xs text-white hover:bg-green-700"
              >
                <MessageSquare className="h-3 w-3" />
                WhatsApp
              </button>
              <button
                onClick={() => openEdit(event)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Edit event"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(event.id)}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete event"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showWhatsApp === event.id && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Copy and paste into the WhatsApp group:
          </p>
          <textarea
            value={whatsAppMsg}
            onChange={(e) => setWhatsAppMsg(e.target.value)}
            rows={8}
            className="w-full resize-none rounded-lg border border-border bg-muted p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(whatsAppMsg);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>
        </div>
      )}

      {selectedEventId === event.id && (
        <div className="border-t border-border">
          <EventRSVPManagement eventId={event.id} eventTitle={event.title} />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-muted-foreground">
            School events and activities
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => (showForm ? setShowForm(false) : openCreate())}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create event
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {editingId ? "Edit event" : "New event"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="form-input"
                  placeholder="e.g. End of Term Party"
                />
              </div>

              <div>
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Event type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      event_type: e.target.value as any,
                    })
                  }
                  className="form-input"
                >
                  <option value="general">General</option>
                  <option value="holiday">Holiday</option>
                  <option value="exam">Exam</option>
                  <option value="meeting">Meeting</option>
                  <option value="celebration">Celebration</option>
                </select>
              </div>

              <div>
                <label className="form-label">Start time</label>
                <input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) =>
                    setFormData({ ...formData, event_time: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">End time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="form-input"
                  placeholder="e.g. Al Hikmah Institute Hall"
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="form-input"
                  placeholder="Event details…"
                />
              </div>

              <div>
                <label className="form-label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as any })
                  }
                  className="form-input"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent ⚠️</option>
                  <option value="critical">Critical 🚨</option>
                </select>
              </div>

              <div className="flex flex-col justify-end gap-3 pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.show_to_all}
                    onChange={(e) =>
                      setFormData({ ...formData, show_to_all: e.target.checked })
                    }
                    className="rounded border-input text-primary"
                  />
                  School-wide event
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.visible_to_parents}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visible_to_parents: e.target.checked,
                      })
                    }
                    className="rounded border-input text-primary"
                  />
                  Visible to parents
                </label>
              </div>

              {!formData.show_to_all && (
                <div>
                  <label className="form-label">Class</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) =>
                      setFormData({ ...formData, class_id: e.target.value })
                    }
                    className="form-input"
                  >
                    <option value="">Select class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notify parents */}
              <div className="md:col-span-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors ${
                    formData.notify_parents && formData.visible_to_parents
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${!formData.visible_to_parents ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={!formData.visible_to_parents}
                    checked={formData.notify_parents}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notify_parents: e.target.checked,
                      })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Also notify parents now
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Posts this event to the portal for{" "}
                      {formData.show_to_all
                        ? "all parents"
                        : "the selected class's parents"}
                      . Requires “Visible to parents”.
                    </span>
                  </span>
                </label>
              </div>

              {/* RSVP */}
              <div className="border-t pt-4 md:col-span-2">
                <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.rsvp_required}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rsvp_required: e.target.checked,
                      })
                    }
                    className="rounded border-input text-primary"
                  />
                  Require RSVP from parents
                </label>
                {formData.rsvp_required && (
                  <div>
                    <label className="form-label">RSVP deadline</label>
                    <input
                      type="date"
                      value={formData.rsvp_deadline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rsvp_deadline: e.target.value,
                        })
                      }
                      className="form-input"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Create event"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : upcoming.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-3">{upcoming.map(renderEvent)}</div>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {showPast ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showPast ? "Hide" : "Show"} past events ({past.length})
          </button>
          {showPast && (
            <div className="space-y-3 opacity-80">{past.map(renderEvent)}</div>
          )}
        </div>
      )}
    </div>
  );
}
