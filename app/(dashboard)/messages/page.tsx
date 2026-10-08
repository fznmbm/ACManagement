// app/(dashboard)/messages/page.tsx
// Messaging is now one tool — "Send update". This old duplicate redirects
// there so any saved links keep working. (Its one unique feature, the
// "academic note" toggle, now lives on /send-update.)
import { redirect } from "next/navigation";

export default function MessagesPage() {
  redirect("/send-update");
}
