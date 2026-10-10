// components/curriculum/ExamForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

interface ExamFormProps {
  classes: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string }>;
  /** Present when editing an existing exam. */
  exam?: {
    id: string;
    class_id: string | null;
    subject_id: string;
    title: string;
    exam_date: string;
    written_max: number;
  };
  /** Pre-selected class (e.g. opened from the class-day hub). */
  preSelectedClass?: string;
}

export default function ExamForm({
  classes,
  subjects,
  exam,
  preSelectedClass,
}: ExamFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const isEdit = Boolean(exam);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    class_id: exam?.class_id || preSelectedClass || "",
    subject_id: exam?.subject_id || "",
    title: exam?.title || "",
    exam_date: exam?.exam_date || new Date().toISOString().split("T")[0],
    written_max: exam ? String(exam.written_max) : "100",
  });

  const update = (name: string, value: string) =>
    setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const max = parseFloat(form.written_max);
    if (!form.class_id || !form.subject_id || !form.title.trim()) {
      toast.error("Please choose a class and subject and give the exam a name.");
      return;
    }
    if (isNaN(max) || max <= 0) {
      toast.error("Max marks must be a number greater than zero.");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const payload = {
        class_id: form.class_id,
        subject_id: form.subject_id,
        title: form.title.trim(),
        exam_date: form.exam_date,
        written_max: max,
      };

      if (isEdit && exam) {
        const { error } = await supabase
          .from("exams")
          .update(payload)
          .eq("id", exam.id);
        if (error) throw error;
        toast.success("Exam updated.");
        router.push(`/curriculum-assessment/exams/${exam.id}`);
        router.refresh();
      } else {
        const { data, error } = await supabase
          .from("exams")
          .insert([{ ...payload, created_by: user.id }])
          .select("id")
          .single();
        if (error) throw error;
        toast.success("Exam created — now enter the marks.");
        router.push(`/curriculum-assessment/exams/${data.id}`);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not save the exam.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="class_id" className="form-label">
            Class *
          </label>
          <select
            id="class_id"
            value={form.class_id}
            onChange={(e) => update("class_id", e.target.value)}
            className="form-input"
            required
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            The marks grid will list every active student in this class.
          </p>
        </div>

        <div>
          <label htmlFor="subject_id" className="form-label">
            Subject *
          </label>
          <select
            id="subject_id"
            value={form.subject_id}
            onChange={(e) => update("subject_id", e.target.value)}
            className="form-input"
            required
          >
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="form-label">
          Exam name *
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className="form-input"
          placeholder="e.g. Tajweed — End of term, or Surah Al-Mulk (oral)"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Each exam has one score. For a practical, just make it its own exam.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="exam_date" className="form-label">
            Date *
          </label>
          <input
            id="exam_date"
            type="date"
            value={form.exam_date}
            onChange={(e) => update("exam_date", e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div>
          <label htmlFor="written_max" className="form-label">
            Max marks *
          </label>
          <input
            id="written_max"
            type="number"
            min="1"
            step="0.5"
            value={form.written_max}
            onChange={(e) => update("written_max", e.target.value)}
            className="form-input"
            placeholder="e.g. 50"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            What each student&apos;s score is out of.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-outline"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center gap-2"
          disabled={saving}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            {saving
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create exam & enter marks"}
          </span>
        </button>
      </div>
    </form>
  );
}
