// components/curriculum/SubjectsTable.tsx
"use client";

import Link from "next/link";
import { Eye, Edit, Trash2, BookOpen } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  description: string | null;
  academic_year: string | null;
  duration_weeks: number | null;
  is_active: boolean;
  topic_count: number;
  classes: {
    id: string;
    name: string;
  } | null;
}

interface SubjectsTableProps {
  subjects: Subject[];
  canManage: boolean;
}

export default function SubjectsTable({
  subjects,
  canManage,
}: SubjectsTableProps) {
  if (subjects.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground mb-2">No subjects found</p>
        <p className="text-sm text-muted-foreground mb-4">
          Get started by creating your first subject
        </p>
        {canManage && (
          <Link
            href="/curriculum-assessment/subjects/new"
            className="btn-primary inline-flex"
          >
            Add Subject
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Subject Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Topics
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Academic Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subjects.map((subject) => (
              <tr
                key={subject.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium">{subject.name}</p>
                    {subject.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {subject.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {subject.classes ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {subject.classes.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">
                      All classes
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{subject.topic_count} topics</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {subject.duration_weeks
                    ? `${subject.duration_weeks} weeks`
                    : "-"}
                </td>
                <td className="px-6 py-4 text-sm">
                  {subject.academic_year || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      subject.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {subject.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/curriculum-assessment/subjects/${subject.id}`}
                      className="p-1 hover:bg-accent rounded"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Link>
                    {canManage && (
                      <>
                        <Link
                          href={`/curriculum-assessment/subjects/${subject.id}/edit`}
                          className="p-1 hover:bg-accent rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-green-600" />
                        </Link>
                        <button
                          className="p-1 hover:bg-accent rounded"
                          title="Delete"
                          onClick={() => {
                            if (
                              confirm(
                                `Delete subject "${subject.name}"? This will also delete all topics.`
                              )
                            ) {
                              alert(
                                "Delete functionality will be implemented in edit page"
                              );
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Showing {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
