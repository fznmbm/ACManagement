// components/dashboard/PrayerSnapshot.tsx
import { createClient } from "@/lib/supabase/server";
import { Moon } from "lucide-react";
import Link from "next/link";

/** Monday (ISO date) of the current week. */
function currentMonday(): string {
  const d = new Date();
  const dow = d.getDay(); // 0 Sun … 6 Sat
  d.setDate(d.getDate() - ((dow + 6) % 7));
  return d.toISOString().split("T")[0];
}

export default async function PrayerSnapshot() {
  const supabase = await createClient();

  const monday = currentMonday();

  const { data: students } = await supabase
    .from("students")
    .select("id, class_id")
    .eq("status", "active");

  if (!students || students.length === 0) return null;

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true);
  const classMap = new Map((classes || []).map((c) => [c.id, c.name]));

  // This week's submitted/verified prayer sheets.
  const { data: sheets } = await supabase
    .from("prayer_sheets")
    .select("student_id, status")
    .eq("week_start_date", monday)
    .in("status", ["submitted", "verified"]);
  const submitted = new Set((sheets || []).map((s) => s.student_id));

  // Per-class submission rate for the week.
  const perClass = new Map<string, { total: number; done: number }>();
  students.forEach((s) => {
    if (!s.class_id) return;
    const e = perClass.get(s.class_id) || { total: 0, done: 0 };
    e.total++;
    if (submitted.has(s.id)) e.done++;
    perClass.set(s.class_id, e);
  });

  const rows = Array.from(perClass.entries())
    .map(([id, v]) => ({
      name: classMap.get(id) || "Unassigned",
      ...v,
      rate: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  const totalDone = submitted.size;
  const totalStudents = students.length;
  const overall =
    totalStudents > 0 ? Math.round((totalDone / totalStudents) * 100) : 0;

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
          Prayer this week
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
          submitted · {totalDone}/{totalStudents} students
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No prayer sheets submitted yet this week.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-medium truncate">
                {c.name}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor(c.rate)}`}
                  style={{ width: `${c.rate}%` }}
                />
              </div>
              <span className={`w-20 shrink-0 text-right text-sm font-semibold ${rateColor(c.rate)}`}>
                {c.done}/{c.total} · {c.rate}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
