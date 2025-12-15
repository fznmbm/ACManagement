import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Image from "next/image"; // <-- ADD THIS LINE
//import { PublicMobileMenu } from "@/components/layout/PublicMobileMenu";
import { CookieConsent } from "@/components/layout/CookieConsent";
import Script from "next/script";

import dynamic from "next/dynamic";

// Lazy load mobile menu (only loads when needed)
const PublicMobileMenu = dynamic(
  () =>
    import("@/components/layout/PublicMobileMenu").then((mod) => ({
      default: mod.PublicMobileMenu,
    })),
  { ssr: false }
);

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
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            <div className="flex h-20 items-center justify-between">
              {/* Logo & Name */}
              <Link href="/home" className="flex items-center space-x-3">
                {/* Gemini  */}
                {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-xl font-bold">AH</span>
              </div> */}

                <Image
                  src="https://raw.githubusercontent.com/fznmbm/ACManagement/refs/heads/main/public/logo/ahlogo_web_nobg.png"
                  alt="Al Hikmah Institute Crawley Logo"
                  width={72} // The width of the original container was 40
                  height={72} // The height of the original container was 40
                  className="h-20 w-20 rounded-lg" // Reusing the sizing and styling classes
                  priority // ← Add this for header logo
                  loading="eager" // ← Add this
                />

                {/* Gemini */}

                <div className="hidden md:block">
                  <div className="text-lg font-bold text-foreground">
                    Al Hikmah Institute Crawley
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Islamic Education Centre
                  </div>
                </div>
              </Link>

              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/home"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
                <Link
                  href="/programs"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Programs
                </Link>

                <Link
                  href="/gallery"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Gallery
                </Link>

                <Link
                  href="/news"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  News
                </Link>

                <Link
                  href="/faq"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </Link>

                <Link
                  href="/contact"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="/apply"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Apply Now
                </Link>
              </nav>

              {/* Mobile Menu Button & Theme Toggle */}
              <div className="flex items-center space-x-2">
                <ThemeToggle />

                {/* Mobile Menu Button - we'll add functionality later */}
                {/* <button className="md:hidden p-2">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button> */}
                <PublicMobileMenu />
              </div>
            </div>
          </div>
        </header>

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
                  <li>📧 alhikmahinstitutecrawley@gmail.com</li>
                  <li>📞 +44 7411 061242</li>
                  <li>📍 Crawley, West Sussex</li>
                </ul>
              </div>

              {/* Portal Login Column */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">For Parents</h3>
                <Link
                  href="/login"
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
      </div>
    </>
  );
}
