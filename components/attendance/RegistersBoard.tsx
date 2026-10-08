"use client";

/**
 * RegistersBoard — admin oversight for "which classes have taken the register
 * for the latest class day". Read-only, additive, no schema change: a class is
 * "Submitted" if any attendance row exists for (class, latest class day),
 * otherwise "Not submitted". (Once a server-side draft/finalize state exists,
 * this upgrades to Not started / Draft / Finalized.)
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { latestClassDay } from "@/lib/utils/classDay";
import { CheckCircle2, CircleDashed } from "lucide-react";

interface ClassRow {
  id: string;
  name: string;
}

export default function RegistersBoard() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
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
        setSubmitted(new Set((att || []).map((r: any) => r.class_id)));
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

  const done = classes.filter((c) => submitted.has(c.id)).length;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Registers — {dayLabel}
          </h3>
          <p className="text-xs text-muted-foreground">
            {done} of {classes.length} submitted
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => {
          const isDone = submitted.has(c.id);
          return (
            <Link
              key={c.id}
              href={`/attendance?class=${c.id}&date=${day}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-accent"
            >
              <span className="truncate text-sm font-medium text-foreground">
                {c.name}
              </span>
              {isDone ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
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
