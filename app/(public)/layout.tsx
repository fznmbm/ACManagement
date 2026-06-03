import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

//import { PublicMobileMenu } from "@/components/layout/PublicMobileMenu";
import { CookieConsent } from "@/components/layout/CookieConsent";
import Script from "next/script";
//import { getDomainUrls } from "@/lib/utils/domains";

import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const metadata = {
  // Title configuration
  title: {
    default: "Al Hikmah Institute Crawley - Islamic Education Centre",
    template: "%s | Al Hikmah Institute Crawley", // ← This makes child pages show "About | Al Hikmah..."
  },
  description:
    "Quality Islamic education for children in Crawley, West Sussex.",

  // Base URL configuration
  metadataBase: new URL("https://al-hikmah.org"), // ← Replace with your actual domain later
  alternates: {
    canonical: "/",
  },

  // Apple Web App
  appleWebApp: {
    capable: true,
    title: "Al Hikmah Institute",
    statusBarStyle: "default",
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  // Open Graph for Facebook, WhatsApp, LinkedIn
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Al Hikmah Institute Crawley",
    title: "Al Hikmah Institute Crawley - Islamic Education Centre",
    description:
      "Quality Islamic education for children in Crawley, West Sussex.",
    images: [
      {
        url: "/logo/logo.png", // ← We'll fix this path next
        width: 1200,
        height: 630,
        alt: "Al Hikmah Institute Crawley",
      },
    ],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //const domains = getDomainUrls(); // ADD THIS LINE
  return (
    <>
      {/* Preconnect to Google Fonts - CRITICAL FOR PERFORMANCE */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      {/* Google Analytics */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          />
          <Script
            id="google-analytics"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                 gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
        page_path: window.location.pathname,
      });
              `,
            }}
          />
        </>
      )}

      <div className="flex min-h-screen flex-col">
        {/* Navigation Header */}
        <PublicHeader />

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t bg-muted/50">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* About Column */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Al Hikmah Institute</h3>
                <p className="text-sm text-muted-foreground">
                  Quality Islamic education for children in Crawley, West
                  Sussex.
                </p>
              </div>

              {/* Quick Links Column */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/"
                      className="text-muted-foreground hover:text-primary"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="text-muted-foreground hover:text-primary"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/programs"
                      className="text-muted-foreground hover:text-primary"
                    >
                      Programs
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/gallery"
                      className="text-muted-foreground hover:text-primary"
                    >
                      Gallery
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/news"
                      className="text-muted-foreground hover:text-primary"
                    >
                      News & Updates
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/apply"
                      className="text-muted-foreground hover:text-primary"
                    >
                      Apply Now
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Column */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Contact</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {/* <li>📧 alhikmahinstitutecrawley@gmail.com</li>
                  <li>📞 +44 7411 061242</li>
                  <li>📍 Crawley, West Sussex</li> */}
                  <li>
                    <a
                      href="mailto:alhikmahinstitutecrawley@gmail.com"
                      className="hover:text-primary transition-colors"
                    >
                      📧 alhikmahinstitutecrawley@gmail.com
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:+447411061242"
                      className="hover:text-primary transition-colors"
                    >
                      📞 +44 7411 061242
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://wa.me/447411061242?text=Hello%20Al%20Hikmah%20Institute%20Crawley"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      💬 WhatsApp: +44 7411 061242
                    </a>
                  </li>
                  <li>📍 Crawley, West Sussex</li>
                </ul>
              </div>

              {/* Portal Login Column */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">For Parents</h3>
                <Link
                  // href={
                  //   process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAINS === "true"
                  //     ? "https://parent.al-hikmah.org/parent/login"
                  //     : "https://ahic-parent.vercel.app/parent/login"
                  // }
                  href="/parent/login"
                  className="inline-block rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Parent Portal Login
                </Link>
                <p className="text-xs text-muted-foreground mt-2">
                  Access fees, attendance, and progress reports
                </p>
              </div>
            </div>

            {/* Copyright & Legal Links */}
            <div className="mt-8 pt-8 border-t">
              {/* Legal Links */}
              <div className="flex flex-wrap justify-center gap-3 mb-6 text-sm">
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  href="/cookies"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Cookie Policy
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  href="/faq"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </div>

              {/* Copyright */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  &copy; {new Date().getFullYear()} Al Hikmah Institute Crawley.
                  All rights reserved. Designed by{" "}
                  <a
                    href="https://elitestack.co.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    elitestack.co.uk
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </footer>
        {/* Cookie Consent Banner */}
        <CookieConsent />

        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/447411061242?text=Hello%20Al%20Hikmah%20Institute%20Crawley"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Chat on WhatsApp"
        >
          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>
    </>
  );
}
