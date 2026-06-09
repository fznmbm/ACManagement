import type { Metadata } from "next";
import ComingSoonBanner from "@/components/public/ComingSoonBanner";

export const metadata: Metadata = {
  title:
    "Al Hikmah Institute Crawley | Islamic Education Centre in West Sussex",
  description:
    "Quality Islamic education for children in Crawley, West Sussex. Comprehensive Quran memorization, Islamic Studies, and Arabic language programs. Enroll now for 2026-2027.",
  keywords: [
    "Islamic school Crawley",
    "Madrasah West Sussex",
    "Quran classes Crawley",
    "Islamic education UK",
    "Hifz program Crawley",
    "Arabic classes West Sussex",
    "Islamic centre Crawley",
  ],
  authors: [{ name: "Al Hikmah Institute Crawley" }],
  creator: "Al Hikmah Institute Crawley",
  publisher: "Al Hikmah Institute Crawley",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://al-hikmah.org/",
    siteName: "Al Hikmah Institute Crawley",
    title: "Al Hikmah Institute Crawley | Islamic Education Centre",
    description:
      "Quality Islamic education for children in Crawley. Quran, Islamic Studies, and Arabic programs.",
    images: [
      {
        url: "https://al-hikmah.org/og-image.png",
        width: 1200,
        height: 630,
        alt: "Al Hikmah Institute Crawley",
      },
    ],
  },
  robots: { index: true, follow: true },
};

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: "Al Hikmah Institute Crawley",
            alternateName: "AHIC",
            description:
              "Islamic education centre providing Quran, Islamic Studies, and Arabic language programs for children in Crawley, West Sussex.",
            url: "https://al-hikmah.org/",
            logo: "https://al-hikmah.org/logo/logo.png",
            foundingDate: "2018",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Crawley",
              addressRegion: "West Sussex",
              addressCountry: "GB",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+44-7411-061242",
              contactType: "Admissions",
              email: "alhikmahinstitutecrawley@gmail.com",
              availableLanguage: ["English", "Arabic"],
            },
            sameAs: [
              "https://www.facebook.com/people/Al-Hikmah-Institute-Crawley-AHIC/61582802332017/",
            ],
            areaServed: { "@type": "City", name: "Crawley" },
          }),
        }}
      />

      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Welcome to{" "}
                <span className="text-primary">Al Hikmah Institute</span>{" "}
                Crawley
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Nurturing Young Muslims with Quality Islamic Education
              </p>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                Dedicated to providing quality Islamic education to the youth of
                Crawley
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
                >
                  Apply Now for 2026-2027
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-8 py-4 text-lg font-semibold text-primary hover:bg-primary/10 transition-all"
                >
                  Learn More About Us
                </Link>
              </div>
            </div>
          </div>
          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              className="w-full h-12 text-background"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        {/* <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">7+</div>
                <div className="text-sm text-muted-foreground">
                  Years Experience
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">100+</div>
                <div className="text-sm text-muted-foreground">
                  Students Enrolled
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">10+</div>
                <div className="text-sm text-muted-foreground">
                  Qualified Teachers
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">
                  Committed to Excellence
                </div>
              </div>
            </div>
          </div>
        </section> */}

        {/* Coming Soon */}
        <ComingSoonBanner />
      </div>
    </>
  );
}
