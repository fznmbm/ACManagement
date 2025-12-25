// components/curriculum/CertificatePreview.tsx
"use client";

import { Award, BadgeCheck } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";

interface CertificatePreviewProps {
  certificate: any;
  schoolInfo?: any;
}

export default function CertificatePreview({
  certificate,
  schoolInfo,
}: CertificatePreviewProps) {
  const studentName = certificate.students
    ? `${certificate.students.first_name} ${certificate.students.last_name}`
    : "Unknown Student";

  const getCertificateTitle = () => {
    switch (certificate.certificate_type) {
      case "subject_completion":
        return "Certificate of Subject Completion";
      case "memorization_completion":
        return "Certificate of Memorization Achievement";
      case "academic_excellence":
        return "Certificate of Academic Excellence";
      case "year_completion":
        return "Certificate of Year Completion";
      default:
        return "Certificate of Achievement";
    }
  };

  const getCertificateText = () => {
    switch (certificate.certificate_type) {
      case "subject_completion":
        return `has successfully completed the study of ${
          certificate.subjects?.name || "the subject"
        }`;
      case "memorization_completion":
        return "has successfully completed the memorization requirements";
      case "academic_excellence":
        return "has demonstrated outstanding academic excellence";
      case "year_completion":
        return "has successfully completed the academic year";
      default:
        return "is hereby recognized for their achievement";
    }
  };

  const schoolName = schoolInfo?.centre_name || "Islamic Education Center";
  const schoolLogo = schoolInfo?.logo_url;
  const schoolSeal = schoolInfo?.seal_url;

  return (
    <div id="certificate-container" className="bg-white">
      {/* A4 Portrait Certificate */}
      <div
        className="max-w-[210mm] mx-auto bg-white shadow-2xl p-16 relative overflow-hidden"
        style={{ minHeight: "297mm" }}
      >
        {/* Decorative Border */}
        <div className="absolute inset-8 border-8 border-double border-yellow-600 rounded-lg" />
        <div className="absolute inset-12 border-2 border-yellow-500 rounded-lg" />

        {/* Watermark Pattern */}
        <div className="absolute inset-0 opacity-5 flex items-center justify-center">
          <Award className="w-96 h-96 text-yellow-600" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-8">
          {/* Logo & School Name */}
          <div className="flex flex-col items-center space-y-4">
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt="School Logo"
                className="h-32 w-auto object-contain max-w-[300px]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
            ) : null}
            <div
              className={`h-32 w-32 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center ${
                schoolLogo ? "hidden" : ""
              }`}
            >
              <Award className="h-16 w-16 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {schoolName}
              </h1>
              <p className="text-sm text-gray-600 tracking-widest uppercase">
                Islamic Education
              </p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="py-6 border-t-2 border-b-2 border-yellow-600">
            <h2 className="text-4xl font-serif font-bold text-yellow-700 tracking-wide">
              {getCertificateTitle()}
            </h2>
          </div>

          {/* Certificate Text */}
          <div className="space-y-6 py-8">
            <p className="text-lg text-gray-700 italic">
              This is to certify that
            </p>

            {/* Student Name */}
            <div className="space-y-3 py-4">
              <h3 className="text-5xl font-serif font-bold text-gray-800 tracking-wide">
                {studentName}
              </h3>
            </div>

            <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
              {getCertificateText()}
              {certificate.grade && (
                <span className="block mt-4 text-2xl font-bold text-yellow-700">
                  with grade: {certificate.grade}
                </span>
              )}
            </p>

            {certificate.remarks && (
              <p className="text-base text-gray-600 italic max-w-xl mx-auto mt-6">
                "{certificate.remarks}"
              </p>
            )}
          </div>

          {/* Date & Certificate Number */}
          <div className="flex justify-center items-center space-x-12 py-6">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wider mb-1">
                Date of Issue
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {formatDate(certificate.issue_date, "long")}
              </p>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wider mb-1">
                Certificate No.
              </p>
              <p className="text-lg font-mono font-semibold text-gray-800">
                {certificate.certificate_number}
              </p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="flex justify-around items-end pt-12 pb-6">
            <div className="text-center space-y-3">
              <div className="w-48 border-t-2 border-gray-400 mx-auto" />
              <div>
                <p className="font-semibold text-gray-800">
                  {certificate.profiles?.full_name || "Director"}
                </p>
                <p className="text-sm text-gray-600">Authorized Signature</p>
              </div>
            </div>

            {/* Seal */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                {schoolSeal ? (
                  <img
                    src={schoolSeal}
                    alt="Official Seal"
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}
                <div
                  className={`w-32 h-32 rounded-full border-4 border-yellow-600 flex items-center justify-center bg-yellow-50 ${
                    schoolSeal ? "hidden" : ""
                  }`}
                >
                  <BadgeCheck className="h-16 w-16 text-yellow-700" />
                </div>
                {!schoolSeal && (
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-yellow-500 animate-spin-slow"
                    style={{ animationDuration: "20s" }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                Official Seal
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-48 border-t-2 border-gray-400 mx-auto" />
              <div>
                <p className="font-semibold text-gray-800">Teacher</p>
                <p className="text-sm text-gray-600">Academic Authority</p>
              </div>
            </div>
          </div>

          {/* Footer Quote */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 italic">
              "Read! In the Name of your Lord, Who has created." - Quran 96:1
            </p>
          </div>
        </div>

        {/* Decorative Corners */}
        <div className="absolute top-20 left-20 w-16 h-16 border-l-4 border-t-4 border-yellow-600 rounded-tl-lg" />
        <div className="absolute top-20 right-20 w-16 h-16 border-r-4 border-t-4 border-yellow-600 rounded-tr-lg" />
        <div className="absolute bottom-20 left-20 w-16 h-16 border-l-4 border-b-4 border-yellow-600 rounded-bl-lg" />
        <div className="absolute bottom-20 right-20 w-16 h-16 border-r-4 border-b-4 border-yellow-600 rounded-br-lg" />
      </div>

      {/* Info Box (No Print) */}
      <div className="no-print max-w-[210mm] mx-auto mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          💡 How to use this certificate
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "Print" to print directly to paper</li>
          <li>• Use your browser's "Save as PDF" option when printing</li>
          <li>• For best results, use A4 paper in portrait orientation</li>
          <li>• You can customize the school logo in Settings</li>
        </ul>
      </div>
    </div>
  );
}
