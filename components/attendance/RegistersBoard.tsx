"use client";

/**
 * RegistersBoard — admin oversight for "which classes have taken the register
 * for the latest class day".
 *
 * States (migration 018 adds attendance_registers):
 *   • Finalised     — a register row with status 'finalized' (shows when).
 *   • Submitted     — attendance rows exist but no finalised register (older
 *                     data saved before 018, or saved another way).
 *   • Not submitted — nothing yet.
 * If the attendance_registers table isn't applied yet, it falls back to the
 * original "any rows = Submitted" behaviour.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { latestClassDay } from "@/lib/utils/classDay";
import { CheckCircle2, CircleDashed, Clock } from "lucide-react";

interface ClassRow {
  id: string;
  name: string;
}

export default function RegistersBoard() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [withRows, setWithRows] = useState<Set<string>>(new Set());
  const [finalized, setFinalized] = useState<Map<string, string | null>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  const day = useMemo(() => latestClassDay(), []);
  const dayLabel = useMemo(
    () =>
      new Date(day + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [day],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ data: cls }, { data: att }] = await Promise.all([
          supabase
            .from("classes")
            .select("id, name")
            .eq("is_active", true)
            .order("name"),
          supabase.from("attendance").select("class_id").eq("date", day),
        ]);
        if (!active) return;
        setClasses(cls || []);
        setWithRows(new Set((att || []).map((r: any) => r.class_id)));

        // Register states — best-effort (table may not be applied yet).
        try {
          const { data: regs } = await supabase
            .from("attendance_registers")
            .select("class_id, status, finalized_at")
            .eq("date", day);
          if (active && regs) {
            const m = new Map<string, string | null>();
            for (const r of regs as any[]) {
              if (r.status === "finalized")
                m.set(r.class_id, r.finalized_at || null);
            }
            setFinalized(m);
          }
        } catch {
          /* no register table yet — fall back to any-rows */
        }
      } catch {
        /* non-blocking oversight widget */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [day, supabase]);

  if (loading || classes.length === 0) return null;

  const done = classes.filter(
    (c) => finalized.has(c.id) || withRows.has(c.id),
  ).length;

  const fmtTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Registers — {dayLabel}
          </h3>
          <p className="text-xs text-muted-foreground">
            {done} of {classes.length} taken
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => {
          const isFinalized = finalized.has(c.id);
          const hasRows = withRows.has(c.id);
          return (
            <Link
              key={c.id}
              href={`/attendance?class=${c.id}&date=${day}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-accent"
            >
              <span className="truncate text-sm font-medium text-foreground">
                {c.name}
              </span>
              {isFinalized ? (
                <span
                  title={
                    finalized.get(c.id)
                      ? `Finalised at ${fmtTime(finalized.get(c.id)!)}`
                      : "Finalised"
                  }
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Finalised
                </span>
              ) : hasRows ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <Clock className="h-3.5 w-3.5" /> Submitted
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <CircleDashed className="h-3.5 w-3.5" /> Not submitted
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
