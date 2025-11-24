import { Mail, Phone, MapPin, Clock, Facebook } from "lucide-react";
import ContactForm from "@/components/public/ContactForm";

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Get in touch with Al Hikma Institute Crawley
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We're here to answer your questions and help you learn more about
              our programs. Feel free to reach out to us anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-12">
            {/* Contact Information - Left Side */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
                <p className="text-muted-foreground mb-8">
                  We'd love to hear from you. Send us a message and we'll
                  respond as soon as possible.
                </p>
              </div>

              {/* Contact Cards */}
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-start gap-4 p-4 bg-card border rounded-lg hover:border-primary transition-colors">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a
                      href="mailto:info@alhikma.org.uk"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      info@alhikma.org.uk
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 p-4 bg-card border rounded-lg hover:border-primary transition-colors">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <a
                      href="tel:+441293XXXXXX"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      +44 1293 XXX XXX
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      Available during class times
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4 p-4 bg-card border rounded-lg hover:border-primary transition-colors">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Location</h3>
                    <p className="text-sm text-muted-foreground">
                      Crawley, West Sussex
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exact address provided upon enrollment
                    </p>
                  </div>
                </div>

                {/* Class Times */}
                <div className="flex items-start gap-4 p-4 bg-card border rounded-lg hover:border-primary transition-colors">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Class Times</h3>
                    <p className="text-sm text-muted-foreground">
                      During school term times
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No classes during holidays or Ramadan
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a
                    href="https://www.facebook.com/people/Al-Hikmah-Institute-Crawley-AHIC/61582802332017/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                  {/* Add more social media links as needed */}
                </div>
              </div>
            </div>

            {/* Contact Form - Right Side */}
            <div className="lg:col-span-3">
              <div className="bg-card border rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">
                  What age do you accept students?
                </h3>
                <p className="text-muted-foreground">
                  We accept students aged 7 years and above. Students must be
                  able to read and write English fluently as per our admission
                  requirements.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">
                  When do classes run?
                </h3>
                <p className="text-muted-foreground">
                  Classes run during school term times only. There are no
                  classes during school holidays or the month of Ramadan.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">
                  How do I apply for my child?
                </h3>
                <p className="text-muted-foreground">
                  You can apply online through our{" "}
                  <a href="/apply" className="text-primary hover:underline">
                    application form
                  </a>
                  . Fill in all required information and submit. We will review
                  your application and contact you within 5-7 working days.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">
                  What is the attendance policy?
                </h3>
                <p className="text-muted-foreground">
                  Regular attendance is mandatory. Late arrivals incur a £5
                  fine, and absences without medical reason incur a £10 fine.
                  More than 2 unexcused absences may result in enrollment
                  termination.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">
                  Do you provide transportation?
                </h3>
                <p className="text-muted-foreground">
                  Parents/guardians are responsible for transportation to and
                  from the institute. Students should arrive at least 5 minutes
                  before class begins.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">
                  Can I visit the institute before enrolling?
                </h3>
                <p className="text-muted-foreground">
                  Yes, we welcome prospective parents to contact us and arrange
                  a visit. Please send us a message or call ahead to schedule a
                  convenient time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
