import EndOfClassFeedback from "@/components/feedback/EndOfClassFeedback";

export default function ClassFeedbackPage({
  params,
}: {
  params: { id: string };
}) {
  return <EndOfClassFeedback classId={params.id} />;
}
