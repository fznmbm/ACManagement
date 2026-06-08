import type { Metadata } from "next";
import ComingSoonBanner from "@/components/public/ComingSoonBanner";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Al Hikmah Institute Crawley",
  description:
    "Common questions about enrollment, classes, fees, and programs at Al Hikmah Institute Crawley Islamic Education Centre.",
  keywords: [
    "Islamic school FAQ",
    "madrasah questions",
    "Quran classes Crawley",
    "Islamic education enrollment",
  ],
};

export default function FAQPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about Al Hikmah Institute
              Crawley. Can't find what you're looking for?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <ComingSoonBanner />
    </div>
  );
}
