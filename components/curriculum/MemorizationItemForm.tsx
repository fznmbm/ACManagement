// components/curriculum/MemorizationItemForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface MemorizationItemFormProps {
  item?: any;
}

export default function MemorizationItemForm({
  item,
}: MemorizationItemFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!item;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    item_type: item?.item_type || "dua",
    name: item?.name || "",
    arabic_text: item?.arabic_text || "",
    transliteration: item?.transliteration || "",
    translation: item?.translation || "",
    reference: item?.reference || "",
    difficulty_level: item?.difficulty_level || "beginner",
    class_level: item?.class_level || "",
    is_required: item?.is_required !== undefined ? item.is_required : true,
    sequence_order: item?.sequence_order || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        item_type: formData.item_type,
        name: formData.name,
        arabic_text: formData.arabic_text || null,
        transliteration: formData.transliteration || null,
        translation: formData.translation || null,
        reference: formData.reference || null,
        difficulty_level: formData.difficulty_level || null,
        class_level: formData.class_level || null,
        is_required: formData.is_required,
        sequence_order: formData.sequence_order
          ? parseInt(formData.sequence_order.toString())
          : 1,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("memorization_items")
          .update(payload)
          .eq("id", item.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("memorization_items")
          .insert([payload]);

        if (insertError) throw insertError;
      }

      router.push("/curriculum-assessment/memorization");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save memorization item");
      console.error("Error saving memorization item:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="item_type" className="form-label">
              Item Type *
            </label>
            <select
              id="item_type"
              name="item_type"
              value={formData.item_type}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="dua">Dua</option>
              <option value="surah">Surah</option>
              <option value="hadith">Hadith</option>
            </select>
          </div>

          <div>
            <label htmlFor="name" className="form-label">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Dua before eating"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="arabic_text" className="form-label">
            Arabic Text
          </label>
          <textarea
            id="arabic_text"
            name="arabic_text"
            value={formData.arabic_text}
            onChange={handleChange}
            className="form-input rtl text-xl font-arabic"
            rows={3}
            placeholder="بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيْمِ"
            dir="rtl"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Paste the Arabic text here
          </p>
        </div>

        <div>
          <label htmlFor="transliteration" className="form-label">
            Transliteration
          </label>
          <input
            type="text"
            id="transliteration"
            name="transliteration"
            value={formData.transliteration}
            onChange={handleChange}
            className="form-input"
            placeholder="Bismillahi ar-Rahmani ar-Raheem"
          />
          <p className="text-xs text-muted-foreground mt-1">
            English phonetic pronunciation
          </p>
        </div>

        <div>
          <label htmlFor="translation" className="form-label">
            Translation
          </label>
          <textarea
            id="translation"
            name="translation"
            value={formData.translation}
            onChange={handleChange}
            className="form-input"
            rows={3}
            placeholder="In the name of Allah, the Most Gracious, the Most Merciful"
          />
        </div>

        <div>
          <label htmlFor="reference" className="form-label">
            Reference/Source
          </label>
          <input
            type="text"
            id="reference"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Sahih Bukhari 1234, Surah Al-Baqarah 2:255"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="difficulty_level" className="form-label">
              Difficulty Level
            </label>
            <select
              id="difficulty_level"
              name="difficulty_level"
              value={formData.difficulty_level}
              onChange={handleChange}
              className="form-input"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label htmlFor="class_level" className="form-label">
              Class Level
            </label>
            <input
              type="text"
              id="class_level"
              name="class_level"
              value={formData.class_level}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., All, Beginners, Advanced"
            />
          </div>

          <div>
            <label htmlFor="sequence_order" className="form-label">
              Sequence Order
            </label>
            <input
              type="number"
              id="sequence_order"
              name="sequence_order"
              value={formData.sequence_order}
              onChange={handleChange}
              className="form-input"
              min="1"
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_required"
              name="is_required"
              checked={formData.is_required}
              onChange={handleChange}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm">
              This is a required memorization item for all students
            </span>
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center space-x-2"
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Add Item"}
          </span>
        </button>
      </div>
    </form>
  );
}
