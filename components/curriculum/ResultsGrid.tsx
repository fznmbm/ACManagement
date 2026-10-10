// components/curriculum/ResultsGrid.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Loader2, Save, Users } from "lucide-react";
import {
  calculateGrade,
  calculatePercentage,
  getGradeColor,
} from "@/lib/utils/gradeCalculator";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
}

interface ExistingResult {
  id: string;
  student_id: string;
  written_score: number | string | null;
}

interface ResultsGridProps {
  exam: {
    id: string;
    subject_id: string;
    class_id: string | null;
    exam_date: string;
    written_max: number;
  };
  students: Student[];
  existing: ExistingResult[];
}

type Baseline = Record<string, { id: string; score: number }>;

export default function ResultsGrid({
  exam,
  students,
  existing,
}: ResultsGridProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const max = Number(exam.written_max);

  // baseline = what's currently saved in the DB, keyed by student_id.
  const [baseline, setBaseline] = useState<Baseline>(() => {
    const map: Baseline = {};
    for (const r of existing) {
      if (r.written_score !== null && r.written_score !== undefined) {
        map[r.student_id] = { id: r.id, score: Number(r.written_score) };
      }
    }
    return map;
  });

  // editable values, keyed by student_id (string so the box can be emptied).
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of students) {
      const b = baseline[s.id];
      map[s.id] = b ? String(b.score) : "";
    }
    return map;
  });

  const [saving, setSaving] = useState(false);

  const setValue = (studentId: string, value: string) =>
    setValues((v) => ({ ...v, [studentId]: value }));

  // How many rows differ from what's saved — drives the Save button.
  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const s of students) {
      const raw = values[s.id]?.trim() ?? "";
      const b = baseline[s.id];
      if (raw === "") {
        if (b) n++; // cleared an existing score
      } else {
        const parsed = parseFloat(raw);
        if (!b || isNaN(parsed) || parsed !== b.score) n++;
      }
    }
    return n;
  }, [values, baseline, students]);

  const enteredCount = useMemo(
    () => students.filter((s) => (values[s.id]?.trim() ?? "") !== "").length,
    [values, students],
  );

  const rowMeta = (studentId: string) => {
    const raw = values[studentId]?.trim() ?? "";
    if (raw === "") return null;
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) return null;
    const pct = calculatePercentage(parsed, max);
    const grade = calculateGrade(pct);
    const invalid = parsed < 0 || parsed > max;
    return { parsed, pct, grade, invalid };
  };

  const handleSave = async () => {
    // Validate every entered score first, so nothing partial gets written.
    for (const s of students) {
      const raw = values[s.id]?.trim() ?? "";
      if (raw === "") continue;
      const parsed = parseFloat(raw);
      if (isNaN(parsed) || parsed < 0 || parsed > max) {
        toast.error(
          `${s.first_name} ${s.last_name}: score must be between 0 and ${max}.`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const toInsert: any[] = [];
      const toUpdate: { id: string; score: number }[] = [];
      const toDeleteIds: string[] = [];

      for (const s of students) {
        const raw = values[s.id]?.trim() ?? "";
        const b = baseline[s.id];

        if (raw === "") {
          if (b) toDeleteIds.push(b.id);
          continue;
        }

        const parsed = parseFloat(raw);
        if (b) {
          if (parsed !== b.score) toUpdate.push({ id: b.id, score: parsed });
        } else {
          toInsert.push({ student_id: s.id, score: parsed });
        }
      }

      // Shared fields written on every insert/update. We also fill the legacy
      // score/percentage/grade columns so the parent view and older reports
      // keep rendering until those read-paths move to the exam model.
      const commonFor = (score: number) => {
        const pct = calculatePercentage(score, max);
        return {
          exam_id: exam.id,
          written_score: score,
          recorded_by: user.id,
          subject_id: exam.subject_id,
          class_id: exam.class_id,
          assessment_type: "exam",
          assessment_date: exam.exam_date,
          score,
          max_score: max,
          percentage: pct,
          grade: calculateGrade(pct),
        };
      };

      if (toInsert.length) {
        const rows = toInsert.map((r) => ({
          student_id: r.student_id,
          ...commonFor(r.score),
        }));
        const { error } = await supabase.from("academic_progress").insert(rows);
        if (error) throw error;
      }

      if (toUpdate.length) {
        const results = await Promise.all(
          toUpdate.map((u) =>
            supabase
              .from("academic_progress")
              .update(commonFor(u.score))
              .eq("id", u.id),
          ),
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) throw failed.error;
      }

      if (toDeleteIds.length) {
        const { error } = await supabase
          .from("academic_progress")
          .delete()
          .in("id", toDeleteIds);
        if (error) throw error;
      }

      // Re-sync the baseline from the DB so subsequent saves diff correctly.
      const { data: fresh } = await supabase
        .from("academic_progress")
        .select("id, student_id, written_score")
        .eq("exam_id", exam.id);

      const nextBaseline: Baseline = {};
      for (const r of fresh || []) {
        if (r.written_score !== null && r.written_score !== undefined) {
          nextBaseline[r.student_id] = {
            id: r.id as string,
            score: Number(r.written_score),
          };
        }
      }
      setBaseline(nextBaseline);

      const saved = toInsert.length + toUpdate.length;
      const cleared = toDeleteIds.length;
      toast.success(
        cleared
          ? `Saved ${saved} and cleared ${cleared}.`
          : `Saved marks for ${saved} student${saved === 1 ? "" : "s"}.`,
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Could not save the marks.");
    } finally {
      setSaving(false);
    }
  };

  if (students.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground mb-1">
          No active students in this class
        </p>
        <p className="text-sm text-muted-foreground">
          Enrol students in the class first, then come back to enter marks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Score / {max}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Grade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((s) => {
              const meta = rowMeta(s.id);
              return (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      #{s.student_number}
                    </p>
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max={max}
                      step="0.5"
                      value={values[s.id] ?? ""}
                      onChange={(e) => setValue(s.id, e.target.value)}
                      placeholder="—"
                      className={`form-input w-28 ${
                        meta?.invalid
                          ? "border-destructive focus:ring-destructive"
                          : ""
                      }`}
                    />
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {meta ? `${meta.pct}%` : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    {meta ? (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getGradeColor(
                          meta.grade,
                        )}`}
                      >
                        {meta.grade}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {students.map((s) => {
          const meta = rowMeta(s.id);
          return (
            <div
              key={s.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{s.student_number}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max={max}
                    step="0.5"
                    value={values[s.id] ?? ""}
                    onChange={(e) => setValue(s.id, e.target.value)}
                    placeholder="—"
                    className={`form-input w-20 text-center ${
                      meta?.invalid
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }`}
                  />
                  <span className="text-sm text-muted-foreground">/ {max}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm">
                {meta ? (
                  <>
                    <span className="text-muted-foreground">{meta.pct}%</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getGradeColor(
                        meta.grade,
                      )}`}
                    >
                      {meta.grade}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No mark yet
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {enteredCount} of {students.length} marked
            {dirtyCount > 0 && (
              <span className="ml-2 text-foreground font-medium">
                · {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}
              </span>
            )}
          </p>
          <button
            onClick={handleSave}
            disabled={saving || dirtyCount === 0}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? "Saving…" : "Save all"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
