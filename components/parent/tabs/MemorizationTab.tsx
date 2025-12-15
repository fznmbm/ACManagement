"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Star, TrendingUp, Award } from "lucide-react";

interface MemorizationItem {
  id: string;
  name: string; // ✅ Changed from item_name
  item_type: "dua" | "surah" | "hadith";
  arabic_text?: string;
  transliteration?: string;
  translation?: string;
  reference?: string; // ✅ Added
}

interface StudentMemorization {
  id: string;
  memorization_item_id: string;
  status: "not_started" | "learning" | "memorized" | "mastered";
  proficiency_rating?: number;
  started_date?: string; // ✅ Added
  memorized_date?: string; // ✅ Added
  mastered_date?: string; // ✅ Added
  last_tested_date?: string; // ✅ Changed from last_reviewed
  test_score?: number; // ✅ Added
  teacher_notes?: string; // ✅ Changed from notes
  //memorization_items: MemorizationItem;
  memorization_items: any;
}

interface MemorizationStats {
  total: number;
  notStarted: number;
  learning: number;
  memorized: number;
  mastered: number;
  completionPercentage: number;
}

interface MemorizationTabProps {
  studentId: string;
}

export default function MemorizationTab({ studentId }: MemorizationTabProps) {
  const supabase = createClient();

  const [memorization, setMemorization] = useState<StudentMemorization[]>([]);
  const [stats, setStats] = useState<MemorizationStats>({
    total: 0,
    notStarted: 0,
    learning: 0,
    memorized: 0,
    mastered: 0,
    completionPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<
    "all" | "dua" | "surah" | "hadith"
  >("all");

  useEffect(() => {
    fetchMemorization();
  }, [studentId]);

  const fetchMemorization = async () => {
    try {
      setLoading(true);

      // Fetch student memorization progress
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
    test_score,
    teacher_notes,
    memorization_items:memorization_item_id (
      id,
      name,
      item_type,
      arabic_text,
      transliteration,
      translation,
      reference
    )
  `
        )
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setMemorization((data || []) as any);

      // Calculate statistics
      const total = data?.length || 0;
      const notStarted =
        data?.filter((m) => m.status === "not_started").length || 0;
      const learning = data?.filter((m) => m.status === "learning").length || 0;
      const memorized =
        data?.filter((m) => m.status === "memorized").length || 0;
      const mastered = data?.filter((m) => m.status === "mastered").length || 0;
      const completed = memorized + mastered;
      const completionPercentage =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      setStats({
        total,
        notStarted,
        learning,
        memorized,
        mastered,
        completionPercentage,
      });
    } catch (err) {
      console.error("Error fetching memorization:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "dua":
        return "🤲";
      case "surah":
        return "📗";
      case "hadith":
        return "💬";
      default:
        return "📄";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "dua":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
      case "surah":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "hadith":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredMemorization =
    selectedType === "all"
      ? memorization
      : memorization.filter(
          (m) => m.memorization_items.item_type === selectedType
        );

  const getTypeStats = (type: "dua" | "surah" | "hadith") => {
    const items = memorization.filter(
      (m) => m.memorization_items.item_type === type
    );
    const completed = items.filter(
      (m) => m.status === "memorized" || m.status === "mastered"
    ).length;
    return {
      total: items.length,
      completed,
      percentage:
        items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              Overall Memorization Progress
            </h3>
          </div>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            {stats.completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.completionPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          {stats.memorized + stats.mastered} out of {stats.total} items
          completed
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Not Started
            </span>
            <span className="text-2xl">⭕</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.notStarted}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Learning
            </span>
            <span className="text-2xl">📖</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {stats.learning}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Memorized
            </span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.memorized}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-600 dark:text-green-400">
              Mastered
            </span>
            <span className="text-2xl">🌟</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.mastered}
          </p>
        </div>
      </div>

      {/* Category Progress */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Progress by Category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["dua", "surah", "hadith"] as const).map((type) => {
            const typeStats = getTypeStats(type);
            return (
              <div
                key={type}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{getTypeIcon(type)}</span>
                  <h4 className="font-semibold text-slate-900 dark:text-white capitalize">
                    {type}s
                  </h4>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {typeStats.completed}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    / {typeStats.total}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${typeStats.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  {typeStats.percentage}% complete
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Memorization Items
        </h3>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Types</option>
          <option value="dua">Duas</option>
          <option value="surah">Surahs</option>
          <option value="hadith">Hadiths</option>
        </select>
      </div>

      {/* Memorization Items List */}
      {filteredMemorization.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            No memorization items found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMemorization.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-3xl">
                    {getTypeIcon(item.memorization_items.item_type)}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {item.memorization_items.name}
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(
                          item.memorization_items.item_type
                        )}`}
                      >
                        {item.memorization_items.item_type.toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                          item.status
                        )}`}
                      >
                        <span>{getStatusIcon(item.status)}</span>
                        {item.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    {item.proficiency_rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Proficiency:
                        </span>
                        {renderStars(item.proficiency_rating)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {item.memorization_items.arabic_text && (
                <div
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mb-2"
                  dir="rtl"
                >
                  <p className="text-slate-900 dark:text-white text-right text-lg leading-relaxed">
                    {item.memorization_items.arabic_text}
                  </p>
                </div>
              )}

              {item.memorization_items.transliteration && (
                <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-2">
                  {item.memorization_items.transliteration}
                </p>
              )}

              {item.memorization_items.translation && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                  {item.memorization_items.translation}
                </p>
              )}

              {item.last_tested_date && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  Last tested:{" "}
                  {new Date(item.last_tested_date).toLocaleDateString("en-GB")}
                </p>
              )}

              {item.teacher_notes && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
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
      )}
    </div>
  );
}
