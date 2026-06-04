"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Circle,
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
type PrayerGrid = Record<Day, Record<Prayer, boolean>>;

const emptyGrid = (): PrayerGrid =>
  Object.fromEntries(
    DAYS.map((d) => [d, Object.fromEntries(PRAYERS.map((p) => [p, false]))]),
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
      const newGrid = emptyGrid();
      DAYS.forEach((d) => {
        PRAYERS.forEach((p) => {
          newGrid[d][p] = data[`${d}_${p}`] ?? false;
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

  const toggle = (day: Day, prayer: Prayer) => {
    if (status === "verified") return;
    setGrid((prev) => ({
      ...prev,
      [day]: { ...prev[day], [prayer]: !prev[day][prayer] },
    }));
  };

  const totalPrayers = DAYS.reduce(
    (sum, d) => sum + PRAYERS.filter((p) => grid[d][p]).length,
    0,
  );
  const percentage = Math.round((totalPrayers / 35) * 100);

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
            {totalPrayers} / 35 prayers
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
                      <button
                        onClick={() => toggle(day, prayer)}
                        disabled={status === "verified"}
                        className="mx-auto block disabled:cursor-not-allowed"
                      >
                        {grid[day][prayer] ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground/40" />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save Button */}
      {status !== "verified" && (
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Saved successfully
            </span>
          )}
          {!saved && <div />}
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

      {status === "verified" && (
        <p className="text-sm text-green-600 text-center pt-2">
          ✓ This sheet has been verified by the admin
        </p>
      )}
    </div>
  );
}
