// File: app/(public)/cookies/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | Al Hikmah Institute Crawley",
  description:
    "Cookie policy and information about how Al Hikmah Institute Crawley uses cookies and tracking technologies.",
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground text-lg">
          Last updated: December 2024
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* Introduction */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. What Are Cookies?</h2>
          <p className="text-muted-foreground mb-4">
            Cookies are small text files that are placed on your device
            (computer, smartphone, or tablet) when you visit a website. They are
            widely used to make websites work more efficiently and provide
            information to website owners.
          </p>
          <p className="text-muted-foreground">
            This Cookie Policy explains how Al Hikmah Institute Crawley ("we",
            "our", or "us") uses cookies and similar technologies on our
            website.
          </p>
        </section>

        {/* Why We Use Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. Why We Use Cookies</h2>
          <p className="text-muted-foreground mb-4">We use cookies to:</p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Keep you signed in to the parent portal</li>
            <li>Remember your preferences (like dark mode settings)</li>
            <li>Understand how you use our website to improve it</li>
            <li>Ensure the website functions properly and securely</li>
            <li>Analyze visitor behavior and website performance</li>
          </ul>
        </section>

        {/* Types of Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            3. Types of Cookies We Use
          </h2>

          {/* Essential Cookies */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              3.1 Essential Cookies (Strictly Necessary)
            </h3>
            <p className="text-muted-foreground mb-3">
              These cookies are necessary for the website to function properly.
              They cannot be switched off.
            </p>

            <div className="bg-card border rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-semibold">
                      Cookie Name
                    </th>
                    <th className="text-left pb-2 font-semibold">Purpose</th>
                    <th className="text-left pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2">sb-access-token</td>
                    <td className="py-2">Authentication (login)</td>
                    <td className="py-2">1 hour</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">sb-refresh-token</td>
                    <td className="py-2">Session management</td>
                    <td className="py-2">30 days</td>
                  </tr>
                  <tr>
                    <td className="py-2">csrf-token</td>
                    <td className="py-2">Security protection</td>
                    <td className="py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Functionality Cookies */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              3.2 Functionality Cookies (Preferences)
            </h3>
            <p className="text-muted-foreground mb-3">
              These cookies remember your preferences and choices.
            </p>

            <div className="bg-card border rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-semibold">
                      Cookie Name
                    </th>
                    <th className="text-left pb-2 font-semibold">Purpose</th>
                    <th className="text-left pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2">theme-preference</td>
                    <td className="py-2">Dark/light mode setting</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2">language-pref</td>
                    <td className="py-2">Language selection</td>
                    <td className="py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              3.3 Analytics Cookies (Performance)
            </h3>
            <p className="text-muted-foreground mb-3">
              These cookies help us understand how visitors interact with our
              website.
            </p>

            <div className="bg-card border rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-semibold">
                      Cookie Name
                    </th>
                    <th className="text-left pb-2 font-semibold">Purpose</th>
                    <th className="text-left pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2">_ga</td>
                    <td className="py-2">
                      Google Analytics (visitor tracking)
                    </td>
                    <td className="py-2">2 years</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">_ga_*</td>
                    <td className="py-2">Google Analytics (session data)</td>
                    <td className="py-2">2 years</td>
                  </tr>
                  <tr>
                    <td className="py-2">_gid</td>
                    <td className="py-2">Google Analytics (user ID)</td>
                    <td className="py-2">24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              We use Google Analytics to understand visitor behavior. Google
              Analytics collects anonymized information about page visits, time
              spent, and navigation patterns. Learn more at{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google's Privacy Policy
              </a>
              .
            </p>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Third-Party Cookies</h2>
          <p className="text-muted-foreground mb-4">
            Some cookies are set by third-party services that appear on our
            pages:
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-card border rounded-lg">
              <h3 className="font-semibold mb-2">Google Analytics</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Used for website analytics and visitor statistics.
              </p>
              <p className="text-xs text-muted-foreground">
                Privacy Policy:{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  policies.google.com/privacy
                </a>
              </p>
            </div>

            <div className="p-4 bg-card border rounded-lg">
              <h3 className="font-semibold mb-2">Supabase</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Used for authentication and database services.
              </p>
              <p className="text-xs text-muted-foreground">
                Privacy Policy:{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  supabase.com/privacy
                </a>
              </p>
            </div>

            <div className="p-4 bg-card border rounded-lg">
              <h3 className="font-semibold mb-2">Vercel</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Used for website hosting and performance.
              </p>
              <p className="text-xs text-muted-foreground">
                Privacy Policy:{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Managing Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. How to Control Cookies</h2>

          <h3 className="text-xl font-semibold mb-3">5.1 Browser Settings</h3>
          <p className="text-muted-foreground mb-4">
            Most web browsers allow you to control cookies through their
            settings. You can:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Delete all cookies from your browser</li>
            <li>Block all cookies</li>
            <li>Allow only certain cookies</li>
            <li>Be notified when cookies are set</li>
          </ul>

          <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg mb-4">
            <p className="text-sm font-semibold mb-2">⚠️ Important Note</p>
            <p className="text-sm text-muted-foreground">
              Blocking essential cookies may prevent you from logging in to the
              parent portal or cause parts of the website not to function
              properly.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">
            5.2 Browser Instructions
          </h3>
          <p className="text-muted-foreground mb-3">
            To manage cookies in your browser:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-card border rounded-lg">
              <p className="font-semibold text-sm mb-1">Google Chrome</p>
              <p className="text-xs text-muted-foreground">
                Settings → Privacy and security → Cookies and other site data
              </p>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Learn more →
              </a>
            </div>

            <div className="p-3 bg-card border rounded-lg">
              <p className="font-semibold text-sm mb-1">Firefox</p>
              <p className="text-xs text-muted-foreground">
                Settings → Privacy & Security → Cookies and Site Data
              </p>
              <a
                href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Learn more →
              </a>
            </div>

            <div className="p-3 bg-card border rounded-lg">
              <p className="font-semibold text-sm mb-1">Safari</p>
              <p className="text-xs text-muted-foreground">
                Preferences → Privacy → Cookies and website data
              </p>
              <a
                href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Learn more →
              </a>
            </div>

            <div className="p-3 bg-card border rounded-lg">
              <p className="font-semibold text-sm mb-1">Microsoft Edge</p>
              <p className="text-xs text-muted-foreground">
                Settings → Cookies and site permissions → Manage cookies
              </p>
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Learn more →
              </a>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">
            5.3 Opt-Out of Google Analytics
          </h3>
          <p className="text-muted-foreground mb-3">
            You can opt-out of Google Analytics tracking by installing the
            Google Analytics Opt-out Browser Add-on:
          </p>
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
          >
            Download Google Analytics Opt-out Add-on
          </a>
        </section>

        {/* Mobile Devices */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            6. Cookies on Mobile Devices
          </h2>
          <p className="text-muted-foreground mb-4">
            On mobile devices, you can manage cookies through your browser app
            settings:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-card border rounded-lg">
              <p className="font-semibold text-sm mb-1">iPhone/iPad (Safari)</p>
              <p className="text-xs text-muted-foreground">
                Settings → Safari → Block All Cookies
              </p>
            </div>

            <div className="p-3 bg-card border rounded-lg">
              <p className="font-semibold text-sm mb-1">Android (Chrome)</p>
              <p className="text-xs text-muted-foreground">
                Chrome app → Settings → Site settings → Cookies
              </p>
            </div>
          </div>
        </section>

        {/* Do Not Track */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">7. Do Not Track Signals</h2>
          <p className="text-muted-foreground">
            Some browsers have a "Do Not Track" feature that signals to websites
            that you don't want to be tracked. However, there is no universal
            standard for how websites should respond to these signals. We do not
            currently respond to Do Not Track signals, but you can control
            cookies through your browser settings as described above.
          </p>
        </section>

        {/* Updates */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            8. Changes to This Cookie Policy
          </h2>
          <p className="text-muted-foreground mb-4">
            We may update this Cookie Policy from time to time to reflect
            changes in:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>The cookies we use</li>
            <li>Legal requirements</li>
            <li>Our website functionality</li>
          </ul>
          <p className="text-muted-foreground">
            Please check this page regularly to stay informed. The "Last
            updated" date at the top shows when the policy was last revised.
          </p>
        </section>

        {/* Related Policies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">9. Related Policies</h2>
          <p className="text-muted-foreground mb-4">
            For more information about how we protect your privacy:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/privacy"
              className="inline-block px-6 py-3 bg-card border rounded-lg hover:border-primary transition-colors text-center"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="inline-block px-6 py-3 bg-card border rounded-lg hover:border-primary transition-colors text-center"
            >
              Terms of Service
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            10. Questions About Cookies?
          </h2>
          <p className="text-muted-foreground mb-4">
            If you have questions about our use of cookies:
          </p>

          <div className="p-6 bg-card border rounded-lg">
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:alhikmahinstitutecrawley@gmail.com"
                  className="text-primary hover:underline"
                >
                  alhikmahinstitutecrawley@gmail.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <a
                  href="tel:+447411061242"
                  className="text-primary hover:underline"
                >
                  +44 7411 061242
                </a>
              </p>
              <p>
                <strong>Address:</strong> Crawley, West Sussex, UK
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Note */}
      <div className="mt-12 p-4 bg-muted rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          This Cookie Policy was last updated in December 2024 and complies with
          UK GDPR requirements.
        </p>
      </div>
    </div>
  );
}
