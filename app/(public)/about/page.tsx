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

      {/* Mission & Vision */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Mission */}
            <div className="bg-card border rounded-lg p-8">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To provide quality Islamic education that nurtures young Muslims
                with strong faith, moral character, and comprehensive knowledge
                of the Quran, Arabic language, and Islamic principles.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We strive to create a supportive learning environment where
                students develop a deep connection with their Islamic identity
                while excelling academically and spiritually.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-card border rounded-lg p-8">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To be a leading center of Islamic education in West Sussex,
                recognized for excellence in Quranic studies, Islamic
                scholarship, and character development.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We envision a future generation of confident, knowledgeable
                Muslims who contribute positively to society while maintaining
                strong Islamic values and principles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <ComingSoonBanner />
    </div>
  );
}
