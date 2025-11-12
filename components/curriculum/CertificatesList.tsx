// components/curriculum/CertificatesList.tsx
"use client";

import { useState } from "react";
import { Award, Download, Eye, X } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import CertificatePreview from "./CertificatePreview";

interface Certificate {
  id: string;
  certificate_number: string;
  certificate_type: string;
  issue_date: string;
  grade: string | null;
  remarks: string | null;
  pdf_url: string | null;
  students: {
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
    arabic_name?: string;
  } | null;
  subjects: {
    id: string;
    name: string;
  } | null;
  profiles?: {
    full_name: string;
  } | null;
}

interface CertificatesListProps {
  certificates: Certificate[];
  canManage: boolean;
}

export default function CertificatesList({
  certificates,
  canManage,
}: CertificatesListProps) {
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "subject_completion":
        return "bg-blue-100 text-blue-800";
      case "memorization_completion":
        return "bg-green-100 text-green-800";
      case "academic_excellence":
        return "bg-purple-100 text-purple-800";
      case "year_completion":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      subject_completion: "Subject Completion",
      memorization_completion: "Memorization Completion",
      academic_excellence: "Academic Excellence",
      year_completion: "Year Completion",
    };
    return labels[type] || type;
  };

  const handlePrint = () => {
    window.print();
  };

  if (certificates.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground mb-2">
          No certificates issued yet
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Start recognizing student achievements
        </p>
        {canManage && (
          <a
            href="/curriculum-assessment/certificates/generate"
            className="btn-primary inline-flex"
          >
            Generate Certificate
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Certificate #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {certificates.map((cert) => (
                <tr
                  key={cert.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-mono">
                    {cert.certificate_number}
                  </td>
                  <td className="px-6 py-4">
                    {cert.students ? (
                      <div>
                        <p className="text-sm font-medium">
                          {cert.students.first_name} {cert.students.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          #{cert.students.student_number}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unknown
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getTypeColor(
                        cert.certificate_type
                      )}`}
                    >
                      {getTypeLabel(cert.certificate_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {cert.subjects ? cert.subjects.name : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDate(cert.issue_date, "short")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {cert.grade || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedCertificate(cert)}
                        className="p-1 hover:bg-accent rounded"
                        title="View Certificate"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </button>
                      {cert.pdf_url && (
                        <a
                          href={cert.pdf_url}
                          download
                          className="p-1 hover:bg-accent rounded"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4 text-green-600" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {certificates.length} certificate
            {certificates.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold">Certificate Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Certificate #{selectedCertificate.certificate_number}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="btn-outline flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="p-2 hover:bg-accent rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Certificate Preview */}
            <div className="p-6">
              <CertificatePreview
                certificate={selectedCertificate}
                schoolInfo={null}
              />
            </div>
          </div>

          {/* Print Styles */}
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #certificate-container,
              #certificate-container * {
                visibility: visible;
              }
              #certificate-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
