// app/(dashboard)/curriculum-assessment/assessments/new/page.tsx
// Recording a single assessment per student is replaced by the exam + marks
// grid. Redirect into the new-exam flow (carrying a pre-selected class if one
// was passed through from the old link).
import { redirect } from "next/navigation";

export default function NewAssessmentRedirect({
  searchParams,
}: {
  searchParams: { class?: string };
}) {
  redirect(
    searchParams.class
      ? `/curriculum-assessment/exams/new?class=${searchParams.class}`
      : "/curriculum-assessment/exams/new",
  );
}
