"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Users,
  Link as LinkIcon,
  UserPlus,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  parent_email: string;
  parent_name: string;
  parent_phone: string;
  classes?: {
    class_name: string;
  } | null;
  parent_links: any[];
}

export default function LinkParentsPage() {
  const supabase = createClient();

  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "linked" | "unlinked">(
    "unlinked"
  );
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, search, filter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("students")
        .select(
          `
    id,
    student_number,
    first_name,
    last_name,
    parent_email,
    parent_name,
    parent_phone,
    classes:class_id (
      id,
      name
    )
  `
        )
        .order("student_number", { ascending: true });

      if (error) {
        console.error("Query error:", error);
        throw error;
      }

      // Fetch parent links for each student
      const studentsWithLinks = await Promise.all(
        (data || []).map(async (student) => {
          const { data: links } = await supabase
            .from("parent_student_links")
            .select("id, parent_user_id")
            .eq("student_id", student.id);

          return {
            ...student,
            classes:
              student.classes &&
              Array.isArray(student.classes) &&
              student.classes.length > 0
                ? { class_name: student.classes[0].name }
                : student.classes && !Array.isArray(student.classes)
                ? { class_name: (student.classes as any).name }
                : null,
            parent_links: links || [],
          };
        })
      );

      setStudents(studentsWithLinks);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Filter by link status
    if (filter === "linked") {
      filtered = filtered.filter(
        (s) => s.parent_links && s.parent_links.length > 0
      );
    } else if (filter === "unlinked") {
      filtered = filtered.filter(
        (s) => !s.parent_links || s.parent_links.length === 0
      );
    }

    // Filter by search — null-safe (students can have no name/email/phone)
    if (search) {
      const q = search.toLowerCase();
      const has = (v: string | null | undefined) =>
        (v || "").toLowerCase().includes(q);
      filtered = filtered.filter(
        (s) =>
          has(s.first_name) ||
          has(s.last_name) ||
          has(s.student_number) ||
          has(s.parent_email) ||
          has(s.parent_name)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleLinkStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowLinkModal(true);
  };

  const stats = {
    total: students.length,
    linked: students.filter((s) => s.parent_links && s.parent_links.length > 0)
      .length,
    unlinked: students.filter(
      (s) => !s.parent_links || s.parent_links.length === 0
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  const StatusPill = ({ linked }: { linked: boolean }) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
        linked
          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
      }`}
    >
      {linked ? (
        <>
          <CheckCircle className="h-3 w-3" />
          Linked
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          Not Linked
        </>
      )}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Link Students to Parents
        </h1>
        <p className="text-muted-foreground">
          Connect students with parent portal accounts to enable parent access
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Students
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                Linked
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {stats.linked}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                Unlinked
              </p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {stats.unlinked}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, student number, or parent email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 bg-muted rounded-lg p-1">
            {(["all", "unlinked", "linked"] as const).map((f) => {
              const count =
                f === "all"
                  ? stats.total
                  : f === "linked"
                  ? stats.linked
                  : stats.unlinked;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                    filter === f
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Students list */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search
                ? "No students found matching your search"
                : filter === "unlinked"
                ? "All students are linked to parents!"
                : "No students found"}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {filteredStudents.map((student) => {
                const isLinked =
                  student.parent_links && student.parent_links.length > 0;
                return (
                  <div key={student.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {student.student_number}
                        </p>
                      </div>
                      <StatusPill linked={!!isLinked} />
                    </div>
                    <div className="mt-2 text-sm">
                      <p className="text-muted-foreground">
                        {student.classes?.class_name || "No class assigned"}
                      </p>
                      <p className="mt-1 font-medium">
                        {student.parent_name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.parent_email || "No email on file"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLinkStudent(student)}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {isLinked ? (
                        <>
                          <LinkIcon className="h-4 w-4" /> Manage Link
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" /> Link Parent
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Parent Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((student) => {
                    const isLinked =
                      student.parent_links && student.parent_links.length > 0;
                    return (
                      <tr key={student.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.student_number}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {student.classes?.class_name || "No class assigned"}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium">
                              {student.parent_name || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.parent_email || "No email on file"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.parent_phone || ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill linked={!!isLinked} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleLinkStudent(student)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            {isLinked ? (
                              <>
                                <LinkIcon className="h-4 w-4" />
                                Manage Link
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4" />
                                Link Parent
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && selectedStudent && (
        <LinkParentModal
          student={selectedStudent}
          onClose={() => {
            setShowLinkModal(false);
            setSelectedStudent(null);
            fetchStudents(); // Refresh data
          }}
        />
      )}
    </div>
  );
}

function LinkParentModal({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  const supabase = createClient();

  const [step, setStep] = useState<"search" | "create" | "confirm">("search");
  const [searchEmail, setSearchEmail] = useState(student.parent_email || "");
  const [, setSearchResults] = useState<any[]>([]);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [unlinking, setUnlinking] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  // New parent form
  const [newParentEmail, setNewParentEmail] = useState(
    student.parent_email || ""
  );
  const [newParentName, setNewParentName] = useState(student.parent_name || "");
  const [newParentPhone, setNewParentPhone] = useState(
    student.parent_phone || ""
  );

  const handleSearch = async () => {
    if (!searchEmail) {
      setError("Please enter an email address");
      return;
    }

    try {
      setSearching(true);
      setError("");

      const { data, error: searchError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("email", searchEmail.toLowerCase().trim())
        .eq("role", "parent");

      if (searchError) throw searchError;

      setSearchResults(data || []);

      if (data && data.length > 0) {
        setSelectedParent(data[0]);
        setStep("confirm");
      } else {
        setError(
          "No parent account found with this email. Would you like to create one?"
        );
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search for parent account");
    } finally {
      setSearching(false);
    }
  };

  const handleLinkExisting = async () => {
    if (!selectedParent) return;

    try {
      setLinking(true);
      setError("");

      const { data: existingLink } = await supabase
        .from("parent_student_links")
        .select("id")
        .eq("parent_user_id", selectedParent.id)
        .eq("student_id", student.id)
        .single();

      if (existingLink) {
        setError("This student is already linked to this parent");
        return;
      }

      const { error: linkError } = await supabase
        .from("parent_student_links")
        .insert({
          parent_user_id: selectedParent.id,
          student_id: student.id,
        });

      if (linkError) throw linkError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Link error:", err);
      setError("Failed to link student to parent");
    } finally {
      setLinking(false);
    }
  };

  const handleCreateAndLink = async () => {
    if (!newParentEmail || !newParentName) {
      setError("Please fill in email and name");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/admin/create-parent-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newParentEmail,
          full_name: newParentName,
          phone: newParentPhone,
          student_id: student.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create parent account");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Create error:", err);
      setError(err.message || "Failed to create parent account");
    } finally {
      setCreating(false);
    }
  };

  const handleUnlink = async () => {
    if (!student.parent_links || student.parent_links.length === 0) return;

    try {
      setUnlinking(true);
      setError("");

      const parentUserId = student.parent_links[0].parent_user_id;

      const response = await fetch("/api/admin/unlink-parent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent_user_id: parentUserId,
          student_id: student.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to unlink parent");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Unlink error:", err);
      setError(err.message || "Failed to unlink parent");
    } finally {
      setUnlinking(false);
      setShowUnlinkConfirm(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Successfully Linked!</h3>
          <p className="text-muted-foreground">
            Parent can now access student information through the parent portal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Link Parent to Student</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {student.first_name} {student.last_name} (
                {student.student_number})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Show Unlink Option for Already Linked Students */}
          {student.parent_links &&
            student.parent_links.length > 0 &&
            step === "search" && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Already Linked
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This student is currently linked to a parent account.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUnlinkConfirm(true)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            )}

          {/* Unlink Confirmation */}
          {showUnlinkConfirm && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Confirm Unlink
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Are you sure you want to unlink this student? If the parent has
                no other students linked, their account will be permanently
                deleted.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUnlinkConfirm(false)}
                  disabled={unlinking}
                  className="flex-1 px-3 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {unlinking ? "Unlinking..." : "Yes, Unlink"}
                </button>
              </div>
            </div>
          )}

          {/* Search Step */}
          {step === "search" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Search by Parent Email
                </label>
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="parent@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={searching}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? "Searching..." : "Search for Parent Account"}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">OR</span>
                </div>
              </div>

              <button
                onClick={() => setStep("create")}
                className="w-full px-4 py-2 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary/10"
              >
                Create New Parent Account
              </button>
            </div>
          )}

          {/* Confirm Link Step */}
          {step === "confirm" && selectedParent && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Parent Account Found</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Name:</span>{" "}
                    {selectedParent.full_name || "N/A"}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Email:</span>{" "}
                    {selectedParent.email}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Link this student to the parent account above?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("search");
                    setSelectedParent(null);
                  }}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkExisting}
                  disabled={linking}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {linking ? "Linking..." : "Confirm Link"}
                </button>
              </div>
            </div>
          )}

          {/* Create New Parent Step */}
          {step === "create" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Parent Email *
                </label>
                <input
                  type="email"
                  value={newParentEmail}
                  onChange={(e) => setNewParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Parent Full Name *
                </label>
                <input
                  type="text"
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={newParentPhone}
                  onChange={(e) => setNewParentPhone(e.target.value)}
                  placeholder="+44 7700 900000"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Note:</strong> A parent account will be created and
                  login credentials will be sent to the email address provided.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("search")}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-muted"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateAndLink}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create & Link Parent"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
