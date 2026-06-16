"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Award, Download, Calendar } from "lucide-react";

interface Certificate {
  id: string;
  certificate_number: string;
  certificate_type:
    | "subject_completion"
    | "memorization_completion"
    | "academic_excellence"
    | "year_completion";
  issue_date: string;
  grade?: string;
  remarks?: string;
  pdf_url?: string;
  subject_id?: string;
  subjects?: { name: string } | null;
}

const TYPE_INFO: Record<
  string,
  { label: string; emoji: string; color: string; border: string }
> = {
  subject_completion: {
    label: "Subject Completion",
    emoji: "📚",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  memorization_completion: {
    label: "Memorization",
    emoji: "🕌",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  academic_excellence: {
    label: "Academic Excellence",
    emoji: "🏆",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  year_completion: {
    label: "Year Completion",
    emoji: "🎓",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
};

export default function CertificatesTab({ studentId }: { studentId: string }) {
  const supabase = createClient();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("certificates")
        .select(
          "id, certificate_number, certificate_type, issue_date, grade, remarks, pdf_url, subject_id, subjects:subject_id(name)",
        )
        .eq("student_id", studentId)
        .order("issue_date", { ascending: false });
      setCertificates((data || []) as unknown as Certificate[]);
      setLoading(false);
    };
    fetch();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
        <Award className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
          No certificates yet
        </p>
        <p className="text-xs text-slate-400 mt-1">
          They'll appear here when earned
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Count */}
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-yellow-500" />
        <p className="font-semibold text-slate-900 dark:text-white">
          {certificates.length} Certificate
          {certificates.length !== 1 ? "s" : ""} Earned
        </p>
      </div>

      {/* List */}
      <div className="space-y-3">
        {certificates.map((cert) => {
          const info = TYPE_INFO[cert.certificate_type] || {
            label: "Certificate",
            emoji: "📜",
            color: "bg-slate-100 text-slate-700",
            border: "border-slate-200",
          };
          return (
            <div
              key={cert.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border-2 ${info.border} overflow-hidden`}
            >
              <div
                className={`${info.color} px-4 py-3 flex items-center gap-3`}
              >
                <span className="text-2xl">{info.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{info.label}</p>
                  <p className="text-xs opacity-70">
                    {cert.certificate_number}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                {cert.subjects?.name && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 text-xs">Subject: </span>
                    {cert.subjects.name}
                  </p>
                )}
                {cert.grade && (
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded text-xs font-bold">
                    Grade: {cert.grade}
                  </span>
                )}
                {cert.remarks && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    {cert.remarks}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(cert.issue_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/parent/certificate/${cert.id}/download`,
                        );
                        if (!res.ok) throw new Error("Download failed");
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `certificate-${cert.certificate_number}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        alert(
                          "Certificate download is not available yet. Please contact the school.",
                        );
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
