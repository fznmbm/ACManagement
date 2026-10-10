// app/(dashboard)/classes/[id]/feedback/page.tsx
//
// Retired: class feedback is now part of the one messaging tool. This route
// used to be a standalone feedback screen (orphaned — nothing linked to it,
// and it duplicated the Send Update workflow). It now redirects into
// /send-update in class-feedback mode, so any old link still lands in the
// right place.
import { redirect } from "next/navigation";

export default function ClassFeedbackRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/send-update?class=${params.id}&mode=feedback`);
}
