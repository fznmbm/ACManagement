"use client";

/**
 * Enrol existing students into a class from the class page (previously you had
 * to go to the global student list). Lists active students not already in this
 * class — unassigned first — and sets their class_id in one go.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { UserPlus, Search, X, Loader2 } from "lucide-react";

interface Eligible {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  class_id: string | null;
  classes?: { name: string } | null;
}

export default function EnrolStudentsButton({ classId }: { classId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Eligible[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch("");
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_number, class_id, classes(name)")
        .eq("status", "active")
        .order("first_name");
      // Active students not already in this class; unassigned first.
      const eligible = ((data as any[]) || [])
        .filter((s) => s.class_id !== classId)
        .sort((a, b) => Number(!!a.class_id) - Number(!!b.class_id));
      setStudents(eligible as Eligible[]);
      setLoading(false);
    })();
  }, [open, classId, supabase]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const enrol = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("students")
        .update({ class_id: classId })
        .in("id", ids);
      if (error) throw error;
      toast.success(
        `Enrolled ${ids.length} student${ids.length === 1 ? "" : "s"}`,
      );
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Couldn't enrol those students.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.student_number?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
      >
        <UserPlus className="h-4 w-4" />
        Enrol students
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-semibold">Enrol students</h3>
              <button
                onClick={() => !saving && setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or number…"
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No other active students to enrol.
                </p>
              ) : (
                filtered.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      className="h-4 w-4 rounded border-input text-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{s.student_number}
                        {s.classes?.name ? ` · currently ${s.classes.name}` : " · unassigned"}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border p-4">
              <span className="text-sm text-muted-foreground">
                {selected.size} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={enrol}
                  disabled={saving || selected.size === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enrol{selected.size ? ` ${selected.size}` : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
