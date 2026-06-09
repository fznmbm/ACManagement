import type { Metadata } from "next";
import ComingSoonBanner from "@/components/public/ComingSoonBanner";

export const metadata: Metadata = {
  title: "About Us | Al Hikmah Institute Crawley",
  description:
    "Learn about Al Hikmah Institute Crawley's mission, values, and commitment to providing quality Islamic education in West Sussex since 2018.",
  keywords: [
    "about AHIC",
    "Islamic school history",
    "madrasah teachers",
    "Islamic education mission",
  ],
  openGraph: {
    title: "About Al Hikmah Institute Crawley",
    description:
      "Our mission, values, and commitment to quality Islamic education in Crawley.",
    url: "https://al-hikmah.org/about",
    type: "website",
  },
};

import { Target, Eye } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Al Hikmah Institute Crawley
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              With Knowledge and Faith, We Build the Future
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Al Hikmah Institute Crawley (AHIC) is dedicated to providing
              comprehensive Islamic education to children in Crawley and the
              surrounding areas of West Sussex.
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <ComingSoonBanner />
    </div>
  );
}
