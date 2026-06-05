"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Star, Award } from "lucide-react";

interface StudentMemorization {
  id: string;
  memorization_item_id: string;
  status: "not_started" | "learning" | "memorized" | "mastered";
  proficiency_rating?: number;
  started_date?: string;
  memorized_date?: string;
  mastered_date?: string;
  last_tested_date?: string;
  teacher_notes?: string;
  memorization_items: any;
}

interface MemorizationTabProps {
  studentId: string;
}

export default function MemorizationTab({ studentId }: MemorizationTabProps) {
  const supabase = createClient();
  const [memorization, setMemorization] = useState<StudentMemorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchMemorization();
  }, [studentId]);

  const fetchMemorization = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("student_memorization")
        .select(
          `
          id,
          memorization_item_id,
          status,
          proficiency_rating,
          started_date,
          memorized_date,
          mastered_date,
          last_tested_date,
          teacher_notes,
          memorization_items:memorization_item_id (
            id,
            name,
            item_type,
            category_name,
            arabic_text,
            transliteration,
            translation,
            reference
          )
        `,
        )
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setMemorization((data || []) as any);
    } catch (err) {
      console.error("Error fetching memorization:", err);
    } finally {
      setLoading(false);
    }
  };

  const getItemCategory = (item: StudentMemorization) =>
    item.memorization_items?.category_name ||
    item.memorization_items?.item_type ||
    "general";

  // Dynamic categories from data
  const categories = Array.from(
    new Set(memorization.map((m) => getItemCategory(m))),
  ).sort();

  const filtered =
    selectedCategory === "all"
      ? memorization
      : memorization.filter((m) => getItemCategory(m) === selectedCategory);

  const total = memorization.length;
  const completed = memorization.filter(
    (m) => m.status === "memorized" || m.status === "mastered",
  ).length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "mastered":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "memorized":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "learning":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "mastered":
        return "🌟";
      case "memorized":
        return "✅";
      case "learning":
        return "📖";
      default:
        return "⭕";
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-slate-200 text-slate-200 dark:fill-slate-700"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (memorization.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
        <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">
          No progress tracking items recorded yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Overall Progress
            </h3>
          </div>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            {completionPct}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          {completed} out of {total} items completed
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Not Started",
            key: "not_started",
            icon: "⭕",
            color: "slate",
          },
          { label: "Learning", key: "learning", icon: "📖", color: "yellow" },
          { label: "Memorized", key: "memorized", icon: "✅", color: "blue" },
          { label: "Mastered", key: "mastered", icon: "🌟", color: "green" },
        ].map(({ label, key, icon }) => (
          <div
            key={key}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center"
          >
            <span className="text-2xl">{icon}</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {memorization.filter((m) => m.status === key).length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Category Progress */}
      {categories.length > 1 && (
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
            Progress by Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const catItems = memorization.filter(
                (m) => getItemCategory(m) === cat,
              );
              const catCompleted = catItems.filter(
                (m) => m.status === "memorized" || m.status === "mastered",
              ).length;
              const catPct =
                catItems.length > 0
                  ? Math.round((catCompleted / catItems.length) * 100)
                  : 0;
              return (
                <div
                  key={cat}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
                >
                  <h4 className="font-medium text-slate-900 dark:text-white capitalize mb-2">
                    {cat}
                  </h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {catCompleted}
                    </span>
                    <span className="text-sm text-slate-500">
                      / {catItems.length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{catPct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter + Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            All Items
          </h3>
          {categories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary capitalize">
                      {getItemCategory(item)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status)}{" "}
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {item.memorization_items?.name}
                  </h4>
                  {item.proficiency_rating && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        Proficiency:
                      </span>
                      {renderStars(item.proficiency_rating)}
                    </div>
                  )}
                </div>
              </div>

              {item.memorization_items?.arabic_text && (
                <div
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mt-2"
                  dir="rtl"
                >
                  <p className="text-slate-900 dark:text-white text-right text-base leading-relaxed">
                    {item.memorization_items.arabic_text}
                  </p>
                </div>
              )}

              {item.memorization_items?.transliteration && (
                <p className="text-sm text-slate-500 italic mt-1">
                  {item.memorization_items.transliteration}
                </p>
              )}

              {item.memorization_items?.translation && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  {item.memorization_items.translation}
                </p>
              )}

              {item.teacher_notes && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 font-medium">
                    Teacher's Notes:
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {item.teacher_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
