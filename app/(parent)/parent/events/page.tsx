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
  classes?: {
    name: string;
  };
}

export default function ParentEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Get all visible events (school-wide and class-specific)
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          classes (name)
        `
        )
        .eq("visible_to_parents", true)
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
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

  function getEventTypeIcon(type: Event["event_type"]) {
    const icons = {
      holiday: "🏖️",
      exam: "📝",
      meeting: "👥",
      celebration: "🎉",
      general: "📅",
    };
    return icons[type];
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

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            School Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            Upcoming events and important dates
          </p>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-6 border border-input rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    {getEventTypeIcon(event.event_type)}
                  </div>
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
                    <h3 className="text-xl font-semibold mb-2">
                      {event.title}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatDate(event.event_date)}</span>
                      </div>
                      {event.event_time && (
                        <div className="flex items-center gap-2">
                          <span>🕐</span>
                          <span>
                            {event.event_time}
                            {event.end_time && ` - ${event.end_time}`}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-3 text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
