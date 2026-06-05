import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import MemorizationItemForm from "@/components/curriculum/MemorizationItemForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditMemorizationItemPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    redirect("/curriculum-assessment/memorization");
  }

  const { data: item, error } = await supabase
    .from("memorization_items")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !item) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href="/curriculum-assessment/memorization"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Edit Progress Item</h2>
          <p className="text-muted-foreground">
            Update this item in the progress tracking library
          </p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <MemorizationItemForm item={item} />
      </div>
    </div>
  );
}
