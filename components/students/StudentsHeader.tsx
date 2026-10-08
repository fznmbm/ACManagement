// components/students/StudentsHeader.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Plus, Download, Link as LinkIcon, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import * as XLSX from "xlsx";
import { calculateAge } from "@/lib/utils/helpers";

interface StudentsHeaderProps {
  classes: Array<{ id: string; name: string }>;
  students: any[];
}

export default function StudentsHeader({
  classes,
  students,
}: StudentsHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedClass, setSelectedClass] = useState(
    searchParams.get("class") || "",
  );
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "",
  );
  const [unlinkedCount, setUnlinkedCount] = useState<number>(0);

  // Count students with no parent link (for the Link Parents badge).
  useEffect(() => {
    const fetchUnlinkedCount = async () => {
      try {
        const { data } = await supabase
          .from("students")
          .select(`id, parent_student_links ( id )`)
          .eq("status", "active");
        if (!data) return;
        setUnlinkedCount(
          data.filter(
            (s: any) =>
              !s.parent_student_links || s.parent_student_links.length === 0,
          ).length,
        );
      } catch (error) {
        console.error("Error fetching unlinked count:", error);
      }
    };
    fetchUnlinkedCount();
  }, [supabase]);

  // Live filters: push to the URL (debounced) whenever a filter changes.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedClass) params.set("class", selectedClass);
      if (selectedStatus) params.set("status", selectedStatus);
      const qs = params.toString();
      router.push(qs ? `/students?${qs}` : "/students");
    }, 300);
    return () => clearTimeout(t);
  }, [search, selectedClass, selectedStatus, router]);

  const clearFilters = () => {
    setSearch("");
    setSelectedClass("");
    setSelectedStatus("");
  };

  const handleExport = () => {
    if (!students || students.length === 0) {
      toast.error("No students to export");
      return;
    }
    const rows = students.map((s) => ({
      "Student #": s.student_number,
      "First Name": s.first_name,
      "Last Name": s.last_name,
      Age: s.date_of_birth ? calculateAge(s.date_of_birth) : "",
      Gender: s.gender,
      Class: s.classes?.name || "Unassigned",
      "Parent Contact": s.parent_phone,
      Status: s.status,
      "Portal Status": s.portalStatus || "no_account",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(
      workbook,
      `students-export-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const hasActiveFilters = search || selectedClass || selectedStatus;

  return (
    <div className="space-y-4">
      {/* Title and actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">All Students</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track all students in your centre
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href="/students/link-parents"
            className="relative flex items-center gap-2 rounded-lg border-2 border-primary px-4 py-2 font-medium text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <LinkIcon className="h-4 w-4" />
            <span>Link Parents</span>
            {unlinkedCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full border-2 border-background bg-red-500 px-1.5 text-xs font-bold text-white">
                {unlinkedCount}
              </span>
            )}
          </Link>

          <Link
            href="/students/new"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </Link>
        </div>
      </div>

      {/* Search and filters — apply live, no buttons */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or student number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-10 min-w-[130px] flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All classes</option>
              <option value="unassigned">Unassigned</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 min-w-[120px] flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={handleExport}
            className="btn-outline flex h-10 items-center gap-1 text-sm sm:ml-auto"
            title="Export to Excel"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
