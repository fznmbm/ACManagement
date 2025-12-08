"use client";

import { useState, useEffect } from "react";

interface EventRSVPConfigProps {
  rsvpRequired: boolean;
  rsvpType: "none" | "adults_only" | "family" | "students_only";
  collectAgeBreakdown: boolean;
  rsvpDeadline: string;
  maxCapacity: number;
  eventType: "holiday" | "exam" | "meeting" | "celebration" | "general";
  onChange: (config: {
    rsvp_required: boolean;
    rsvp_type: string;
    rsvp_collect_age_breakdown: boolean;
    rsvp_deadline: string;
    max_capacity: number;
  }) => void;
}

export default function EventRSVPConfig({
  rsvpRequired,
  rsvpType,
  collectAgeBreakdown,
  rsvpDeadline,
  maxCapacity,
  eventType,
  onChange,
}: EventRSVPConfigProps) {
  const [localRequired, setLocalRequired] = useState(rsvpRequired);
  const [localType, setLocalType] = useState(rsvpType);
  const [localCollectAge, setLocalCollectAge] = useState(collectAgeBreakdown);
  const [localDeadline, setLocalDeadline] = useState(rsvpDeadline);
  const [localCapacity, setLocalCapacity] = useState(maxCapacity);

  // Smart defaults based on event type
  useEffect(() => {
    if (!localRequired) return; // Only apply if RSVP is required

    const defaults = {
      exam: { type: "none" as const, required: false },
      holiday: { type: "none" as const, required: false },
      meeting: { type: "adults_only" as const, required: true },
      celebration: { type: "family" as const, required: true },
      general: { type: "none" as const, required: false },
    };

    const suggestion = defaults[eventType];
    if (suggestion && localType === "none") {
      setLocalType(suggestion.type);
    }
  }, [eventType, localRequired, localType]);

  // Notify parent component of changes
  useEffect(() => {
    onChange({
      rsvp_required: localRequired,
      rsvp_type: localType,
      rsvp_collect_age_breakdown: localCollectAge,
      rsvp_deadline: localDeadline,
      max_capacity: localCapacity,
    });
  }, [
    localRequired,
    localType,
    localCollectAge,
    localDeadline,
    localCapacity,
    onChange,
  ]);

  return (
    <div className="space-y-4 p-4 border border-input rounded-lg bg-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-lg font-semibold">RSVP Settings</div>
        <div className="text-sm text-muted-foreground">(Optional)</div>
      </div>

      {/* Enable RSVP Checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="rsvp_required"
          checked={localRequired}
          onChange={(e) => {
            setLocalRequired(e.target.checked);
            if (!e.target.checked) {
              setLocalType("none");
              setLocalCollectAge(false);
            }
          }}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <div>
          <label htmlFor="rsvp_required" className="font-medium cursor-pointer">
            Require RSVP for this event
          </label>
          <p className="text-sm text-muted-foreground">
            Parents will be asked to confirm attendance
          </p>
        </div>
      </div>

      {/* RSVP Type Selection */}
      {localRequired && (
        <div className="space-y-4 pl-7 pt-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              Who can attend? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {/* Adults Only */}
              <label className="flex items-start gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="radio"
                  name="rsvp_type"
                  value="adults_only"
                  checked={localType === "adults_only"}
                  onChange={(e) => {
                    setLocalType(e.target.value as any);
                    setLocalCollectAge(false);
                  }}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Adults Only</div>
                  <div className="text-sm text-muted-foreground">
                    Parent-teacher meetings, staff training, adult workshops
                  </div>
                </div>
              </label>

              {/* Whole Family */}
              <label className="flex items-start gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="radio"
                  name="rsvp_type"
                  value="family"
                  checked={localType === "family"}
                  onChange={(e) => {
                    setLocalType(e.target.value as any);
                  }}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Whole Family</div>
                  <div className="text-sm text-muted-foreground">
                    Celebrations, sports day, open house events
                  </div>
                </div>
              </label>

              {/* Students Only */}
              <label className="flex items-start gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="radio"
                  name="rsvp_type"
                  value="students_only"
                  checked={localType === "students_only"}
                  onChange={(e) => {
                    setLocalType(e.target.value as any);
                    setLocalCollectAge(false);
                  }}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Students Only</div>
                  <div className="text-sm text-muted-foreground">
                    Field trips, competitions, student-only activities
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Age Breakdown Toggle (only for family events) */}
          {localType === "family" && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <input
                type="checkbox"
                id="collect_age_breakdown"
                checked={localCollectAge}
                onChange={(e) => setLocalCollectAge(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <label
                  htmlFor="collect_age_breakdown"
                  className="font-medium cursor-pointer"
                >
                  Collect age breakdown for catering
                </label>
                <p className="text-sm text-muted-foreground">
                  Ask parents to specify: adults, children under 12, children
                  under 5
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  💡 Useful for events with food/refreshments
                </p>
              </div>
            </div>
          )}

          {/* RSVP Deadline */}
          <div>
            <label
              htmlFor="rsvp_deadline"
              className="block text-sm font-medium mb-2"
            >
              RSVP Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              id="rsvp_deadline"
              value={localDeadline}
              onChange={(e) => setLocalDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Last date for parents to respond
            </p>
          </div>

          {/* Max Capacity */}
          <div>
            <label
              htmlFor="max_capacity"
              className="block text-sm font-medium mb-2"
            >
              Maximum Capacity (Optional)
            </label>
            <input
              type="number"
              id="max_capacity"
              value={localCapacity || ""}
              onChange={(e) => setLocalCapacity(parseInt(e.target.value) || 0)}
              min="0"
              placeholder="e.g. 100"
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {localType === "family"
                ? "Maximum number of families"
                : localType === "adults_only"
                ? "Maximum number of adults"
                : "Maximum number of students"}
            </p>
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-muted rounded-lg border border-border">
            <div className="text-sm font-medium mb-2">
              RSVP Configuration Summary:
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                ✓ Parents will be asked to RSVP as:{" "}
                <span className="font-medium text-foreground">
                  {localType === "adults_only" && "Adults Only"}
                  {localType === "family" && "Whole Family"}
                  {localType === "students_only" && "Students Only"}
                </span>
              </li>
              {localType === "family" && localCollectAge && (
                <li>✓ Age breakdown will be collected for catering</li>
              )}
              {localDeadline && (
                <li>
                  ✓ RSVP deadline:{" "}
                  {new Date(localDeadline).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </li>
              )}
              {localCapacity > 0 && <li>✓ Max capacity: {localCapacity}</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Suggestion based on event type */}
      {!localRequired && eventType && (
        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
          💡 Suggestion: For <span className="font-medium">{eventType}</span>{" "}
          events,{" "}
          {eventType === "meeting" && "consider enabling RSVP (adults only)"}
          {eventType === "celebration" &&
            "consider enabling RSVP (whole family)"}
          {(eventType === "exam" || eventType === "holiday") &&
            "RSVP is typically not needed"}
          {eventType === "general" &&
            "decide if RSVP is needed based on the event"}
        </div>
      )}
    </div>
  );
}
