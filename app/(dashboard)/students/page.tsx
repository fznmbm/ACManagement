"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StudentsTable from "@/components/students/StudentsTable";
import StudentsHeader from "@/components/students/StudentsHeader";

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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get search parameters
  const search = searchParams.get("search") || "";
  const classFilter = searchParams.get("class") || "";
  const status = searchParams.get("status") || "";

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [search, classFilter, status]); // Re-fetch when filters change

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Build query
      let query = supabase
        .from("students")
        .select(
          `
          *,
          classes (
            id,
            name
          )
        `
        )
        .order("first_name", { ascending: true });

      // Apply filters
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_number.ilike.%${search}%`
        );
      }

      if (classFilter) {
        if (classFilter === "unassigned") {
          query = query.is("class_id", null);
        } else {
          query = query.eq("class_id", classFilter);
        }
      }

      if (status) {
        query = query.eq("status", status);
      }

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

  const getUnassignedCount = () => {
    return students.filter((student) => !student.classes?.id).length;
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
    // Refresh students data without changing filters
    fetchStudents();
  };

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
      {/* Add the warning banner here */}
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

      <StudentsTable
        students={students}
        onStudentUpdated={handleStudentUpdated}
      />
    </div>
  );
}
