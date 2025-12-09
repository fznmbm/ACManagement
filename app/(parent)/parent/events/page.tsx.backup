"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Clock, MapPin, AlertCircle } from "lucide-react";

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
        .order("priority", { ascending: false }) // Critical first
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

  function getPriorityDisplay(priority: Event["priority"]) {
    if (priority === "critical") {
      return {
        badge: (
          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-full text-xs font-bold">
            <AlertCircle className="h-3 w-3" />
            <span>🚨 URGENT</span>
          </div>
        ),
        border: "border-red-500 dark:border-red-400",
        glow: "shadow-lg shadow-red-500/20",
      };
    } else if (priority === "urgent") {
      return {
        badge: (
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 rounded-full text-xs font-semibold">
            <AlertCircle className="h-3 w-3" />
            <span>⚠️ Important</span>
          </div>
        ),
        border: "border-orange-400 dark:border-orange-500",
        glow: "shadow-md shadow-orange-500/10",
      };
    }
    return {
      badge: null,
      border: "border-input",
      glow: "",
    };
  }

  function getRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 14) return "Next week";
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
    return `In ${Math.floor(diffDays / 30)} months`;
  }

  // Separate events by priority
  const criticalEvents = events.filter((e) => e.priority === "critical");
  const urgentEvents = events.filter((e) => e.priority === "urgent");
  const normalEvents = events.filter((e) => e.priority === "normal");

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

        {/* Loading State */}
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
          <div className="space-y-6">
            {/* Critical Events Section */}
            {criticalEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                    Critical Events - Requires Immediate Attention
                  </h2>
                </div>
                <div className="space-y-4">
                  {criticalEvents.map((event) => {
                    const priorityInfo = getPriorityDisplay(event.priority);
                    return (
                      <div
                        key={event.id}
                        className={`p-6 border-2 ${priorityInfo.border} ${priorityInfo.glow} rounded-lg bg-card transition-all hover:scale-[1.01]`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">
                            {getEventTypeIcon(event.event_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {priorityInfo.badge}
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
                              <span className="px-3 py-1 text-xs rounded-full bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 font-medium">
                                {getRelativeTime(event.event_date)}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                              {event.title}
                            </h3>
                            <div className="space-y-1 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">
                                  {formatDate(event.event_date)}
                                </span>
                              </div>
                              {event.event_time && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {event.event_time}
                                    {event.end_time && ` - ${event.end_time}`}
                                  </span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-foreground bg-muted/30 p-3 rounded-md">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Urgent Events Section */}
            {urgentEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <h2 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    Important Events
                  </h2>
                </div>
                <div className="space-y-4">
                  {urgentEvents.map((event) => {
                    const priorityInfo = getPriorityDisplay(event.priority);
                    return (
                      <div
                        key={event.id}
                        className={`p-6 border-2 ${priorityInfo.border} ${priorityInfo.glow} rounded-lg bg-card hover:shadow-lg transition-all`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">
                            {getEventTypeIcon(event.event_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {priorityInfo.badge}
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
                              <span className="px-3 py-1 text-xs rounded-full bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-medium">
                                {getRelativeTime(event.event_date)}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                              {event.title}
                            </h3>
                            <div className="space-y-1 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(event.event_date)}</span>
                              </div>
                              {event.event_time && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {event.event_time}
                                    {event.end_time && ` - ${event.end_time}`}
                                  </span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Normal Events Section */}
            {normalEvents.length > 0 && (
              <div>
                {(criticalEvents.length > 0 || urgentEvents.length > 0) && (
                  <h2 className="text-lg font-semibold mb-3">Other Events</h2>
                )}
                <div className="space-y-4">
                  {normalEvents.map((event) => {
                    const priorityInfo = getPriorityDisplay(event.priority);
                    return (
                      <div
                        key={event.id}
                        className={`p-6 border ${priorityInfo.border} rounded-lg bg-card hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">
                            {getEventTypeIcon(event.event_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                              <span className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                {getRelativeTime(event.event_date)}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                              {event.title}
                            </h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(event.event_date)}</span>
                              </div>
                              {event.event_time && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {event.event_time}
                                    {event.end_time && ` - ${event.end_time}`}
                                  </span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
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
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
