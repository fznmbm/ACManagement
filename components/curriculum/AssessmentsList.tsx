// components/curriculum/AssessmentsList.tsx
"use client";

import Link from "next/link";
import { Eye, ClipboardList } from "lucide-react";
import { getGradeColor } from "@/lib/utils/gradeCalculator";
import { formatDate } from "@/lib/utils/helpers";

interface Assessment {
  id: string;
  assessment_date: string | null;
  assessment_type: string;
  score: number;
  max_score: number;
  percentage: number;
  grade: string;
  teacher_feedback: string | null;
  students: {
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  } | null;
  subjects: {
    id: string;
    name: string;
  } | null;
}

interface AssessmentsListProps {
  assessments: Assessment[];
}

export default function AssessmentsList({ assessments }: AssessmentsListProps) {
  if (assessments.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground mb-2">
          No assessments found
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Start recording student assessments
        </p>
        <Link
          href="/curriculum-assessment/assessments/new"
          className="btn-primary inline-flex"
        >
          Record Assessment
        </Link>
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
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assessments.map((assessment) => (
              <tr
                key={assessment.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4 text-sm">
                  {assessment.assessment_date
                    ? formatDate(assessment.assessment_date, "short")
                    : "N/A"}
                </td>
                <td className="px-6 py-4">
                  {assessment.students ? (
                    <div>
                      <Link
                        href={`/students/${assessment.students.id}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {assessment.students.first_name}{" "}
                        {assessment.students.last_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        #{assessment.students.student_number}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unknown
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {assessment.subjects ? (
                    <Link
                      href={`/curriculum-assessment/subjects/${assessment.subjects.id}`}
                      className="text-primary hover:underline"
                    >
                      {assessment.subjects.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                    {assessment.assessment_type?.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {assessment.score}/{assessment.max_score}
                  <span className="text-muted-foreground ml-2">
                    ({assessment.percentage}%)
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getGradeColor(
                      assessment.grade
                    )}`}
                  >
                    {assessment.grade}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    className="p-1 hover:bg-accent rounded"
                    title="View Details"
                    onClick={() => {
                      alert("Assessment detail view coming soon");
                    }}
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {assessments.length} assessment
          {assessments.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Average: </span>
            <span className="font-medium">
              {assessments.length > 0
                ? Math.round(
                    assessments.reduce((sum, a) => sum + a.percentage, 0) /
                      assessments.length
                  )
                : 0}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
