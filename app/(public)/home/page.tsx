import Link from "next/link";
import {
  BookOpen,
  Users,
  Award,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Welcome to{" "}
              <span className="text-primary">Al Hikmah Institute</span> Crawley
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Nurturing Young Muslims with Quality Islamic Education
            </p>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              We provide comprehensive Islamic education for children, combining
              Quranic studies, Arabic language, and Islamic values in a
              supportive learning environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
              >
                Apply Now for 2025-2026
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
            ></path>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background">
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
      </section>

      {/* About Preview Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              About Al Hikmah Institute Crawley
            </h2>
            <p className="text-lg text-muted-foreground">
              Dedicated to providing quality Islamic education to the youth of
              Crawley
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                At Al Hikmah Institute Crawley (AHIC), we are committed to
                nurturing the Islamic identity of young Muslims by providing
                comprehensive religious education. We combine traditional
                Islamic teachings with modern educational approaches to create
                an engaging and effective learning environment.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our dedicated team of qualified teachers work tirelessly to
                ensure every student receives personalized attention and
                develops a strong foundation in Islamic knowledge, Quranic
                studies, and Arabic language.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center text-primary font-semibold hover:underline"
              >
                Learn more about us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-background rounded-lg border shadow-sm">
                <BookOpen className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Quranic Education</h4>
                <p className="text-sm text-muted-foreground">
                  Comprehensive Quran memorization and recitation with proper
                  Tajweed
                </p>
              </div>
              <div className="p-6 bg-background rounded-lg border shadow-sm">
                <Users className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Islamic Studies</h4>
                <p className="text-sm text-muted-foreground">
                  In-depth study of Islamic principles, history, and
                  contemporary issues
                </p>
              </div>
              <div className="p-6 bg-background rounded-lg border shadow-sm">
                <Award className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Character Development</h4>
                <p className="text-sm text-muted-foreground">
                  Building strong Islamic character and values in our students
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Programs
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive Islamic education tailored for different age groups
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Program Card 1 */}
            <div className="group p-8 bg-card rounded-lg border shadow-sm hover:shadow-lg transition-all hover:border-primary">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Quran Classes</h3>
              <p className="text-muted-foreground mb-4">
                Learn to read, memorize, and understand the Quran with proper
                Tajweed and pronunciation.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Tajweed rules</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Hifz program</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Quran recitation</span>
                </li>
              </ul>
            </div>

            {/* Program Card 2 */}
            <div className="group p-8 bg-card rounded-lg border shadow-sm hover:shadow-lg transition-all hover:border-primary">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Islamic Studies</h3>
              <p className="text-muted-foreground mb-4">
                Comprehensive Islamic education covering Aqeedah, Fiqh, Seerah,
                and Akhlaq.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Islamic beliefs</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Prophet's life</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Islamic jurisprudence</span>
                </li>
              </ul>
            </div>

            {/* Program Card 3 */}
            <div className="group p-8 bg-card rounded-lg border shadow-sm hover:shadow-lg transition-all hover:border-primary">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Arabic Language</h3>
              <p className="text-muted-foreground mb-4">
                Learn to read, write, and speak Arabic, the language of the
                Quran and Islam.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Arabic alphabet</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Grammar basics</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Conversational Arabic</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/programs"
              className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/10 transition-all"
            >
              View All Programs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Al Hikmah Institute?
            </h2>
            <p className="text-lg text-muted-foreground">
              We are committed to excellence in Islamic education
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Qualified Teachers</h3>
              <p className="text-sm text-muted-foreground">
                Experienced educators with strong Islamic knowledge and teaching
                skills
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Small Class Sizes</h3>
              <p className="text-sm text-muted-foreground">
                Individual attention with manageable student-teacher ratios
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Structured Curriculum</h3>
              <p className="text-sm text-muted-foreground">
                Well-planned syllabus aligned with Islamic education standards
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Safe Environment</h3>
              <p className="text-sm text-muted-foreground">
                Nurturing and supportive atmosphere for all students
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Enroll Your Child?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join our community of dedicated students and families pursuing
              Islamic knowledge
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-lg bg-background px-8 py-4 text-lg font-semibold text-primary hover:bg-background/90 transition-all shadow-lg"
              >
                Apply for 2025-2026
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border-2 border-background px-8 py-4 text-lg font-semibold text-background hover:bg-background/10 transition-all"
              >
                Contact Us
              </Link>
            </div>
            <p className="mt-8 text-sm opacity-75">
              Classes run during school term times. Limited spaces available.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
