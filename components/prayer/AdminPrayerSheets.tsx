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

const generateWhatsAppMessage = (sheets: any[], weekLabel: string): string => {
  const EMOJI = { prayed: "✅", missed: "❌" };
  const DAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

  let msg = `🕌 *Prayer Sheets — ${weekLabel}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  sheets.forEach((sheet) => {
    const student = sheet.students;
    const total = sheet.total_prayers ?? 0;
    const pct = Math.round((total / 35) * 100);
    const emoji = pct >= 80 ? "🟢" : pct >= 50 ? "🟡" : "🔴";

    msg += `👤 *${student?.first_name} ${student?.last_name}*\n`;
    msg += `${emoji} ${total}/35 prayers (${pct}%)\n`;
    msg += `\`       M  T  W  T  F  S  S\`\n`;

    PRAYERS.forEach((prayer, pi) => {
      const row = DAY_SHORT.map((_, di) => {
        const day = DAYS[di];
        return sheet[`${day}_${prayer}`] ? EMOJI.prayed : EMOJI.missed;
      }).join(" ");
      msg += `\`${PRAYER_LABELS[pi].padEnd(7)}\` ${row}\n`;
    });

    msg += `\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📊 *Summary:* ${sheets.length} submitted\n`;

  const avgPct = sheets.length
    ? Math.round(
        (sheets.reduce((s, sh) => s + (sh.total_prayers ?? 0), 0) /
          (sheets.length * 35)) *
          100,
      )
    : 0;
  msg += `📈 *Class avg:* ${avgPct}%`;

  return msg;
};

export default function AdminPrayerSheets() {
  const supabase = createClient();
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(getMondayOfWeek(new Date()));
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [whatsAppMsg, setWhatsAppMsg] = useState("");

  useEffect(() => {
    fetchSheets();
  }, [weekStart, statusFilter]);

  const fetchSheets = async () => {
    setLoading(true);
    const weekDate = weekStart.toISOString().split("T")[0];

    let query = supabase
      .from("prayer_sheets")
      .select(
        `
        *,
        students (
          first_name,
          last_name,
          student_number,
          classes ( name )
        )
      `,
      )
      .eq("week_start_date", weekDate)
      .order("submitted_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setSheets(data || []);
    setLoading(false);
  };

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

  const handleWhatsApp = () => {
    const weekLabel = formatWeekLabel(weekStart.toISOString().split("T")[0]);
    const msg = generateWhatsAppMessage(sheets, weekLabel);
    setWhatsAppMsg(msg);
    setShowWhatsApp(true);
  };

  const sendWhatsApp = () => {
    const encoded = encodeURIComponent(whatsAppMsg);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
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

  const statusCounts = {
    all: sheets.length,
    submitted: sheets.filter((s) => s.status === "submitted").length,
    verified: sheets.filter((s) => s.status === "verified").length,
    flagged: sheets.filter((s) => s.status === "flagged").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prayer Sheets</h2>
          <p className="text-muted-foreground">
            Review and verify weekly prayer submissions
          </p>
        </div>
        {sheets.length > 0 && (
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Send to WhatsApp
          </button>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg px-6 py-3">
        <button onClick={prevWeek} className="p-2 hover:bg-accent rounded-lg">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-medium">
          {formatWeekLabel(weekStart.toISOString().split("T")[0])}
        </span>
        <button
          onClick={nextWeek}
          disabled={isCurrentWeek}
          className="p-2 hover:bg-accent rounded-lg disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "submitted", "verified", "flagged"] as const).map((s) => (
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
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {student?.first_name?.[0]}
                        {student?.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {student?.first_name} {student?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student?.student_number} ·{" "}
                        {student?.classes?.name || "No class"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{total}/35 prayers</p>
                      <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden mt-1">
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
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sheet.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : sheet.status === "flagged"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {sheet.status.charAt(0).toUpperCase() +
                        sheet.status.slice(1)}
                    </span>

                    <div className="flex gap-2">
                      {sheet.status !== "verified" && (
                        <button
                          onClick={() => updateStatus(sheet.id, "verified")}
                          disabled={updating === sheet.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          {updating === sheet.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          Verify
                        </button>
                      )}
                      {sheet.status !== "flagged" && (
                        <button
                          onClick={() => updateStatus(sheet.id, "flagged")}
                          disabled={updating === sheet.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          <Flag className="h-3 w-3" />
                          Flag
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prayer Grid */}
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left py-1 pr-3 text-muted-foreground w-12">
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

      {/* WhatsApp Message Modal */}
      {showWhatsApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              WhatsApp Group Message
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Preview the message before sending to your WhatsApp group:
            </p>
            <textarea
              value={whatsAppMsg}
              onChange={(e) => setWhatsAppMsg(e.target.value)}
              className="w-full h-64 p-3 text-xs font-mono bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setShowWhatsApp(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={sendWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                <MessageSquare className="h-4 w-4" />
                Open in WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
