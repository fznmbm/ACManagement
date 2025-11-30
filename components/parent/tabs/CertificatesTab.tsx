"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Award, Download, Calendar, FileText, Medal, Star } from "lucide-react";

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
  subjects?: {
    name: string;
  };
}

interface CertificatesTabProps {
  studentId: string;
}

export default function CertificatesTab({ studentId }: CertificatesTabProps) {
  const supabase = createClient();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    fetchCertificates();
  }, [studentId]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("certificates")
        .select(
          `
    id,
    certificate_number,
    certificate_type,
    issue_date,
    grade,
    remarks,
    pdf_url,
    subject_id,
    issued_by,
    subjects:subject_id (
      name
    )
  `
        )
        .eq("student_id", studentId)
        .order("issue_date", { ascending: false });

      if (error) throw error;

      setCertificates(data || []);
    } catch (err) {
      console.error("Error fetching certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCertificateTypeInfo = (type: string) => {
    switch (type) {
      case "subject_completion":
        return {
          label: "Subject Completion",
          icon: "📚",
          color:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
          borderColor: "border-blue-200 dark:border-blue-800",
        };
      case "memorization_completion":
        return {
          label: "Memorization Completion",
          icon: "🕌",
          color:
            "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
          borderColor: "border-green-200 dark:border-green-800",
        };
      case "academic_excellence":
        return {
          label: "Academic Excellence",
          icon: "🏆",
          color:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
          borderColor: "border-yellow-200 dark:border-yellow-800",
        };
      case "year_completion":
        return {
          label: "Year Completion",
          icon: "🎓",
          color:
            "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
          borderColor: "border-purple-200 dark:border-purple-800",
        };
      default:
        return {
          label: "Certificate",
          icon: "📜",
          color:
            "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
          borderColor: "border-slate-200 dark:border-slate-700",
        };
    }
  };

  const uniqueTypes = Array.from(
    new Set(certificates.map((c) => c.certificate_type))
  );

  const filteredCertificates =
    selectedType === "all"
      ? certificates
      : certificates.filter((c) => c.certificate_type === selectedType);

  const handleDownload = (certificate: Certificate) => {
    // In production, this would generate/download the actual certificate PDF
    console.log("Downloading certificate:", certificate.certificate_number);
    alert(
      "Certificate download functionality will be implemented with PDF generation"
    );
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
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500 rounded-full">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {certificates.length} Certificate
                {certificates.length !== 1 ? "s" : ""} Earned
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Recognition of achievements and milestones
              </p>
            </div>
          </div>
          <Medal className="h-12 w-12 text-yellow-500 opacity-50" />
        </div>
      </div>

      {/* Certificate Type Summary */}
      {uniqueTypes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {uniqueTypes.map((type) => {
            const typeInfo = getCertificateTypeInfo(type);
            const count = certificates.filter(
              (c) => c.certificate_type === type
            ).length;
            return (
              <div
                key={type}
                className={`bg-white dark:bg-slate-800 rounded-lg border ${typeInfo.borderColor} p-4`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{typeInfo.icon}</div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {count}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {typeInfo.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Type Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          All Certificates
        </h3>
        {uniqueTypes.length > 1 && (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map((type) => {
              const typeInfo = getCertificateTypeInfo(type);
              return (
                <option key={type} value={type}>
                  {typeInfo.label}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Certificates List */}
      {filteredCertificates.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Award className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            {selectedType === "all"
              ? "No certificates earned yet"
              : `No ${getCertificateTypeInfo(
                  selectedType
                ).label.toLowerCase()} certificates`}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            Keep working hard! Certificates will appear here as achievements are
            recognized.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCertificates.map((certificate) => {
            const typeInfo = getCertificateTypeInfo(
              certificate.certificate_type
            );
            return (
              <div
                key={certificate.id}
                className={`bg-white dark:bg-slate-800 rounded-lg border-2 ${typeInfo.borderColor} overflow-hidden hover:shadow-lg transition-all duration-200 group`}
              >
                {/* Certificate Header */}
                <div
                  className={`${typeInfo.color} p-4 border-b-2 ${typeInfo.borderColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{typeInfo.icon}</div>
                      <div>
                        <h4 className="font-bold text-lg">{typeInfo.label}</h4>
                        <p className="text-xs opacity-80">
                          {certificate.certificate_number}
                        </p>
                      </div>
                    </div>
                    <Star className="h-6 w-6 opacity-50" />
                  </div>
                </div>

                {/* Certificate Body */}
                <div className="p-5">
                  <div className="space-y-3 mb-4">
                    {certificate.subjects?.name && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Subject
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {certificate.subjects.name}
                        </p>
                      </div>
                    )}

                    {certificate.grade && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Grade
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          {certificate.grade}
                        </span>
                      </div>
                    )}

                    {certificate.remarks && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Remarks
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {certificate.remarks}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Issued:{" "}
                          {new Date(certificate.issue_date).toLocaleDateString(
                            "en-GB"
                          )}
                        </span>
                      </div>
                      {/* Issued by information removed - not in current schema */}
                    </div>

                    <button
                      onClick={() => handleDownload(certificate)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors group-hover:shadow-md"
                    >
                      <Download className="h-4 w-4" />
                      Download Certificate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">
              About Certificates
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Certificates are awarded for outstanding achievements, completion
              of subjects, memorization milestones, and academic excellence.
              Each certificate can be downloaded and printed for your records.
              Keep up the excellent work!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
