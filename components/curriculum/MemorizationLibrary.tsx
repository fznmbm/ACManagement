"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Trash2, BookOpen, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface MemorizationItem {
  id: string;
  item_type: string;
  category_name: string | null;
  name: string;
  arabic_text: string | null;
  transliteration: string | null;
  translation: string | null;
  reference: string | null;
  difficulty_level: string | null;
  is_required: boolean;
  sequence_order: number;
}

interface MemorizationLibraryProps {
  items: MemorizationItem[];
  canManage: boolean;
}

export default function MemorizationLibrary({
  items,
  canManage,
}: MemorizationLibraryProps) {
  const supabase = createClient();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Group items by category_name (fall back to item_type for legacy items)
  const categories = Array.from(
    new Set(items.map((i) => i.category_name || i.item_type)),
  ).sort();

  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter(
          (i) => (i.category_name || i.item_type) === activeCategory,
        );

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-orange-100 text-orange-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const { error } = await supabase
      .from("memorization_items")
      .delete()
      .eq("id", id);
    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      router.refresh();
    }
    setDeleting(null);
  };

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground mb-2">
          No progress tracking items yet
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Add categories and items for students to track
        </p>
        {canManage && (
          <Link
            href="/curriculum-assessment/memorization/new"
            className="btn-primary inline-flex"
          >
            Add First Item
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border hover:bg-accent"
          }`}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border hover:bg-accent"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)} (
            {
              items.filter((i) => (i.category_name || i.item_type) === cat)
                .length
            }
            )
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-lg p-4 hover:shadow-lg transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 text-xs font-medium rounded-full border bg-primary/10 text-primary border-primary/20 capitalize">
                  {item.category_name || item.item_type}
                </span>
                {item.is_required && (
                  <span className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    <Star className="h-3 w-3" />
                    Required
                  </span>
                )}
              </div>

              {canManage && (
                <div className="flex items-center gap-1">
                  <Link
                    href={`/curriculum-assessment/memorization/${item.id}/edit`}
                    className="p-1 hover:bg-accent rounded"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-green-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    disabled={deleting === item.id}
                    className="p-1 hover:bg-accent rounded disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Name */}
            <h4 className="font-semibold mb-2">{item.name}</h4>

            {/* Arabic Text */}
            {item.arabic_text && (
              <div className="bg-muted/50 rounded-lg p-3 mb-3 text-center">
                <p className="text-xl font-arabic" dir="rtl">
                  {item.arabic_text}
                </p>
              </div>
            )}

            {/* Transliteration */}
            {item.transliteration && (
              <p className="text-sm italic text-muted-foreground mb-2">
                {item.transliteration}
              </p>
            )}

            {/* Translation */}
            {item.translation && (
              <p className="text-sm mb-3 border-l-2 border-primary pl-2">
                {item.translation}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              {item.difficulty_level && (
                <span
                  className={`px-2 py-1 text-xs rounded-full capitalize ${getDifficultyColor(item.difficulty_level)}`}
                >
                  {item.difficulty_level}
                </span>
              )}
              {item.reference && (
                <span className="text-xs text-muted-foreground">
                  {item.reference}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No items in this category</p>
        </div>
      )}
    </div>
  );
}
