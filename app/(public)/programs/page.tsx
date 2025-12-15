import type { Metadata } from "next";
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

import Link from "next/link";
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Award,
  Target,
  ArrowRight,
} from "lucide-react";

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
              <p className="text-xl text-muted-foreground mb-8">
                Comprehensive Islamic education tailored for different learning
                needs
              </p>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                We offer structured programs in Quranic studies, Islamic
                education, and Arabic language for children aged 7 and above.
              </p>
            </div>
          </div>
        </section>

        {/* Main Programs */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-16">
              {/* Quran Program */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <BookOpen className="h-4 w-4" />
                    Core Program
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Quranic Studies</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Our comprehensive Quran program focuses on proper
                    recitation, memorization, and understanding of the Holy
                    Quran.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Tajweed Rules</h4>
                        <p className="text-sm text-muted-foreground">
                          Learn correct pronunciation and rules of Quranic
                          recitation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Memorization (Hifz)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Structured memorization program with regular revision
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Tafseer & Understanding
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Age-appropriate explanation of Quranic verses and
                          their meanings
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Progress Tracking
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Regular assessments and parent updates on student
                          progress
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-8">
                  <h3 className="text-xl font-semibold mb-4">
                    What Students Will Learn
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      Reading Quran fluently with Tajweed
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      Memorizing Surahs and selected verses
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      Understanding basic Quranic meanings
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      Proper etiquette of handling the Quran
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      Application of Quranic teachings in daily life
                    </li>
                  </ul>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Suitable for:</span>
                    </div>
                    <p className="text-sm">
                      All ages (7+), beginners to advanced
                    </p>
                  </div>
                </div>
              </div>

              {/* Islamic Studies Program */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 bg-muted/50 rounded-lg p-8">
                  <h3 className="text-xl font-semibold mb-4">
                    Curriculum Topics
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Aqeedah</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Pillars of Iman</li>
                        <li>• Tawheed</li>
                        <li>• Islamic beliefs</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Fiqh</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Five pillars</li>
                        <li>• Salah & Wudu</li>
                        <li>• Halal & Haram</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Seerah</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Prophet's life</li>
                        <li>• Sahabah stories</li>
                        <li>• Islamic history</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Akhlaq</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Good character</li>
                        <li>• Islamic values</li>
                        <li>• Daily conduct</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Suitable for:</span>
                    </div>
                    <p className="text-sm">Ages 7-16, all levels</p>
                  </div>
                </div>

                <div className="order-1 md:order-2">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Users className="h-4 w-4" />
                    Core Program
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Islamic Studies</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    A comprehensive Islamic education covering beliefs,
                    practices, history, and character development.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Aqeedah (Beliefs)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Understanding the six pillars of Iman and Islamic
                          creed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Fiqh (Jurisprudence)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Learning Islamic rulings and how to practice Islam
                          correctly
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Seerah (Biography)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Studying the life of Prophet Muhammad ﷺ and the
                          Companions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Akhlaq (Character)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Building strong Islamic character and moral values
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arabic Language Program */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Calendar className="h-4 w-4" />
                    Core Program
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Arabic Language</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Learn to read, write, and understand Arabic - the language
                    of the Quran and Islamic scholarship.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Arabic Alphabet & Reading
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Master the Arabic letters, vowels, and reading skills
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Writing & Handwriting
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Practice writing Arabic letters and words beautifully
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Grammar Fundamentals
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Basic Arabic grammar rules (Nahw and Sarf)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          Vocabulary & Conversation
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Build vocabulary and practice basic conversational
                          Arabic
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-8">
                  <h3 className="text-xl font-semibold mb-4">
                    Learning Outcomes
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          Level 1: Beginners
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Reading and writing Arabic letters, basic words
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          Level 2: Intermediate
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Sentences, basic grammar, extended vocabulary
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          Level 3: Advanced
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Reading Arabic texts, understanding Quranic Arabic
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Suitable for:</span>
                    </div>
                    <p className="text-sm">
                      Beginners to intermediate learners
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Class Information */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Class Information
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">Schedule</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>• Classes during school term times only</li>
                    <li>• No classes during school holidays</li>
                    <li>• No classes during Ramadan</li>
                    <li>• Students must arrive 5 minutes early</li>
                    <li>• Regular attendance is mandatory</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">Class Sizes</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>• Small class sizes for individual attention</li>
                    <li>• Age-appropriate grouping</li>
                    <li>• Qualified and experienced teachers</li>
                    <li>• Regular progress assessments</li>
                    <li>• Parent-teacher communication</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Admission Requirements
              </h2>

              <div className="bg-card border rounded-lg p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Eligibility</h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Minimum age: 7 years old</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Able to read and write English</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Commitment to regular attendance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Parental support and involvement</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      What to Bring
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Notebook and pen/pencil</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Quran (provided if needed)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Wudu for prayers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Respectful Islamic attire</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Enroll?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Start your child's Islamic education journey with us
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center rounded-lg bg-background px-8 py-4 text-lg font-semibold text-primary hover:bg-background/90 transition-all shadow-lg"
                >
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-background px-8 py-4 text-lg font-semibold text-background hover:bg-background/10 transition-all"
                >
                  Ask Questions
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
