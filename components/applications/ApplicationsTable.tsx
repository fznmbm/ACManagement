"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Eye, Calendar, User } from "lucide-react";

interface Application {
  id: string;
  application_number: string;
  child_first_name: string;
  child_last_name: string;
  parent_name: string;
  parent_email: string;
  status: string;
  submission_date: string;
  academic_year: string;
}

export default function ApplicationsTable({
  applications,
}: {
  applications: Application[];
}) {
  const getStatusBadge = (status: string) => {
    const styles = {
      pending:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      under_review:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      accepted:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      waitlist:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No applications found</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Application #
              </th>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Child Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Parent
              </th>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Academic Year
              </th>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Submitted
              </th>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {applications.map((application) => (
              <tr
                key={application.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="font-mono text-sm">
                    {application.application_number}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {application.child_first_name}{" "}
                      {application.child_last_name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm">
                    <div className="font-medium">{application.parent_name}</div>
                    <div className="text-muted-foreground">
                      {application.parent_email}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm">{application.academic_year}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(
                      new Date(application.submission_date),
                      "MMM dd, yyyy"
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(application.status)}
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/applications/${application.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
