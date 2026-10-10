// components/curriculum/ExamsList.tsx
import Link from "next/link";
import { ClipboardList, BookOpen, Users, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";

export interface ExamRow {
  id: string;
  title: string;
  exam_date: string;
  subjectName: string;
  className: string;
  marked: number;
  classSize: number;
}

function MarkedBadge({ marked, classSize }: { marked: number; classSize: number }) {
  const complete = classSize > 0 && marked >= classSize;
  const started = marked > 0;
  const cls = complete
    ? "bg-green-100 text-green-800 border-green-200"
    : started
      ? "bg-orange-100 text-orange-800 border-orange-200"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${cls}`}>
      {marked}/{classSize} marked
    </span>
  );
}

export default function ExamsList({ exams }: { exams: ExamRow[] }) {
  if (exams.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground mb-2">No exams yet</p>
        <p className="text-sm text-muted-foreground mb-4">
          Create an exam, then enter the whole class&apos;s marks on one screen.
        </p>
        <Link
          href="/curriculum-assessment/exams/new"
          className="btn-primary inline-flex"
        >
          New exam
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Exam
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {exams.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  {formatDate(e.exam_date, "short")}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/curriculum-assessment/exams/${e.id}`}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {e.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm">{e.subjectName}</td>
                <td className="px-6 py-4 text-sm">{e.className}</td>
                <td className="px-6 py-4">
                  <MarkedBadge marked={e.marked} classSize={e.classSize} />
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/curriculum-assessment/exams/${e.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {e.marked > 0 ? "Open" : "Enter marks"} →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {exams.map((e) => (
          <Link
            key={e.id}
            href={`/curriculum-assessment/exams/${e.id}`}
            className="block bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(e.exam_date, "short")}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {e.subjectName}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {e.className}
              </span>
            </div>
            <div className="mt-3">
              <MarkedBadge marked={e.marked} classSize={e.classSize} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
