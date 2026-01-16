// components/dashboard/UpcomingEvents.tsx
import { createClient } from "@/lib/supabase/server";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";

export default async function UpcomingEvents() {
  const supabase = await createClient();

  // Get next 5 upcoming events
  const { data: events } = await supabase
    .from("events")
    .select(
      `
      id,
      title,
      event_date,
      event_time,
      location,
      event_type,
      priority,
      rsvp_required,
      max_capacity,
      show_to_all,
      classes (name)
    `
    )
    .gte("event_date", new Date().toISOString().split("T")[0])
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true })
    .limit(5);

  // Get RSVP counts for events with RSVP enabled
  const eventsWithRSVP = events?.filter((e) => e.rsvp_required) || [];
  const rsvpCounts: { [key: string]: number } = {};

  for (const event of eventsWithRSVP) {
    const { count } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("status", "attending");

    rsvpCounts[event.id] = count || 0;
  }

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      holiday: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
      exam: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
      meeting:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      celebration:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      general:
        "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
    };
    return colors[type] || colors.general;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "urgent") return "⚠️";
    if (priority === "critical") return "🚨";
    return "";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upcoming Events</h3>
        <Link href="/events" className="text-sm text-primary hover:underline">
          View All →
        </Link>
      </div>

      {events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => {
            const rsvpCount = rsvpCounts[event.id] || 0;
            const rsvpPercentage = event.max_capacity
              ? Math.round((rsvpCount / event.max_capacity) * 100)
              : 0;

            return (
              <Link
                key={event.id}
                href="/events"
                className="block p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all"
              >
                {/* Event Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${getEventTypeColor(
                          event.event_type
                        )}`}
                      >
                        {event.event_type.charAt(0).toUpperCase() +
                          event.event_type.slice(1)}
                      </span>
                      {event.priority !== "normal" && (
                        <span className="text-sm">
                          {getPriorityBadge(event.priority)}
                        </span>
                      )}
                      {event.show_to_all && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          School-wide
                        </span>
                      )}
                      {event.classes && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {event.classes.name}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold">{event.title}</h4>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {formatDate(event.event_date)}
                  </span>
                </div>

                {/* Event Details */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {event.event_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{event.event_time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>

                {/* RSVP Progress */}
                {event.rsvp_required && event.max_capacity && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>
                          {rsvpCount} / {event.max_capacity} RSVPs
                        </span>
                      </div>
                      <span className="font-medium">{rsvpPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          rsvpPercentage >= 80
                            ? "bg-red-500"
                            : rsvpPercentage >= 50
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${rsvpPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No upcoming events scheduled
          </p>
          <Link
            href="/events"
            className="text-sm text-primary hover:underline mt-2 inline-block"
          >
            Create your first event →
          </Link>
        </div>
      )}
    </div>
  );
}
