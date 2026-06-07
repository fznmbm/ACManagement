"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  Flag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  List,
} from "lucide-react";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRAYER_LABELS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

type Day = (typeof DAYS)[number];
type Prayer = (typeof PRAYERS)[number];

const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatWeekLabel = (dateStr: string): string => {
  const monday = new Date(dateStr);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
};

// Message A: Who submitted / who didn't
const generateSubmissionListMessage = (
  submitted: any[],
  notSubmitted: any[],
  weekLabel: string,
  className: string,
  streaks: Record<string, number> = {},
): string => {
  let msg = `🕌 *Prayer Sheets — ${weekLabel}*\n`;
  if (className !== "all") msg += `📚 *${className}*\n`;
  msg += `\n`;

  if (submitted.length > 0) {
    msg += `✅ *Submitted (${submitted.length})*\n`;
    submitted.forEach((s) => {
      const pct = Math.round(((s.total_prayers ?? 0) / 35) * 100);
      const emoji = pct >= 80 ? "🟢" : pct >= 50 ? "🟡" : "🔴";
      const streak = streaks[s.student_id] ?? 0;
      const streakText = streak > 0 ? ` 🔥${streak}` : "";
      msg += `• ${s.students?.first_name} ${s.students?.last_name} — ${s.total_prayers ?? 0}/35 ${emoji}${streakText}\n`;
    });
  }

  if (notSubmitted.length > 0) {
    msg += `\n❌ *Not Submitted (${notSubmitted.length})*\n`;
    notSubmitted.forEach((s) => {
      msg += `• ${s.first_name} ${s.last_name}\n`;
    });
  }

  const avgPct = submitted.length
    ? Math.round(
        (submitted.reduce((s, sh) => s + (sh.total_prayers ?? 0), 0) /
          (submitted.length * 35)) *
          100,
      )
    : 0;

  msg += `\n📊 ${submitted.length + notSubmitted.length} students total | Class avg: ${avgPct}%`;

  return msg;
};

// Message B: Individual student detail
const generateIndividualMessage = (
  sheet: any,
  weekLabel: string,
  streak: number = 0,
): string => {
  const student = sheet.students;
  const total = sheet.total_prayers ?? 0;
  const pct = Math.round((total / 35) * 100);
  const emoji = pct >= 80 ? "🟢" : pct >= 50 ? "🟡" : "🔴";

  // Prayer abbrevs all same length (4 chars) for alignment
  const PRAYER_ABBREV = ["Fajr", "Duhr", "Asr ", "Mghr", "Isha"];
  // Day initials
  const DAY_INITIALS = " M   T   W   T  F   S   S";

  let msg = `🕌 *${student?.first_name} ${student?.last_name}*\n`;
  msg += `📅 ${weekLabel}\n`;
  if (student?.classes?.name) msg += `📚 ${student.classes.name}\n`;
  if (streak > 0) msg += `🔥 ${streak} week streak\n`;
  msg += `\n`;

  // Grid in monospace block for alignment
  msg += `\`\`\`\n`;
  msg += `     ${DAY_INITIALS}\n`;
  PRAYERS.forEach((prayer, pi) => {
    const abbrev = PRAYER_ABBREV[pi];
    const cells = DAYS.map((day) =>
      sheet[`${day}_${prayer}`] ? "✅" : "❌",
    ).join(" ");
    msg += `${abbrev} ${cells}\n`;
  });
  msg += `\`\`\`\n`;

  msg += `${emoji} *Total: ${total}/35 (${pct}%)*`;

  return msg;
};

