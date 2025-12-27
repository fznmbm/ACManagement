// app/page.tsx
import { redirect } from "next/navigation";

export default async function RootPage() {
  // Always redirect to public home
  redirect("/home");
}
