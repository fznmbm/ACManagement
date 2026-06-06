"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
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
// null = not marked, true = prayed, false = missed
type CellState = null | true | false;
type PrayerGrid = Record<Day, Record<Prayer, CellState>>;

const emptyGrid = (): PrayerGrid =>
  Object.fromEntries(
    DAYS.map((d) => [d, Object.fromEntries(PRAYERS.map((p) => [p, null]))]),
  ) as PrayerGrid;

const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatWeekLabel = (monday: Date): string => {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
};

interface Props {
  studentId: string;
  studentName: string;
}

export default function ParentPrayerSheet({ studentId, studentName }: Props) {
  const supabase = createClient();
  const [weekStart, setWeekStart] = useState<Date>(getMondayOfWeek(new Date()));
  const [grid, setGrid] = useState<PrayerGrid>(emptyGrid());
  const [status, setStatus] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parentUserId, setParentUserId] = useState<string | null>(null);
  const [prayerEnabled, setPrayerEnabled] = useState<boolean | null>(null);
  const [streak, setStreak] = useState<{ current: number; best: number }>({
    current: 0,
    best: 0,
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setParentUserId(user.id);
    };
    getUser();

    const checkPrayerEnabled = async () => {
      const { data: student } = await supabase
        .from("students")
        .select("class_id")
        .eq("id", studentId)
        .single();

      if (!student?.class_id) {
        setPrayerEnabled(true);
        return;
      }

      const { data: cls } = await supabase
        .from("classes")
        .select("prayer_sheets_enabled")
        .eq("id", student.class_id)
        .single();

      setPrayerEnabled(cls?.prayer_sheets_enabled ?? false);
    };
    checkPrayerEnabled();
  }, [studentId]);

  useEffect(() => {
    if (!parentUserId) return;
    fetchSheet();
  }, [weekStart, parentUserId]);

  useEffect(() => {
    if (!parentUserId) return;
    fetchStreak();
  }, [parentUserId, studentId]);

  const fetchStreak = async () => {
    const { data } = await supabase
      .from("prayer_sheets")
      .select("week_start_date, total_prayers, status")
      .eq("student_id", studentId)
      .in("status", ["submitted", "verified"])
      .order("week_start_date", { ascending: false })
      .limit(52); // Last year of weeks

    if (!data || data.length === 0) return;

    // Calculate current streak — consecutive perfect weeks (35/35) going back
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Sort descending by date
    const sorted = [...data].sort(
      (a, b) =>
        new Date(b.week_start_date).getTime() -
        new Date(a.week_start_date).getTime(),
    );

    // Current streak: consecutive perfect weeks from most recent
    for (let i = 0; i < sorted.length; i++) {
      if ((sorted[i].total_prayers ?? 0) === 35) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Best streak: longest run of perfect weeks
    for (const sheet of sorted) {
      if ((sheet.total_prayers ?? 0) === 35) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    setStreak({ current: currentStreak, best: bestStreak });
  };

  const fetchSheet = async () => {
    setLoading(true);
    const weekDate = weekStart.toISOString().split("T")[0];

    const { data } = await supabase
      .from("prayer_sheets")
      .select("*")
      .eq("student_id", studentId)
      .eq("week_start_date", weekDate)
      .single();

    if (data) {
      setSheetId(data.id);
      setStatus(data.status);
      const newGrid = emptyGrid();
      DAYS.forEach((d) => {
        PRAYERS.forEach((p) => {
          // In DB: true = prayed, false = missed, null = not marked
          const val = data[`${d}_${p}`];
          newGrid[d][p] = val === null ? null : val === true ? true : false;
        });
      });
      setGrid(newGrid);
    } else {
      setSheetId(null);
      setStatus(null);
      setGrid(emptyGrid());
    }
    setLoading(false);
  };

  // 3-state toggle: null → true → false → null
  const toggle = useCallback(
    async (day: Day, prayer: Prayer) => {
      if (status === "submitted" || status === "verified") return;

      const current = grid[day][prayer];
      const next: CellState =
        current === null ? true : current === true ? false : null;

      const newGrid = {
        ...grid,
        [day]: { ...grid[day], [prayer]: next },
      };
      setGrid(newGrid);

      // Auto-save to DB as draft
      await autoSave(newGrid);
    },
    [grid, status, parentUserId, sheetId, studentId, weekStart],
  );

  const autoSave = async (currentGrid: PrayerGrid) => {
    if (!parentUserId) return;
    setAutoSaving(true);

    const weekDate = weekStart.toISOString().split("T")[0];
    const payload: Record<string, any> = {
      student_id: studentId,
      parent_user_id: parentUserId,
      week_start_date: weekDate,
      status: "draft",
    };

    DAYS.forEach((d) => {
      PRAYERS.forEach((p) => {
        // null = not marked (store as null), true = prayed, false = missed
        payload[`${d}_${p}`] =
          currentGrid[d][p] === null ? false : currentGrid[d][p];
      });
    });

    if (sheetId) {
      await supabase.from("prayer_sheets").update(payload).eq("id", sheetId);
    } else {
      const { data } = await supabase
        .from("prayer_sheets")
        .insert(payload)
        .select("id")
        .single();
      if (data) setSheetId(data.id);
    }

    setStatus("draft");
    setLastSaved(new Date());
    setAutoSaving(false);
  };

  const handleSubmit = async () => {
    if (!sheetId) return;
    setSubmitting(true);

    // On submit: null cells become false (missed)
    const payload: Record<string, any> = { status: "submitted" };
    DAYS.forEach((d) => {
      PRAYERS.forEach((p) => {
        payload[`${d}_${p}`] = grid[d][p] === true;
      });
    });

    await supabase.from("prayer_sheets").update(payload).eq("id", sheetId);
    setStatus("submitted");
    setSubmitting(false);
  };

  const totalPrayed = DAYS.reduce(
    (sum, d) => sum + PRAYERS.filter((p) => grid[d][p] === true).length,
    0,
  );
  const totalMarked = DAYS.reduce(
    (sum, d) => sum + PRAYERS.filter((p) => grid[d][p] !== null).length,
    0,
  );
  const percentage = Math.round((totalPrayed / 35) * 100);

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

  const isLocked = status === "submitted" || status === "verified";

  const renderCell = (day: Day, prayer: Prayer) => {
    const val = grid[day][prayer];

    if (val === true) {
      return (
        <button
          onClick={() => toggle(day, prayer)}
          disabled={isLocked}
          className="mx-auto block disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </button>
      );
    }
    if (val === false) {
      return (
        <button
          onClick={() => toggle(day, prayer)}
          disabled={isLocked}
          className="mx-auto block disabled:cursor-not-allowed"
        >
          <XCircle className="h-7 w-7 text-red-400" />
        </button>
      );
    }
    // null - not marked
    return (
      <button
        onClick={() => toggle(day, prayer)}
        disabled={isLocked}
        className="mx-auto block disabled:cursor-not-allowed"
      >
        <div className="h-7 w-7 rounded-full border-2 border-muted-foreground/30 hover:border-primary transition-colors" />
      </button>
    );
  };

  if (prayerEnabled === null) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!prayerEnabled) {
    return (
      <div className="bg-muted/30 border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">
          Prayer Sheets not enabled
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Prayer sheets are not enabled for this class. Contact admin for more
          information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Prayer Sheet</h3>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
        <div className="flex items-center gap-2">
          {autoSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
          {!autoSaving && lastSaved && status === "draft" && (
            <span className="text-xs text-muted-foreground">
              Draft saved{" "}
              {lastSaved.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {status && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === "verified"
                  ? "bg-green-100 text-green-800"
                  : status === "submitted"
                    ? "bg-blue-100 text-blue-800"
                    : status === "flagged"
                      ? "bg-red-100 text-red-800"
                      : "bg-slate-100 text-slate-600"
              }`}
            >
              {status === "draft"
                ? "Draft"
                : status === "submitted"
                  ? "Submitted"
                  : status === "verified"
                    ? "Verified"
                    : "Flagged"}
            </span>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2">
        <button onClick={prevWeek} className="p-1 hover:bg-accent rounded">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {formatWeekLabel(weekStart)}
        </span>
        <button
          onClick={nextWeek}
          disabled={isCurrentWeek}
          className="p-1 hover:bg-accent rounded disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Streak */}
      {(streak.current > 0 || streak.best > 0) && (
        <div className="flex items-center gap-3 flex-wrap">
          {streak.current > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-full">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                {streak.current} week{streak.current > 1 ? "s" : ""} streak
              </span>
            </div>
          )}
          {streak.best > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Best: {streak.best} weeks
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {totalPrayed} / 35 prayed · {totalMarked} marked
          </span>
          <span className="font-medium">{percentage}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
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

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-green-500" /> Prayed
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-4 w-4 text-red-400" /> Missed
        </span>
        <span className="flex items-center gap-1">
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />{" "}
          Not marked
        </span>
        {!isLocked && (
          <span className="text-muted-foreground italic">
            Tap once = ✅ · Tap twice = ❌ · Tap again = clear
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-16">
                Day
              </th>
              {PRAYER_LABELS.map((p) => (
                <th
                  key={p}
                  className="text-center py-2 px-1 text-muted-foreground font-medium text-xs"
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) => (
              <tr key={day} className="border-t border-border">
                <td className="py-2 pr-3 font-medium text-sm">
                  {DAY_LABELS[di]}
                </td>
                {PRAYERS.map((prayer) => (
                  <td key={prayer} className="py-1 px-1 text-center">
                    {renderCell(day, prayer)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Footer */}
      {!isLocked && (
        <div className="pt-3 border-t border-border space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>How to mark:</strong> Tap once for ✅ prayed, tap twice
              for ❌ missed, tap again to clear. Your marks are{" "}
              <strong>auto-saved as a draft</strong> every time you tap — you
              won't lose progress if you close the app. When you're done for the
              week, tap <strong>Submit Week</strong> to send to your teacher.
            </p>
          </div>

          {sheetId ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {totalMarked} of 35 prayers marked
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting || totalMarked === 0}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Submitting..." : "Submit Week"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Start marking prayers — your progress will auto-save as a draft.
            </p>
          )}
        </div>
      )}

      {status === "submitted" && (
        <div className="pt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
            ✓ Week submitted — waiting for teacher verification. Contact your
            teacher if you need to make changes.
          </p>
        </div>
      )}

      {status === "verified" && (
        <div className="pt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400 text-center">
            ✓ Sheet verified by teacher
          </p>
        </div>
      )}

      {status === "flagged" && (
        <div className="pt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400 text-center">
            ⚠️ Sheet flagged by teacher — please review and resubmit.
          </p>
        </div>
      )}
    </div>
  );
}
