import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MemorizationLibrary from "@/components/curriculum/MemorizationLibrary";
import Link from "next/link";
import { Plus, Brain } from "lucide-react";

export default async function ProgressTrackingPage() {
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

  const { data: items, error } = await supabase
    .from("memorization_items")
    .select("*")
    .order("category_name", { ascending: true })
    .order("sequence_order", { ascending: true });

  if (error) console.error("Error fetching items:", error);

  // Get category counts dynamically
  const categories = Array.from(
    new Set((items || []).map((i: any) => i.category_name || i.item_type)),
  );

  const canManage = ["super_admin", "admin"].includes(profile?.role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Progress Tracking</h2>
          <p className="text-muted-foreground">
            Manage categories and items for student progress tracking
          </p>
        </div>
        {canManage && (
          <Link
            href="/curriculum-assessment/memorization/new"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </Link>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-3xl font-bold mt-1">{items?.length || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-3xl font-bold mt-1 text-primary">
            {categories.length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Required</p>
          <p className="text-3xl font-bold mt-1 text-yellow-600">
            {items?.filter((i: any) => i.is_required).length || 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Optional</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            {items?.filter((i: any) => !i.is_required).length || 0}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/curriculum-assessment/memorization/track"
          className="btn-primary flex items-center space-x-2"
        >
          <Brain className="h-4 w-4" />
          <span>Track Student Progress</span>
        </Link>
      </div>

      {/* Library */}
      <MemorizationLibrary items={items || []} canManage={canManage} />
    </div>
  );
}
