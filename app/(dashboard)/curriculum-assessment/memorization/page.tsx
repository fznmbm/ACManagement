// app/(dashboard)/curriculum-assessment/memorization/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MemorizationLibrary from "@/components/curriculum/MemorizationLibrary";
import Link from "next/link";
import { Plus, Brain } from "lucide-react";

export default async function MemorizationPage({
  searchParams,
}: {
  searchParams: { type?: string; level?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Build query
  let query = supabase
    .from("memorization_items")
    .select("*")
    .order("sequence_order");

  // Apply filters
  if (searchParams.type) {
    query = query.eq("item_type", searchParams.type);
  }

  if (searchParams.level) {
    query = query.eq("difficulty_level", searchParams.level);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error("Error fetching memorization items:", error);
  }

  // Get statistics
  const [
    { count: totalDuas },
    { count: totalSurahs },
    { count: totalHadiths },
  ] = await Promise.all([
    supabase
      .from("memorization_items")
      .select("*", { count: "exact", head: true })
      .eq("item_type", "dua"),
    supabase
      .from("memorization_items")
      .select("*", { count: "exact", head: true })
      .eq("item_type", "surah"),
    supabase
      .from("memorization_items")
      .select("*", { count: "exact", head: true })
      .eq("item_type", "hadith"),
  ]);

  const canManage = ["super_admin", "admin"].includes(profile?.role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Memorization Library</h2>
          <p className="text-muted-foreground">
            Manage Duas, Surahs, and Hadiths for students to memorize
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-3xl font-bold mt-1">
                {(totalDuas || 0) + (totalSurahs || 0) + (totalHadiths || 0)}
              </p>
            </div>
            <Brain className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Duas</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {totalDuas || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Surahs</p>
              <p className="text-3xl font-bold mt-1 text-blue-600">
                {totalSurahs || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Hadiths</p>
              <p className="text-3xl font-bold mt-1 text-purple-600">
                {totalHadiths || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-4">
        <Link
          href="/curriculum-assessment/memorization/track"
          className="btn-primary flex items-center space-x-2"
        >
          <Brain className="h-4 w-4" />
          <span>Track Student Progress</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <form method="GET" className="flex gap-4">
          <select
            name="type"
            defaultValue={searchParams.type}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="dua">Duas</option>
            <option value="surah">Surahs</option>
            <option value="hadith">Hadiths</option>
          </select>

          <select
            name="level"
            defaultValue={searchParams.level}
            className="form-input"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <button type="submit" className="btn-primary">
            Filter
          </button>

          {(searchParams.type || searchParams.level) && (
            <Link
              href="/curriculum-assessment/memorization"
              className="btn-outline"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Memorization Library */}
      <MemorizationLibrary items={items || []} canManage={canManage} />
    </div>
  );
}
