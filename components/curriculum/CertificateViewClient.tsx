"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download } from "lucide-react";
import CertificatePreview from "./CertificatePreview";
import { createClient } from "@/lib/supabase/client";
import { exportSingleCertificatePDF } from "@/lib/utils/pdfExport";

interface CertificateViewClientProps {
  certificate: any;
  schoolInfo?: any;
}

export default function CertificateViewClient({
  certificate,
  schoolInfo: serverSchoolInfo,
}: CertificateViewClientProps) {
  const [schoolInfo, setSchoolInfo] = useState(serverSchoolInfo);

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "centre_info")
        .maybeSingle();

      if (!data) {
        console.log("❌ No data returned!");
        return;
      }

      if (!data.setting_value) {
        console.log("❌ setting_value is empty!");
        return;
      }

      let parsedSettings = data.setting_value;

      if (typeof parsedSettings === "string") {
        parsedSettings = JSON.parse(parsedSettings);
      }

      setSchoolInfo(parsedSettings);
    };

    fetchSettings();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    exportSingleCertificatePDF(certificate, schoolInfo);
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
