// components/reports/EventAttendanceReport.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Calendar, Users } from "lucide-react";

export default function EventAttendanceReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  const supabase = createClient();

  // Load events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date, event_time")
        .order("event_date", { ascending: false })
        .limit(50);
      setEvents(data || []);
    };
    fetchEvents();
  }, []);

  const generateReport = async () => {
    if (!selectedEvent) {
      alert("Please select an event");
      return;
    }

    setLoading(true);
    try {
      // Get event details
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", selectedEvent)
        .single();

      if (eventError) throw eventError;

      // Get RSVPs
      const { data: rsvps, error: rsvpError } = await supabase
        .from("event_rsvps")
        .select(
          `
          *,
          students (
            first_name,
            last_name,
            student_number
          )
        `
        )
        .eq("event_id", selectedEvent);

      if (rsvpError) throw rsvpError;

      // Calculate RSVP stats
      const totalRSVPs = rsvps?.length || 0;
      const attending =
        rsvps?.filter((r) => r.status === "attending").length || 0;
      const notAttending =
        rsvps?.filter((r) => r.status === "not_attending").length || 0;
      const pending = rsvps?.filter((r) => r.status === "pending").length || 0;

      // Calculate attendance type breakdown
      const attendanceTypes = {
        adultsOnly:
          rsvps?.filter((r) => r.attendance_type === "adults_only").length || 0,
        family:
          rsvps?.filter((r) => r.attendance_type === "family").length || 0,
        studentsOnly:
          rsvps?.filter((r) => r.attendance_type === "students_only").length ||
          0,
      };

      // Calculate age breakdown (for family RSVPs)
      const familyRSVPs =
        rsvps?.filter((r) => r.attendance_type === "family") || [];
      const ageBreakdown = {
        under5: familyRSVPs.reduce((sum, r) => sum + (r.age_under_5 || 0), 0),
        age5to12: familyRSVPs.reduce((sum, r) => sum + (r.age_5_to_12 || 0), 0),
        age13to17: familyRSVPs.reduce(
          (sum, r) => sum + (r.age_13_to_17 || 0),
          0
        ),
        adults: familyRSVPs.reduce((sum, r) => sum + (r.adults || 0), 0),
      };

      const totalExpectedAttendees =
        ageBreakdown.under5 +
        ageBreakdown.age5to12 +
        ageBreakdown.age13to17 +
        ageBreakdown.adults +
        attendanceTypes.adultsOnly +
        attendanceTypes.studentsOnly;

      // Calculate capacity utilization
      const capacityUtilization = event.max_capacity
        ? Math.round((totalExpectedAttendees / event.max_capacity) * 100)
        : 0;

      setReportData({
        event,
        rsvps: rsvps || [],
        summary: {
          totalRSVPs,
          attending,
          notAttending,
          pending,
          attendanceTypes,
          ageBreakdown,
          totalExpectedAttendees,
          capacityUtilization,
        },
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = [
      "Student Name",
      "Student Number",
      "RSVP Status",
      "Attendance Type",
      "Under 5",
      "Age 5-12",
      "Age 13-17",
      "Adults",
      "Notes",
      "RSVP Date",
    ];

    const rows = reportData.rsvps.map((rsvp: any) => [
      `${rsvp.students?.first_name || ""} ${rsvp.students?.last_name || ""}`,
      rsvp.students?.student_number || "",
      rsvp.status,
      rsvp.attendance_type,
      rsvp.age_under_5 || 0,
      rsvp.age_5_to_12 || 0,
      rsvp.age_13_to_17 || 0,
      rsvp.adults || 0,
      rsvp.notes || "",
      new Date(rsvp.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-attendance-report-${reportData.event.title.replace(
      /\s+/g,
      "-"
    )}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Event Selection */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="">Choose an event...</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} -{" "}
                  {new Date(event.event_date).toLocaleDateString()}
                  {event.event_time && ` at ${event.event_time}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={generateReport}
            disabled={loading || !selectedEvent}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>

          {reportData && (
            <button
              onClick={exportToCSV}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Event Details */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">{reportData.event.title}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {new Date(reportData.event.event_date).toLocaleDateString(
                    "en-GB",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
              {reportData.event.event_time && (
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-semibold">{reportData.event.event_time}</p>
                </div>
              )}
              {reportData.event.location && (
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-semibold">{reportData.event.location}</p>
                </div>
              )}
              {reportData.event.max_capacity && (
                <div>
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-semibold">
                    {reportData.summary.totalExpectedAttendees} /{" "}
                    {reportData.event.max_capacity} (
                    {reportData.summary.capacityUtilization}%)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RSVP Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Total RSVPs</p>
              <p className="text-2xl font-bold">
                {reportData.summary.totalRSVPs}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                Attending
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reportData.summary.attending}
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300 mb-1">
                Not Attending
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {reportData.summary.notAttending}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {reportData.summary.pending}
              </p>
            </div>
          </div>

          {/* Attendance Type Breakdown */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Attendance Type Breakdown</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                  Adults Only
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData.summary.attendanceTypes.adultsOnly}
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                  Family
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {reportData.summary.attendanceTypes.family}
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                  Students Only
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {reportData.summary.attendanceTypes.studentsOnly}
                </p>
              </div>
            </div>
          </div>

          {/* Age Breakdown */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">
              Age Breakdown (Expected Attendees)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Under 5</p>
                <p className="text-2xl font-bold">
                  {reportData.summary.ageBreakdown.under5}
                </p>
              </div>

              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Age 5-12</p>
                <p className="text-2xl font-bold">
                  {reportData.summary.ageBreakdown.age5to12}
                </p>
              </div>

              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Age 13-17</p>
                <p className="text-2xl font-bold">
                  {reportData.summary.ageBreakdown.age13to17}
                </p>
              </div>

              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Adults</p>
                <p className="text-2xl font-bold">
                  {reportData.summary.ageBreakdown.adults}
                </p>
              </div>
            </div>

            <div className="mt-4 text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Total Expected Attendees
              </p>
              <p className="text-3xl font-bold text-primary">
                {reportData.summary.totalExpectedAttendees}
              </p>
            </div>
          </div>

          {/* RSVP List */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">RSVP Details</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Student</th>
                    <th className="text-center p-3">Status</th>
                    <th className="text-center p-3">Type</th>
                    <th className="text-center p-3">Under 5</th>
                    <th className="text-center p-3">5-12</th>
                    <th className="text-center p-3">13-17</th>
                    <th className="text-center p-3">Adults</th>
                    <th className="text-left p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.rsvps.map((rsvp: any) => (
                    <tr key={rsvp.id} className="hover:bg-accent">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">
                            {rsvp.students?.first_name}{" "}
                            {rsvp.students?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            #{rsvp.students?.student_number}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            rsvp.status === "attending"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : rsvp.status === "not_attending"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                          }`}
                        >
                          {rsvp.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-center capitalize text-xs">
                        {rsvp.attendance_type.replace("_", " ")}
                      </td>
                      <td className="p-3 text-center">
                        {rsvp.age_under_5 || 0}
                      </td>
                      <td className="p-3 text-center">
                        {rsvp.age_5_to_12 || 0}
                      </td>
                      <td className="p-3 text-center">
                        {rsvp.age_13_to_17 || 0}
                      </td>
                      <td className="p-3 text-center">{rsvp.adults || 0}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {rsvp.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
