import Link from "next/link";
import {
  BookOpen,
  Heart,
  Users,
  Award,
  Target,
  Eye,
  ArrowRight,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Al Hikma Institute Crawley
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              With Knowledge and Faith, We Build the Future
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Al Hikma Institute Crawley (AHIC) is dedicated to providing
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

      {/* Our Values */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Seeking and sharing authentic Islamic knowledge based on Quran
                and Sunnah
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Faith</h3>
              <p className="text-sm text-muted-foreground">
                Strengthening Iman through understanding and practicing Islamic
                teachings
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community</h3>
              <p className="text-sm text-muted-foreground">
                Building a supportive Muslim community focused on growth and
                development
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Excellence</h3>
              <p className="text-sm text-muted-foreground">
                Striving for the highest standards in education and character
                development
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive Islamic education for children
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Quranic Studies</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Quran reading with proper Tajweed
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Memorization (Hifz) program
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Tafseer and Quranic understanding
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Regular revision and assessment
                </li>
              </ul>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Islamic Studies</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Aqeedah (Islamic beliefs)
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Fiqh (Islamic jurisprudence)
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Seerah (Prophet's biography)
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Akhlaq (Character development)
                </li>
              </ul>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Arabic Language</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Arabic reading and writing
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Grammar fundamentals
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Vocabulary building
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Conversational Arabic
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Class Schedule */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Class Schedule
              </h2>
              <p className="text-lg text-muted-foreground">
                Convenient timing for working families
              </p>
            </div>

            <div className="bg-card border rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Class Times</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>Classes are held during school term times</p>
                    <p className="font-medium text-foreground">
                      📅 Days: [To be confirmed]
                    </p>
                    <p className="font-medium text-foreground">
                      🕐 Time: [To be confirmed]
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Important Notes
                  </h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      No classes during school holidays
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      No classes during Ramadan
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      Students should arrive 5 minutes early
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      Regular parent meetings held
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Teachers */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Teachers
            </h2>
            <p className="text-lg text-muted-foreground">
              Qualified and experienced Islamic educators
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-card border rounded-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Qualifications</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Qualified in Islamic studies
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Certified in Quranic Tajweed
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Experience in teaching children
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    DBS checked
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Teaching Approach
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Student-centered learning
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Interactive and engaging methods
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Regular progress assessments
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Personalized attention
                  </li>
                </ul>
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
              Join Our Community
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Enroll your child in quality Islamic education
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
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
