"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StudentsTable from "@/components/students/StudentsTable";
import StudentsHeader from "@/components/students/StudentsHeader";
import { Users, X, CheckSquare } from "lucide-react";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  parent_phone: string;
  status: string;
  classes?: {
    id: string;
    name: string;
  } | null;
}

interface Class {
  id: string;
  name: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [bulkClass, setBulkClass] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const searchParams = useSearchParams();
  const supabase = createClient();

  const search = searchParams.get("search") || "";
  const classFilter = searchParams.get("class") || "";
  const status = searchParams.get("status") || "";

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [search, classFilter, status]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("students")
        .select(`*, classes(id, name)`)
        .order("first_name", { ascending: true });

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_number.ilike.%${search}%`,
        );
      }
      if (classFilter) {
        if (classFilter === "unassigned") {
          query = query.is("class_id", null);
        } else {
          query = query.eq("class_id", classFilter);
        }
      }
      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching students:", error);
        setStudents([]);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    }
  };

  const handleStudentUpdated = () => {
    fetchStudents();
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  const handleBulkApply = async () => {
    if (selectedIds.size === 0) return;
    if (!bulkAction) return;

    if (bulkAction === "assign_class" && !bulkClass) {
      alert("Please select a class to assign");
      return;
    }
    if (bulkAction === "change_status" && !bulkStatus) {
      alert("Please select a status");
      return;
    }

    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);

      if (bulkAction === "assign_class") {
        const { error } = await supabase
          .from("students")
          .update({ class_id: bulkClass || null })
          .in("id", ids);
        if (error) throw error;
      } else if (bulkAction === "change_status") {
        const { error } = await supabase
          .from("students")
          .update({ status: bulkStatus })
          .in("id", ids);
        if (error) throw error;
      }

      setBulkAction("");
      setBulkClass("");
      setBulkStatus("");
      handleStudentUpdated();
      alert(
        `✅ Updated ${ids.length} student${ids.length > 1 ? "s" : ""} successfully`,
      );
    } catch (err: any) {
      alert("Failed to apply bulk action: " + err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const getUnassignedCount = () =>
    students.filter((s) => !s.classes?.id).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <StudentsHeader classes={classes} />
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StudentsHeader classes={classes} />

      {/* Unassigned warning */}
      {getUnassignedCount() > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-orange-600">⚠️</span>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>{getUnassignedCount()}</strong> student
              {getUnassignedCount() !== 1 ? "s" : ""} need class assignment
            </p>
            <a
              href="/students?class=unassigned"
              className="text-orange-600 hover:underline text-sm font-medium ml-2"
            >
              View →
            </a>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedIds.size} student{selectedIds.size > 1 ? "s" : ""}{" "}
                selected
              </span>
            </div>

            <select
              value={bulkAction}
              onChange={(e) => {
                setBulkAction(e.target.value);
                setBulkClass("");
                setBulkStatus("");
              }}
              className="text-sm px-3 py-1.5 border border-input rounded-lg bg-background"
            >
              <option value="">Select action...</option>
              <option value="assign_class">Assign to Class</option>
              <option value="change_status">Change Status</option>
            </select>

            {bulkAction === "assign_class" && (
              <select
                value={bulkClass}
                onChange={(e) => setBulkClass(e.target.value)}
                className="text-sm px-3 py-1.5 border border-input rounded-lg bg-background"
              >
                <option value="">Select class...</option>
                <option value="">Remove from class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            )}

            {bulkAction === "change_status" && (
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="text-sm px-3 py-1.5 border border-input rounded-lg bg-background"
              >
                <option value="">Select status...</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            )}

            {bulkAction && (
              <button
                onClick={handleBulkApply}
                disabled={bulkLoading}
                className="btn-primary text-sm px-4 py-1.5"
              >
                {bulkLoading ? "Applying..." : "Apply"}
              </button>
            )}

            <button
              onClick={() => {
                setSelectedIds(new Set());
                setBulkAction("");
              }}
              className="ml-auto text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-4 w-4" /> Clear selection
            </button>
          </div>
        </div>
      )}

      <StudentsTable
        students={students}
        onStudentUpdated={handleStudentUpdated}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
      />
    </div>
  );
}
