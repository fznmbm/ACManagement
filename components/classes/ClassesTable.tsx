// components/classes/ClassesTable.tsx
"use client";

import Link from "next/link";
import { Eye, Edit, Trash2, Users } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  capacity: number | null;
  academic_year: string | null;
  schedule: any;
  is_active: boolean;
  student_count: number;
  profiles: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface ClassesTableProps {
  classes: ClassItem[];
  userRole: string;
}

export default function ClassesTable({ classes, userRole }: ClassesTableProps) {
  const canEdit = ["super_admin", "admin"].includes(userRole);

  if (classes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground text-lg">
          No classes found. Add your first class to get started.
        </p>
        {canEdit && (
          <Link href="/classes/new" className="btn-primary mt-4 inline-flex">
            Add Class
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
                Class Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Capacity
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
            {classes.map((classItem) => (
              <tr
                key={classItem.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium">{classItem.name}</p>
                    {classItem.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {classItem.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {classItem.level || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {classItem.profiles ? (
                    <div>
                      <p className="font-medium">
                        {classItem.profiles.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {classItem.profiles.email}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      No teacher assigned
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {classItem.student_count}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {classItem.capacity || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {classItem.academic_year || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      classItem.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {classItem.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/classes/${classItem.id}`}
                      className="p-1 hover:bg-accent rounded"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Link>
                    {canEdit && (
                      <>
                        <Link
                          href={`/classes/${classItem.id}/edit`}
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
                                "Are you sure you want to delete this class?"
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

      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {classes.length} class{classes.length !== 1 ? "es" : ""}
        </p>
      </div>
    </div>
  );
}
