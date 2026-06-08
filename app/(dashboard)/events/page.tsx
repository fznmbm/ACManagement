"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
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

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState<string | null>(null);
  const [whatsAppMsg, setWhatsAppMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
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
  });

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
      .order("event_date", { ascending: true })
      .gte("event_date", new Date().toISOString().split("T")[0]);
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
        created_by: user?.id,
        rsvp_required: formData.rsvp_required,
        rsvp_deadline:
          formData.rsvp_required && formData.rsvp_deadline
            ? formData.rsvp_deadline
            : null,
        rsvp_type: "family",
      };
      if (!formData.show_to_all && formData.class_id) {
        payload.class_id = formData.class_id;
      }
      const { data: newEvent, error } = await supabase
        .from("events")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        end_time: "",
        location: "",
        event_type: "general",
        priority: "normal",
        show_to_all: true,
        class_id: "",
        visible_to_parents: true,
        rsvp_required: false,
        rsvp_deadline: "",
      });
      loadEvents();
      // Auto-show WhatsApp
      generateWhatsAppMessage(newEvent);
      setShowWhatsApp(newEvent.id);
    } catch (err: any) {
      alert(err.message || "Failed to create event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    await supabase.from("events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
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
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-muted-foreground">
            Upcoming school events and activities
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Create Event Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">New Event</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="form-label">Event Type</label>
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
                <label className="form-label">Start Time</label>
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
                <label className="form-label">End Time</label>
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
                  placeholder="Event details..."
                />
              </div>

              <div>
                <label className="form-label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as any,
                    })
                  }
                  className="form-input"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent ⚠️</option>
                  <option value="critical">Critical 🚨</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 justify-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.show_to_all}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        show_to_all: e.target.checked,
                      })
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

              {/* RSVP */}
              <div className="md:col-span-2 border-t pt-4">
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
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
                    <label className="form-label">RSVP Deadline</label>
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

            <div className="flex gap-3 pt-2 border-t">
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
                {saving ? "Creating..." : "Create Event"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              {/* Event Row */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${EVENT_TYPE_COLORS[event.event_type]}`}
                      >
                        {event.event_type.charAt(0).toUpperCase() +
                          event.event_type.slice(1)}
                      </span>
                      {event.priority !== "normal" && (
                        <span className="text-xs font-medium text-orange-600">
                          {event.priority === "urgent"
                            ? "⚠️ Urgent"
                            : "🚨 Critical"}
                        </span>
                      )}
                      {event.rsvp_required && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                          RSVP Required
                        </span>
                      )}
                      {!event.show_to_all && event.classes && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                          {event.classes.name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-base">{event.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      {event.rsvp_required && (
                        <button
                          onClick={() =>
                            setSelectedEventId(
                              selectedEventId === event.id ? null : event.id,
                            )
                          }
                          className="flex items-center gap-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                          setShowWhatsApp(
                            showWhatsApp === event.id ? null : event.id,
                          );
                          setCopied(false);
                        }}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <MessageSquare className="h-3 w-3" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* WhatsApp Panel */}
              {showWhatsApp === event.id && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Copy and paste into WhatsApp group:
                  </p>
                  <textarea
                    value={whatsAppMsg}
                    onChange={(e) => setWhatsAppMsg(e.target.value)}
                    rows={8}
                    className="w-full p-3 text-xs font-mono bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(whatsAppMsg);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 3000);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </button>
                  </div>
                </div>
              )}

              {/* RSVP Management Panel */}
              {selectedEventId === event.id && (
                <div className="border-t border-border">
                  <EventRSVPManagement
                    eventId={event.id}
                    eventTitle={event.title}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
