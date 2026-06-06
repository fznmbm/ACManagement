import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AlertsDashboard from "@/components/alerts/AlertsDashboard";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto">
      <AlertsDashboard />
    </div>
  );
}
