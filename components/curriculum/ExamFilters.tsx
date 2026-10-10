// components/curriculum/ExamFilters.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";

interface ExamFiltersProps {
  classes: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string }>;
}

export default function ExamFilters({ classes, subjects }: ExamFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedClass, setSelectedClass] = useState(
    searchParams.get("class") || "",
  );
  const [selectedSubject, setSelectedSubject] = useState(
    searchParams.get("subject") || "",
  );
  const [fromDate, setFromDate] = useState(searchParams.get("from") || "");
  const [toDate, setToDate] = useState(searchParams.get("to") || "");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedClass) params.set("class", selectedClass);
    if (selectedSubject) params.set("subject", selectedSubject);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const qs = params.toString();
    router.push(`/curriculum-assessment/exams${qs ? `?${qs}` : ""}`);
  };

  const clearFilters = () => {
    setSelectedClass("");
    setSelectedSubject("");
    setFromDate("");
    setToDate("");
    router.push("/curriculum-assessment/exams");
  };

  const hasActiveFilters =
    selectedClass || selectedSubject || fromDate || toDate;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-destructive hover:underline flex items-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="form-label text-xs">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="form-input text-sm"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label text-xs">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="form-input text-sm"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label text-xs">From date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="form-input text-sm"
          />
        </div>

        <div>
          <label className="form-label text-xs">To date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="form-input text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-end mt-4">
        <button onClick={applyFilters} className="btn-primary text-sm">
          Apply filters
        </button>
      </div>
    </div>
  );
}
