// components/curriculum/MemorizationLibrary.tsx
"use client";

import { useState } from "react";
import { Edit, Trash2, BookOpen, Star } from "lucide-react";

interface MemorizationItem {
  id: string;
  item_type: string;
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
  const [activeTab, setActiveTab] = useState<
    "all" | "dua" | "surah" | "hadith"
  >("all");

  const filteredItems =
    activeTab === "all"
      ? items
      : items.filter((item) => item.item_type === activeTab);

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "dua":
        return "bg-green-100 text-green-800 border-green-200";
      case "surah":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "hadith":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground mb-2">
          No memorization items yet
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Start building your library of Duas, Surahs, and Hadiths
        </p>
        {canManage && (
          <a
            href="/curriculum-assessment/memorization/new"
            className="btn-primary inline-flex"
          >
            Add First Item
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-card border border-border rounded-lg p-1">
        <div className="flex space-x-1">
          {[
            { id: "all" as const, label: "All Items", count: items.length },
            {
              id: "dua" as const,
              label: "Duas",
              count: items.filter((i) => i.item_type === "dua").length,
            },
            {
              id: "surah" as const,
              label: "Surahs",
              count: items.filter((i) => i.item_type === "surah").length,
            },
            {
              id: "hadith" as const,
              label: "Hadiths",
              count: items.filter((i) => i.item_type === "hadith").length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
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
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${getTypeColor(
                    item.item_type
                  )}`}
                >
                  {item.item_type}
                </span>
                {item.is_required && (
                  <span className="flex items-center space-x-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    <Star className="h-3 w-3" />
                    <span>Required</span>
                  </span>
                )}
              </div>

              {canManage && (
                <div className="flex items-center space-x-1">
                  <button className="p-1 hover:bg-accent rounded" title="Edit">
                    <Edit className="h-4 w-4 text-green-600" />
                  </button>
                  <button
                    className="p-1 hover:bg-accent rounded"
                    title="Delete"
                    onClick={() => {
                      if (confirm(`Delete "${item.name}"?`)) {
                        alert("Delete functionality will be implemented");
                      }
                    }}
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
              <div className="bg-muted/50 rounded-lg p-3 mb-3 text-center rtl">
                <p className="text-xl font-arabic">{item.arabic_text}</p>
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
              <div className="flex items-center space-x-2">
                {item.difficulty_level && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full capitalize ${getDifficultyColor(
                      item.difficulty_level
                    )}`}
                  >
                    {item.difficulty_level}
                  </span>
                )}
              </div>
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
          <p>No items found for this category</p>
        </div>
      )}
    </div>
  );
}
