// app/(dashboard)/curriculum-assessment/assessments/page.tsx
// "Assessments" is now "Results", built around exams. This old route redirects
// to the new Results list so existing links keep working.
import { redirect } from "next/navigation";

export default function AssessmentsRedirect() {
  redirect("/curriculum-assessment/exams");
}
