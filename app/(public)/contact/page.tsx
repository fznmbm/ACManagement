import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Al Hikmah Institute Crawley",
  description:
    "Get in touch with Al Hikmah Institute Crawley. Call +44 7411 061242 or email us for enrollment inquiries and information about our Islamic education programs.",
  keywords: [
    "contact Islamic school",
    "madrasah contact",
    "enrollment inquiry Crawley",
  ],

  openGraph: {
    title: "Contact Al Hikmah Institute Crawley",
    description: "Get in touch for enrollment inquiries and information.",
    url: "https://al-hikmah.org/contact",
    type: "website",
  },
};

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
              Get in touch with Al Hikmah Institute Crawley
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
                      href="mailto:	alhikmahinstitutecrawley@gmail.com"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      alhikmahinstitutecrawley@gmail.com
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
                      +44 7411 061242
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

                {/* WhatsApp Card */}
                <div className="p-6 bg-primary/5 rounded-lg border border-primary/20 text-center">
                  {/* <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div> */}

                  {/* <h3 className="font-semibold mb-2">WhatsApp</h3> */}
                  {/* <p className="text-sm text-muted-foreground mb-4">
                    Quick response via WhatsApp
                  </p> */}
                  <a
                    href="https://wa.me/447411061242?text=Hello%2C%20I%20would%20like%20to%20enquire%20about%20Al%20Hikmah%20Institute"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Chat on WhatsApp
                  </a>
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
