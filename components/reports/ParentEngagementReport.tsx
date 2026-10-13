// components/reports/ParentEngagementReport.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, FileText, Loader2, Users, TrendingUp } from "lucide-react";
import { exportTablePDF } from "@/lib/utils/pdfExport";

interface ParentEngagementReportProps {
  classes: Array<{ id: string; name: string }>;
}

type PortalStatus = "active" | "invite_opened" | "not_started";

interface ParentRow {
  parent_id: string;
  name: string;
  email: string;
  students: string;
  classNames: string[];
  portal: PortalStatus;
  notif_total: number;
  notif_read: number;
  notif_rate: number | null; // null = no notifications sent yet
  prayer_sheets: number;
  feedback_views: number;
  meetings_attended: number;
  engaged: boolean;
}

const PORTAL_LABEL: Record<PortalStatus, string> = {
  active: "Active",
  invite_opened: "Invite opened",
  not_started: "Not started",
};

const PORTAL_BADGE: Record<PortalStatus, string> = {
  active:
    "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  invite_opened:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  not_started: "bg-muted text-muted-foreground",
};

export default function ParentEngagementReport({
  classes,
}: ParentEngagementReportProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [rows, setRows] = useState<ParentRow[] | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      // 1. Active students (optionally filtered by class)
      let studentsQuery = supabase
        .from("students")
        .select("id, first_name, last_name, class_id, classes(name)")
        .eq("status", "active");
      if (selectedClass) studentsQuery = studentsQuery.eq("class_id", selectedClass);

      const { data: students } = await studentsQuery;
      const studentIds = (students || []).map((s) => s.id);
      const studentById = new Map(
        (students || []).map((s: any) => [
          s.id,
          {
            name: `${s.first_name} ${s.last_name}`,
            className: (s.classes as any)?.name || "Unassigned",
          },
        ]),
      );

      if (studentIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // 2. Parent ↔ student links
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("parent_user_id, student_id")
        .in("student_id", studentIds);

      const parentIds = Array.from(
        new Set((links || []).map((l) => l.parent_user_id)),
      );

      if (parentIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // 3. Parent profiles (reliable name/email + password_set fallback)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, password_set")
        .in("id", parentIds);
      const profileById = new Map(
        (profiles || []).map((p: any) => [p.id, p]),
      );

      // 3b. Richer portal status from the view when available; tolerate failure
      const portalById = new Map<string, PortalStatus>();
      try {
        const { data: portal } = await supabase
          .from("parent_portal_status")
          .select("id, portal_status")
          .in("id", parentIds);
        (portal || []).forEach((p: any) => {
          const s =
            p.portal_status === "active"
              ? "active"
              : p.portal_status === "link_clicked"
                ? "invite_opened"
                : "not_started";
          portalById.set(p.id, s as PortalStatus);
        });
      } catch {
        /* view unavailable — fall back to password_set below */
      }

      // 4. Notifications per parent (read-rate)
      const { data: notifs } = await supabase
        .from("parent_notifications")
        .select("parent_user_id, is_read")
        .in("parent_user_id", parentIds);
      const notifAgg = new Map<string, { total: number; read: number }>();
      (notifs || []).forEach((n) => {
        const a = notifAgg.get(n.parent_user_id) || { total: 0, read: 0 };
        a.total++;
        if (n.is_read) a.read++;
        notifAgg.set(n.parent_user_id, a);
      });

      // 5. Prayer sheets per parent (submitted/verified)
      const { data: sheets } = await supabase
        .from("prayer_sheets")
        .select("parent_user_id, status")
        .in("student_id", studentIds);
      const sheetCount = new Map<string, number>();
      (sheets || []).forEach((s) => {
        if (s.status === "submitted" || s.status === "verified") {
          sheetCount.set(
            s.parent_user_id,
            (sheetCount.get(s.parent_user_id) || 0) + 1,
          );
        }
      });

      // 6. Class-feedback views per parent
      const { data: views } = await supabase
        .from("parent_feedback_session_views")
        .select("parent_user_id")
        .in("parent_user_id", parentIds);
      const viewCount = new Map<string, number>();
      (views || []).forEach((v) => {
        viewCount.set(
          v.parent_user_id,
          (viewCount.get(v.parent_user_id) || 0) + 1,
        );
      });

      // 7. Parent-meeting attendance
      const { data: meetings } = await supabase
        .from("parent_meeting_attendance")
        .select("parent_user_id, attended")
        .in("parent_user_id", parentIds);
      const meetingCount = new Map<string, number>();
      (meetings || []).forEach((m) => {
        if (m.attended) {
          meetingCount.set(
            m.parent_user_id,
            (meetingCount.get(m.parent_user_id) || 0) + 1,
          );
        }
      });

      // Group linked students/classes per parent
      const parentStudents = new Map<string, string[]>();
      const parentClasses = new Map<string, Set<string>>();
      (links || []).forEach((l) => {
        const info = studentById.get(l.student_id);
        if (!info) return;
        const arr = parentStudents.get(l.parent_user_id) || [];
        arr.push(info.name);
        parentStudents.set(l.parent_user_id, arr);
        const set = parentClasses.get(l.parent_user_id) || new Set<string>();
        set.add(info.className);
        parentClasses.set(l.parent_user_id, set);
      });

      const result: ParentRow[] = parentIds.map((pid) => {
        const profile = profileById.get(pid);
        const portal: PortalStatus =
          portalById.get(pid) ||
          (profile?.password_set ? "active" : "not_started");
        const n = notifAgg.get(pid) || { total: 0, read: 0 };
        const prayer = sheetCount.get(pid) || 0;
        const fb = viewCount.get(pid) || 0;
        const mtg = meetingCount.get(pid) || 0;
        const rate = n.total > 0 ? Math.round((n.read / n.total) * 100) : null;
        const engaged =
          portal === "active" ||
          (rate !== null && rate > 0) ||
          prayer > 0 ||
          fb > 0 ||
          mtg > 0;
        return {
          parent_id: pid,
          name: profile?.full_name || "Unknown parent",
          email: profile?.email || "",
          students: (parentStudents.get(pid) || []).join(", "),
          classNames: Array.from(parentClasses.get(pid) || []),
          portal,
          notif_total: n.total,
          notif_read: n.read,
          notif_rate: rate,
          prayer_sheets: prayer,
          feedback_views: fb,
          meetings_attended: mtg,
          engaged,
        };
      });

      result.sort((a, b) => a.name.localeCompare(b.name));
      setRows(result);
    } catch (err) {
      console.error("Error generating parent engagement report:", err);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // Summary
  const total = rows?.length || 0;
  const activated = rows?.filter((r) => r.portal === "active").length || 0;
  const engagedCount = rows?.filter((r) => r.engaged).length || 0;
  const prayerParticipants =
    rows?.filter((r) => r.prayer_sheets > 0).length || 0;
  const notifParents = rows?.filter((r) => r.notif_rate !== null) || [];
  const avgReadRate =
    notifParents.length > 0
      ? Math.round(
          notifParents.reduce((s, r) => s + (r.notif_rate || 0), 0) /
            notifParents.length,
        )
      : 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  // Engagement by class
  const byClass = (() => {
    const map = new Map<string, { total: number; engaged: number }>();
    (rows || []).forEach((r) => {
      r.classNames.forEach((cn) => {
        const e = map.get(cn) || { total: 0, engaged: 0 };
        e.total++;
        if (r.engaged) e.engaged++;
        map.set(cn, e);
      });
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        ...v,
        rate: v.total > 0 ? Math.round((v.engaged / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  })();

  const exportToCSV = () => {
    if (!rows) return;
    const headers = [
      "Parent",
      "Email",
      "Student(s)",
      "Class(es)",
      "Portal",
      "Notifications Read",
      "Prayer Sheets",
      "Feedback Views",
      "Meetings Attended",
      "Engaged",
    ];
    const body = rows.map((r) => [
      r.name,
      r.email,
      r.students,
      r.classNames.join(" / "),
      PORTAL_LABEL[r.portal],
      r.notif_rate === null
        ? "—"
        : `${r.notif_read}/${r.notif_total} (${r.notif_rate}%)`,
      r.prayer_sheets,
      r.feedback_views,
      r.meetings_attended,
      r.engaged ? "Yes" : "No",
    ]);
    const csv = [headers, ...body]
      .map((row) => row.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parent-engagement-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    if (!rows || rows.length === 0) return;
    exportTablePDF({
      title: "Parent Engagement Report",
      subtitle: selectedClass
        ? classes.find((c) => c.id === selectedClass)?.name || "Class"
        : "All classes",
      summary: [
        { label: "Parents", value: total },
        { label: "Portal activated", value: `${activated} (${pct(activated)}%)` },
        { label: "Avg notification read rate", value: `${avgReadRate}%` },
        { label: "Engaged", value: `${engagedCount} (${pct(engagedCount)}%)` },
      ],
      columns: [
        "Parent",
        "Student(s)",
        "Portal",
        "Notifs read",
        "Prayer sheets",
        "Feedback views",
        "Meetings",
        "Engaged",
      ],
      rows: rows.map((r) => [
        r.name,
        r.students,
        PORTAL_LABEL[r.portal],
        r.notif_rate === null ? "—" : `${r.notif_read}/${r.notif_total} (${r.notif_rate}%)`,
        String(r.prayer_sheets),
        String(r.feedback_views),
        String(r.meetings_attended),
        r.engaged ? "Yes" : "No",
      ]),
      filenameBase: "parent-engagement",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="form-input"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={generateReport}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Generate Report
            </>
          )}
        </button>
        {rows && rows.length > 0 && (
          <>
            <button
              onClick={exportToCSV}
              className="btn-outline flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="btn-outline flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </>
        )}
      </div>

      {/* Measurement note */}
      {rows && rows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Engagement is measured from real activity: portal activation,
          notifications read, prayer sheets submitted, class feedback viewed and
          parent-meeting attendance.
        </p>
      )}

      {/* Summary */}
      {rows && rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">Parents</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{pct(activated)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Portal activated
            </p>
            <p className="text-xs text-muted-foreground">{activated}/{total}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{avgReadRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg notifs read
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{prayerParticipants}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Submitting prayers
            </p>
          </div>
          <div
            className={`rounded-lg border p-4 text-center ${
              pct(engagedCount) >= 60
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-card border-border"
            }`}
          >
            <p className="text-2xl font-bold text-primary">
              {pct(engagedCount)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Engaged</p>
            <p className="text-xs text-muted-foreground">
              {engagedCount}/{total}
            </p>
          </div>
        </div>
      )}

      {/* Engagement by class */}
      {byClass.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Engagement by Class</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Class</th>
                  <th className="text-center p-3">Parents</th>
                  <th className="text-center p-3">Engaged</th>
                  <th className="text-center p-3">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byClass.map((c) => (
                  <tr key={c.name} className="hover:bg-accent">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-center">{c.total}</td>
                    <td className="p-3 text-center text-primary">{c.engaged}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 max-w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              c.rate >= 70
                                ? "bg-green-500"
                                : c.rate >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${c.rate}%` }}
                          />
                        </div>
                        <span className="font-semibold">{c.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-parent detail */}
      {rows && rows.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">Parents</h4>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {rows.map((r) => (
              <div key={r.parent_id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.students}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${PORTAL_BADGE[r.portal]}`}
                  >
                    {PORTAL_LABEL[r.portal]}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-xs">
                  <div>
                    <p className="font-semibold">
                      {r.notif_rate === null ? "—" : `${r.notif_rate}%`}
                    </p>
                    <p className="text-muted-foreground">Notifs</p>
                  </div>
                  <div>
                    <p className="font-semibold">{r.prayer_sheets}</p>
                    <p className="text-muted-foreground">Prayers</p>
                  </div>
                  <div>
                    <p className="font-semibold">{r.feedback_views}</p>
                    <p className="text-muted-foreground">Feedback</p>
                  </div>
                  <div>
                    <p className="font-semibold">{r.meetings_attended}</p>
                    <p className="text-muted-foreground">Meetings</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Parent</th>
                  <th className="px-4 py-2 text-left font-medium">Student(s)</th>
                  <th className="px-4 py-2 text-center font-medium">Portal</th>
                  <th className="px-4 py-2 text-center font-medium">
                    Notifs read
                  </th>
                  <th className="px-4 py-2 text-center font-medium">
                    Prayer sheets
                  </th>
                  <th className="px-4 py-2 text-center font-medium">
                    Feedback
                  </th>
                  <th className="px-4 py-2 text-center font-medium">Meetings</th>
                  <th className="px-4 py-2 text-center font-medium">Engaged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.parent_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.name}</p>
                      {r.email && (
                        <p className="text-xs text-muted-foreground">
                          {r.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.students}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${PORTAL_BADGE[r.portal]}`}
                      >
                        {PORTAL_LABEL[r.portal]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.notif_rate === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="font-medium">
                          {r.notif_read}/{r.notif_total} ({r.notif_rate}%)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{r.prayer_sheets}</td>
                    <td className="px-4 py-3 text-center">
                      {r.feedback_views}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.meetings_attended}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          r.engaged
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.engaged ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rows && rows.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground border border-border rounded-lg">
          <p className="text-sm">
            No linked parents found for the selected class.
          </p>
        </div>
      )}

      {rows === null && !loading && (
        <div className="text-center py-12 text-muted-foreground border border-border rounded-lg">
          <p className="text-sm">
            Click Generate Report to measure parent engagement.
          </p>
        </div>
      )}
    </div>
  );
}
