import type { Metadata } from "next";
import ComingSoonBanner from "@/components/public/ComingSoonBanner";

export const metadata: Metadata = {
  title: "Islamic Programs | Quran, Islamic Studies & Arabic Classes",
  description:
    "Explore our comprehensive Islamic education programs: Quran recitation & memorization, Islamic Studies, and Arabic language classes for ages 5-16 in Crawley.",
  keywords: [
    "Quran classes",
    "Hifz program",
    "Islamic Studies courses",
    "Arabic language lessons",
    "Tajweed classes",
    "Islamic education programs",
    "Islamic centre Crawley",
  ],
  openGraph: {
    title: "Islamic Education Programs | Al Hikmah Institute",
    description:
      "Quran, Islamic Studies, and Arabic programs for children in Crawley.",
    url: "https://al-hikmah.org/programs",
    type: "website",
  },
};

export default function ProgramsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                item: {
                  "@type": "Course",
                  name: "Quran Classes",
                  description:
                    "Learn to read, memorize, and understand the Quran with proper Tajweed",
                  provider: {
                    "@type": "EducationalOrganization",
                    name: "Al Hikmah Institute Crawley",
                  },
                },
              },
              {
                "@type": "ListItem",
                position: 2,
                item: {
                  "@type": "Course",
                  name: "Islamic Studies",
                  description:
                    "Comprehensive Islamic education covering Aqeedah, Fiqh, Seerah, and Akhlaq",
                  provider: {
                    "@type": "EducationalOrganization",
                    name: "Al Hikmah Institute Crawley",
                  },
                },
              },
              {
                "@type": "ListItem",
                position: 3,
                item: {
                  "@type": "Course",
                  name: "Arabic Language",
                  description: "Learn to read, write, and speak Arabic",
                  provider: {
                    "@type": "EducationalOrganization",
                    name: "Al Hikmah Institute Crawley",
                  },
                },
              },
            ],
          }),
        }}
      />

      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Our Programs
              </h1>

              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                We offer structured programs in Islamic education for children
                aged 7 and above.
              </p>
            </div>
          </div>
        </section>

        {/* Coming Soon */}
        <ComingSoonBanner />
      </div>
    </>
  );
}
