import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply Now for 2025-2026 | Al Hikmah Institute Crawley",
  description:
    "Enroll your child at Al Hikmah Institute Crawley for the 2025-2026 academic year. Simple online application for Islamic education programs in West Sussex.",
  keywords: [
    "enroll Islamic school",
    "madrasah application",
    "Quran classes enrollment",
    "Islamic school admission Crawley",
  ],

  openGraph: {
    title: "Apply for 2025-2026 | Al Hikmah Institute Crawley",
    description: "Enroll your child for quality Islamic education in Crawley.",
    url: "https://al-hikmah.org/apply",
    type: "website",
  },
};

import { createClient } from "@/lib/supabase/server";
import ApplicationForm from "@/components/public/ApplicationForm";
import { Calendar, XCircle, CheckCircle2 } from "lucide-react";

export default async function ApplyPage() {
  const supabase = await createClient();

  // Fetch application settings
  const { data: settings } = await supabase
    .from("application_settings")
    .select("*")
    .eq("is_active", true)
    .single();

  // Check if applications are open
  const today = new Date();
  const isOpen =
    settings &&
    new Date(settings.application_open_date) <= today &&
    new Date(settings.application_close_date) >= today &&
    settings.current_applications_count < settings.max_applications;

  // Application closed - show message
  if (!isOpen || !settings) {
    const openDate = settings?.application_open_date
      ? new Date(settings.application_open_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "TBA";

    const closeDate = settings?.application_close_date
      ? new Date(settings.application_close_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "TBA";

    const isFull =
      settings &&
      settings.current_applications_count >= settings.max_applications;
    const isPastDeadline =
      settings && new Date(settings.application_close_date) < today;
    const isNotYetOpen =
      settings && new Date(settings.application_open_date) > today;

    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <XCircle className="h-20 w-20 text-destructive mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">
              Applications Currently Closed
            </h1>
          </div>

          <div className="bg-muted p-8 rounded-lg mb-8">
            {isNotYetOpen && (
              <>
                <p className="text-lg mb-4">
                  Applications for the <strong>{settings.academic_year}</strong>{" "}
                  academic year will open on:
                </p>
                <div className="flex items-center justify-center gap-2 text-primary font-semibold text-xl mb-6">
                  <Calendar className="h-6 w-6" />
                  {openDate}
                </div>
              </>
            )}

            {isPastDeadline && (
              <>
                <p className="text-lg mb-4">
                  Applications for the <strong>{settings.academic_year}</strong>{" "}
                  academic year have closed.
                </p>
                <p className="text-muted-foreground">
                  The application deadline was <strong>{closeDate}</strong>
                </p>
              </>
            )}

            {isFull && (
              <>
                <p className="text-lg mb-4">
                  We have reached our maximum capacity for the{" "}
                  <strong>{settings.academic_year}</strong> academic year.
                </p>
                <p className="text-muted-foreground">
                  All {settings.max_applications} places have been filled.
                </p>
              </>
            )}

            {!settings && (
              <p className="text-lg">
                Application information is currently being updated. Please check
                back soon.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              For more information or to be notified when applications open,
              please contact us:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:	alhikmahinstitutecrawley@gmail.com"
                className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/10 transition-all"
              >
                Email Us
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Contact Page
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Applications are OPEN - show the form
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <CheckCircle2 className="h-4 w-4" />
            Applications Open for {settings.academic_year}
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Apply to Al Hikmah Institute
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete the application form below to enroll your child
          </p>
        </div>

        {/* Application Info */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Application Deadline
              </div>
              <div className="font-semibold">
                {new Date(settings.application_close_date).toLocaleDateString(
                  "en-GB",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Academic Year
              </div>
              <div className="font-semibold">{settings.academic_year}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Places Available
              </div>
              <div className="font-semibold">
                {settings.max_applications -
                  settings.current_applications_count}{" "}
                of {settings.max_applications}
              </div>
            </div>
          </div>
        </div>

        {/* The Form Component */}
        <ApplicationForm settings={settings} />
      </div>
    </div>
  );
}
