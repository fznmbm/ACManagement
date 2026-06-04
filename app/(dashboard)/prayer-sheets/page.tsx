import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminPrayerSheets from "@/components/prayer/AdminPrayerSheets";

export default async function PrayerSheetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPrayerSheets />
    </div>
  );
}
