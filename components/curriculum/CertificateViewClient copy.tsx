// components/curriculum/CertificateViewClient.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, Printer, Download } from "lucide-react";
import CertificatePreview from "./CertificatePreview";

interface CertificateViewClientProps {
  certificate: any;
  schoolInfo?: any;
}

export default function CertificateViewClient({
  certificate,
  schoolInfo,
}: CertificateViewClientProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("PDF download will be implemented. For now, use Print > Save as PDF");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center space-x-4">
          <Link
            href="/curriculum-assessment/certificates"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Certificate Preview</h2>
            <p className="text-muted-foreground">
              Certificate #{certificate.certificate_number}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="btn-outline flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Certificate Preview */}
      <CertificatePreview certificate={certificate} schoolInfo={schoolInfo} />

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
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
