// components/dashboard/PrayerSnapshot.tsx
import { createClient } from "@/lib/supabase/server";
import { Moon } from "lucide-react";
import Link from "next/link";

export default async function PrayerSnapshot() {
  const supabase = await createClient();

  // Reference week = the most recent week that actually has submissions.
  // (The current week reads ~0 until it's submitted the following Monday.)
  const { data: latest } = await supabase
    .from("prayer_sheets")
    .select("week_start_date")
    .in("status", ["submitted", "verified"])
    .order("week_start_date", { ascending: false })
    .limit(1);
  const refWeek = latest?.[0]?.week_start_date as string | undefined;
  if (!refWeek) return null; // nothing submitted yet — hide the panel

  // Participating classes = prayer-enabled; fall back to classes that actually
  // have sheets that week (not every class does prayer sheets — e.g. only one).
  let { data: classRows } = await supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .eq("prayer_sheets_enabled", true);

  if (!classRows || classRows.length === 0) {
    const { data: wkSheets } = await supabase
      .from("prayer_sheets")
      .select("student_id")
      .eq("week_start_date", refWeek);
    const sheetStudentIds = (wkSheets || []).map((s) => s.student_id);
    if (sheetStudentIds.length > 0) {
      const { data: studs } = await supabase
        .from("students")
        .select("class_id")
        .in("id", sheetStudentIds);
      const classIds = Array.from(
        new Set((studs || []).map((s) => s.class_id).filter(Boolean)),
      ) as string[];
      if (classIds.length > 0) {
        const { data: cls } = await supabase
          .from("classes")
          .select("id, name")
          .in("id", classIds);
        classRows = cls || [];
      }
    }
  }
  if (!classRows || classRows.length === 0) return null;

  const classIds = classRows.map((c) => c.id);
  const classMap = new Map(classRows.map((c) => [c.id, c.name]));

  // Active students in the participating classes.
  const { data: students } = await supabase
    .from("students")
    .select("id, class_id")
    .eq("status", "active")
    .in("class_id", classIds);
  if (!students || students.length === 0) return null;

  // That week's sheets (all statuses) so we can tell submitted vs draft vs none.
  const { data: sheets } = await supabase
    .from("prayer_sheets")
    .select("student_id, status")
    .eq("week_start_date", refWeek)
    .in(
      "student_id",
      students.map((s) => s.id),
    );
  const statusOf = new Map(
    (sheets || []).map((s) => [s.student_id, s.status as string]),
  );

  const perClass = new Map<
    string,
    { total: number; submitted: number; draft: number; none: number }
  >();
  students.forEach((s) => {
    if (!s.class_id) return;
    const e =
      perClass.get(s.class_id) || { total: 0, submitted: 0, draft: 0, none: 0 };
    e.total++;
    const st = statusOf.get(s.id);
    if (st === "submitted" || st === "verified") e.submitted++;
    else if (st) e.draft++; // draft / flagged — started but not submitted
    else e.none++; // no sheet at all — never started
    perClass.set(s.class_id, e);
  });

  const rows = Array.from(perClass.entries())
    .map(([id, v]) => ({
      name: classMap.get(id) || "Unassigned",
      ...v,
      rate: v.total > 0 ? Math.round((v.submitted / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  const totalStudents = rows.reduce((s, r) => s + r.total, 0);
  const totalSubmitted = rows.reduce((s, r) => s + r.submitted, 0);
  const overall =
    totalStudents > 0 ? Math.round((totalSubmitted / totalStudents) * 100) : 0;

  const weekLabel = new Date(refWeek).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const rateColor = (r: number) =>
    r >= 80
      ? "text-green-600 dark:text-green-400"
      : r >= 50
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";
  const barColor = (r: number) =>
    r >= 80 ? "bg-green-500" : r >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Moon className="h-4 w-4 text-primary" />
          Prayer — week of {weekLabel}
        </h3>
        <Link
          href="/prayer-sheets"
          className="text-sm text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-3xl font-bold ${rateColor(overall)}`}>
          {overall}%
        </span>
        <span className="text-sm text-muted-foreground">
          submitted · {totalSubmitted}/{totalStudents} students
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.name}>
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-medium truncate">
                {c.name}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor(c.rate)}`}
                  style={{ width: `${c.rate}%` }}
                />
              </div>
              <span
                className={`w-12 shrink-0 text-right text-sm font-semibold ${rateColor(c.rate)}`}
              >
                {c.rate}%
              </span>
            </div>
            <p className="mt-1 pl-24 text-xs text-muted-foreground">
              {c.submitted} submitted · {c.draft} draft · {c.none} not started
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
