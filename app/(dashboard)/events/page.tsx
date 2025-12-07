"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: "holiday" | "exam" | "meeting" | "celebration" | "general";
  show_to_all: boolean;
  visible_to_parents: boolean;
  created_at: string;
  classes?: {
    name: string;
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userRole, setUserRole] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    end_time: "",
    location: "",
    event_type: "general" as Event["event_type"],
    show_to_all: true,
    visible_to_parents: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvents();
    loadUserRole();
  }, []);

  async function loadUserRole() {
    try {
      const supabase = createClient();
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
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  }

  async function loadEvents() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          classes (name)
        `
        )
        .order("event_date", { ascending: true })
        .gte("event_date", new Date().toISOString().split("T")[0]);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
      alert("Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title || !formData.event_date) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("events").insert({
        ...formData,
        created_by: user.id,
      });

      if (error) throw error;

      alert("Event created successfully!");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        end_time: "",
        location: "",
        event_type: "general",
        show_to_all: true,
        visible_to_parents: true,
      });
      loadEvents();
    } catch (error: any) {
      console.error("Error creating event:", error);
      alert(error.message || "Failed to create event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      alert("Event deleted successfully");
      loadEvents();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      alert(error.message || "Failed to delete event");
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function getEventTypeColor(type: Event["event_type"]) {
    const colors = {
      holiday: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100",
      exam: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100",
      meeting: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100",
      celebration:
        "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
      general: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100",
    };
    return colors[type];
  }

  const canCreateEvent = ["super_admin", "admin", "teacher"].includes(userRole);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Events Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              Upcoming school events and activities
            </p>
          </div>
          {canCreateEvent && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {showForm ? "Cancel" : "+ Create Event"}
            </button>
          )}
        </div>

        {/* Create Event Form */}
        {showForm && (
          <div className="mb-6 p-6 border border-input rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="Event title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Event Type
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event_type: e.target.value as Event["event_type"],
                      })
                    }
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  >
                    <option value="general">General</option>
                    <option value="holiday">Holiday</option>
                    <option value="exam">Exam</option>
                    <option value="meeting">Meeting</option>
                    <option value="celebration">Celebration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={formData.event_time}
                      onChange={(e) =>
                        setFormData({ ...formData, event_time: e.target.value })
                      }
                      className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      placeholder="Start"
                    />
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      placeholder="End"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="Event location..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
                    placeholder="Event description..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.visible_to_parents}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          visible_to_parents: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Visible to parents</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Creating..." : "Create Event"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-input rounded-lg font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No upcoming events
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-6 border border-input rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getEventTypeColor(
                          event.event_type
                        )}`}
                      >
                        {event.event_type.charAt(0).toUpperCase() +
                          event.event_type.slice(1)}
                      </span>
                      {event.classes && (
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                          {event.classes.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-1">
                      {event.title}
                    </h3>
                    <div className="text-sm text-muted-foreground mb-2">
                      📅 {formatDate(event.event_date)}
                      {event.event_time && ` • 🕐 ${event.event_time}`}
                      {event.end_time && ` - ${event.end_time}`}
                      {event.location && ` • 📍 ${event.location}`}
                    </div>
                    {event.description && (
                      <p className="text-muted-foreground mt-2">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {canCreateEvent && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Delete
                    </button>
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