export default function AdminPrayerSheets() {
  const supabase = createClient();
  const [sheets, setSheets] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(getMondayOfWeek(new Date()));
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [whatsAppMsg, setWhatsAppMsg] = useState("");
  const [whatsAppMode, setWhatsAppMode] = useState<
    "list" | "individual" | null
  >(null);
  const [selectedIndividual, setSelectedIndividual] = useState<any | null>(
    null,
  );
  const [studentStreaks, setStudentStreaks] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    fetchClasses();
    fetchStreaks();
  }, []);

  useEffect(() => {
    fetchSheets();
    fetchAllStudents();
  }, [weekStart, selectedClass]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("is_active", true)
      .eq("prayer_sheets_enabled", true)
      .order("name");
    setClasses(data || []);
  };

  const fetchStreaks = async () => {
    const { data } = await supabase
      .from("student_prayer_summary")
      .select("student_id, current_streak");
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((r) => {
        map[r.student_id] = r.current_streak;
      });
      setStudentStreaks(map);
    }
  };

  const fetchAllStudents = async () => {
    let query = supabase
      .from("students")
      .select(
        "id, first_name, last_name, student_number, class_id, classes(name)",
      )
      .eq("status", "active");

    if (selectedClass !== "all") {
      query = query.eq("class_id", selectedClass);
    }

    const { data } = await query;
    setAllStudents(data || []);
  };

  const fetchSheets = async () => {
    setLoading(true);
    const weekDate = weekStart.toISOString().split("T")[0];

    let query = supabase
      .from("prayer_sheets")
      .select(
        `*, students(first_name, last_name, student_number, class_id, classes(name))`,
      )
      .eq("week_start_date", weekDate)
      .in("status", ["submitted", "flagged"])
      .order("submitted_at", { ascending: false });

    if (selectedClass !== "all") {
      query = query.eq("students.class_id", selectedClass);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;

    // Filter by class if needed (since nested filter may not work directly)
    let filtered = data || [];
    if (selectedClass !== "all") {
      filtered = filtered.filter((s) => s.students?.class_id === selectedClass);
    }

    setSheets(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchSheets();
  }, [statusFilter]);

  const updateStatus = async (sheetId: string, newStatus: string) => {
    setUpdating(sheetId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("prayer_sheets")
      .update({
        status: newStatus,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", sheetId);
    setSheets((prev) =>
      prev.map((s) => (s.id === sheetId ? { ...s, status: newStatus } : s)),
    );
    setUpdating(null);
  };

  const handleSubmissionListWhatsApp = () => {
    const weekLabel = formatWeekLabel(weekStart.toISOString().split("T")[0]);
    const submittedIds = new Set(sheets.map((s) => s.student_id));
    const notSubmitted = allStudents.filter((s) => !submittedIds.has(s.id));
    const className =
      selectedClass !== "all"
        ? classes.find((c) => c.id === selectedClass)?.name || "All Classes"
        : "All Classes";
    const msg = generateSubmissionListMessage(
      sheets,
      notSubmitted,
      weekLabel,
      className,
      studentStreaks,
    );
    setWhatsAppMsg(msg);
    setWhatsAppMode("list");
    setShowWhatsApp(true);
  };

  const handleIndividualWhatsApp = (sheet: any) => {
    const weekLabel = formatWeekLabel(weekStart.toISOString().split("T")[0]);
    const streak = studentStreaks[sheet.student_id] ?? 0;
    const msg = generateIndividualMessage(sheet, weekLabel, streak);
    setWhatsAppMsg(msg);
    setWhatsAppMode("individual");
    setSelectedIndividual(sheet);
    setShowWhatsApp(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppMsg);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = whatsAppMsg;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    if (d <= getMondayOfWeek(new Date())) setWeekStart(d);
  };

  const isCurrentWeek =
    weekStart.toISOString().split("T")[0] ===
    getMondayOfWeek(new Date()).toISOString().split("T")[0];

  const submittedIds = new Set(sheets.map((s) => s.student_id));
  const notSubmittedCount = allStudents.filter(
    (s) => !submittedIds.has(s.id),
  ).length;

  const statusCounts = {
    all: sheets.length,
    submitted: sheets.filter((s) => s.status === "submitted").length,
    flagged: sheets.filter((s) => s.status === "flagged").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Prayer Sheets</h2>
          <p className="text-muted-foreground">
            Review and verify weekly prayer submissions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmissionListWhatsApp}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <List className="h-4 w-4" />
            Submission List
          </button>
        </div>
      </div>

      {/* Class Filter */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Prayer Sheet Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>

        {/* Week Navigation */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
          <button onClick={prevWeek} className="p-1 hover:bg-accent rounded">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {formatWeekLabel(weekStart.toISOString().split("T")[0])}
          </span>
          <button
            onClick={nextWeek}
            disabled={isCurrentWeek}
            className="p-1 hover:bg-accent rounded disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Submission Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {sheets.length}
          </p>
          <p className="text-xs text-green-600 dark:text-green-500">
            Submitted
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {notSubmittedCount}
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">
            Not Submitted
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {statusCounts.flagged}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500">
            Flagged
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "submitted", "flagged"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border hover:bg-accent"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-2 text-xs opacity-70">({statusCounts[s]})</span>
          </button>
        ))}
      </div>

      {/* Sheets List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sheets.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            No prayer sheets submitted for this week yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sheets.map((sheet) => {
            const total = sheet.total_prayers ?? 0;
            const percentage = Math.round((total / 35) * 100);
            const student = sheet.students;

            return (
              <div
                key={sheet.id}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                {/* Sheet Header */}
                <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {student?.first_name?.[0]}
                        {student?.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {student?.first_name} {student?.last_name}
                        </p>
                        {(studentStreaks[sheet.student_id] ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                            🔥 {studentStreaks[sheet.student_id]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {student?.student_number} ·{" "}
                        {student?.classes?.name || "No class"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-right">
                      <p className="text-sm font-medium">{total}/35</p>
                      <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            percentage >= 80
                              ? "bg-green-500"
                              : percentage >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sheet.status === "flagged"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {sheet.status === "flagged" ? "Flagged" : "Submitted"}
                    </span>

                    {/* Copy individual sheet */}
                    <button
                      onClick={() => handleIndividualWhatsApp(sheet)}
                      title="Copy prayer sheet to clipboard"
                      className="flex items-center gap-1 px-2 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Copy
                    </button>

                    {sheet.status !== "flagged" && (
                      <button
                        onClick={() => updateStatus(sheet.id, "flagged")}
                        disabled={updating === sheet.id}
                        className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        <Flag className="h-3 w-3" />
                        Flag
                      </button>
                    )}
                  </div>
                </div>

                {/* Prayer Grid — days as rows */}
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left py-1 pr-3 text-muted-foreground w-10">
                          Day
                        </th>
                        {PRAYER_LABELS.map((p) => (
                          <th
                            key={p}
                            className="text-center py-1 px-1 text-muted-foreground"
                          >
                            {p}
                          </th>
                        ))}
                        <th className="text-center py-1 px-1 text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day, di) => {
                        const dayTotal = PRAYERS.filter(
                          (p) => sheet[`${day}_${p}`],
                        ).length;
                        return (
                          <tr key={day} className="border-t border-border/50">
                            <td className="py-1.5 pr-3 font-medium">
                              {DAY_LABELS[di]}
                            </td>
                            {PRAYERS.map((prayer) => (
                              <td
                                key={prayer}
                                className="py-1.5 px-1 text-center"
                              >
                                {sheet[`${day}_${prayer}`] ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                                )}
                              </td>
                            ))}
                            <td className="py-1.5 px-1 text-center font-medium">
                              {dayTotal}/5
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 pb-3 text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(sheet.submitted_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-1">
              {whatsAppMode === "list"
                ? "Submission List Message"
                : `Individual Sheet — ${selectedIndividual?.students?.first_name} ${selectedIndividual?.students?.last_name}`}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {whatsAppMode === "list"
                ? "Send this to your WhatsApp group to show who submitted and who hasn't"
                : "Send this individual student's prayer sheet"}
            </p>
            <textarea
              value={whatsAppMsg}
              onChange={(e) => setWhatsAppMsg(e.target.value)}
              className="w-full h-56 p-3 text-xs font-mono bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Copy then paste into your WhatsApp group
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWhatsApp(false);
                    setCopied(false);
                  }}
                  className="btn-outline"
                >
                  Close
                </button>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
