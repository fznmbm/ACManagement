"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Save,
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
// null = not filled (missed), true = prayed, false = explicitly missed
type PrayerState = true | false;
type PrayerGrid = Record<Day, Record<Prayer, boolean>>;

const emptyGrid = (): PrayerGrid =>
  Object.fromEntries(
    DAYS.map((d) => [d, Object.fromEntries(PRAYERS.map((p) => [p, false]))]),
  ) as PrayerGrid;

// Track which cells have been explicitly touched by parent
type TouchedGrid = Record<Day, Record<Prayer, boolean>>;
const emptyTouched = (): TouchedGrid =>
  Object.fromEntries(
    DAYS.map((d) => [d, Object.fromEntries(PRAYERS.map((p) => [p, false]))]),
  ) as TouchedGrid;

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
  const [touched, setTouched] = useState<TouchedGrid>(emptyTouched());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [parentUserId, setParentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setParentUserId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!parentUserId) return;
    fetchSheet();
  }, [weekStart, parentUserId]);

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
      setIsSubmitted(true);
      const newGrid = emptyGrid();
      const newTouched = emptyTouched();
      DAYS.forEach((d) => {
        PRAYERS.forEach((p) => {
          newGrid[d][p] = data[`${d}_${p}`] ?? false;
          newTouched[d][p] = true; // already saved = all touched
        });
      });
      setGrid(newGrid);
      setTouched(newTouched);
    } else {
      setSheetId(null);
      setStatus(null);
      setIsSubmitted(false);
      setGrid(emptyGrid());
      setTouched(emptyTouched());
    }
    setLoading(false);
  };

  // Toggle: untouched → true (prayed) → back to untouched (missed)
  const toggle = (day: Day, prayer: Prayer) => {
    if (status === "verified" || status === "submitted") return;

    const currentTouched = touched[day][prayer];
    const currentValue = grid[day][prayer];

    if (!currentTouched) {
      // Not touched yet → mark as prayed
      setGrid((prev) => ({ ...prev, [day]: { ...prev[day], [prayer]: true } }));
      setTouched((prev) => ({
        ...prev,
        [day]: { ...prev[day], [prayer]: true },
      }));
    } else if (currentValue === true) {
      // Prayed → unmark (missed)
      setGrid((prev) => ({
        ...prev,
        [day]: { ...prev[day], [prayer]: false },
      }));
      setTouched((prev) => ({
        ...prev,
        [day]: { ...prev[day], [prayer]: false },
      }));
    }
  };

  const totalPrayed = DAYS.reduce(
    (sum, d) => sum + PRAYERS.filter((p) => grid[d][p]).length,
    0,
  );
  const percentage = Math.round((totalPrayed / 35) * 100);

  const handleSave = async () => {
    if (!parentUserId) return;
    setSaving(true);

    const weekDate = weekStart.toISOString().split("T")[0];
    const payload: Record<string, any> = {
      student_id: studentId,
      parent_user_id: parentUserId,
      week_start_date: weekDate,
      status: "submitted",
    };

    // Save grid — untouched = false (missed)
    DAYS.forEach((d) => {
      PRAYERS.forEach((p) => {
        payload[`${d}_${p}`] = grid[d][p];
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

    // Mark all as touched after save
    const allTouched = emptyTouched();
    DAYS.forEach((d) =>
      PRAYERS.forEach((p) => {
        allTouched[d][p] = true;
      }),
    );
    setTouched(allTouched);
    setIsSubmitted(true);
    setStatus("submitted");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

  const renderCell = (day: Day, prayer: Prayer) => {
    const isTouched = touched[day][prayer];
    const isPrayed = grid[day][prayer];
    const isVerified = status === "verified";

    if (!isTouched && !isSubmitted) {
      // Not yet marked — show empty circle
      return (
        <button
          onClick={() => toggle(day, prayer)}
          disabled={isVerified}
          className="mx-auto block disabled:cursor-not-allowed"
        >
          <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
        </button>
      );
    }

    if (isPrayed) {
      return (
        <button
          onClick={() => toggle(day, prayer)}
          disabled={isVerified}
          className="mx-auto block disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </button>
      );
    }

    // Missed (touched but false, or saved as false)
    return (
      <button
        onClick={() => toggle(day, prayer)}
        disabled={isVerified}
        className="mx-auto block disabled:cursor-not-allowed"
      >
        <XCircle className="h-6 w-6 text-red-400" />
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Prayer Sheet</h3>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
        {status && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === "verified"
                ? "bg-green-100 text-green-800"
                : status === "flagged"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
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

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {totalPrayed} / 35 prayers
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
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium w-20">
                  Prayer
                </th>
                {DAY_LABELS.map((d) => (
                  <th
                    key={d}
                    className="text-center py-2 px-2 text-muted-foreground font-medium"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRAYERS.map((prayer, pi) => (
                <tr key={prayer} className="border-t border-border">
                  <td className="py-3 pr-4 font-medium">{PRAYER_LABELS[pi]}</td>
                  {DAYS.map((day) => (
                    <td key={day} className="py-3 px-2 text-center">
                      {renderCell(day, prayer)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save Button */}
      {/* Save button — only show if not submitted or if flagged */}
      {(status === null || status === "flagged") && (
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Saved — unmarked prayers
              counted as missed
            </span>
          ) : (
            <p className="text-xs text-muted-foreground">
              {status === "flagged"
                ? "⚠️ Your sheet was flagged by admin. Please correct and resubmit."
                : "Tip: Only tick prayers that were prayed. Everything else saves as missed."}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Sheet"}
          </button>
        </div>
      )}

      {status === "submitted" && (
        <div className="pt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
            ✓ Sheet submitted — waiting for admin verification. Contact admin if
            you need to make changes.
          </p>
        </div>
      )}

      {status === "verified" && (
        <div className="pt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400 text-center">
            ✓ Sheet verified by admin
          </p>
        </div>
      )}

      {status === "flagged" && saved && (
        <div className="pt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
            Sheet resubmitted — waiting for admin review
          </p>
        </div>
      )}
    </div>
  );
}
