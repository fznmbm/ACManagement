// Memorisation tracking has been retired (folded into results).
// This route now redirects to the Learning hub.
import { redirect } from "next/navigation";

export default function MemorizationRetired() {
  redirect("/curriculum-assessment");
}
