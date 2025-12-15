// File: app/(public)/privacy/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Al Hikmah Institute Crawley",
  description:
    "Privacy policy and data protection information for Al Hikmah Institute Crawley. Learn how we protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground text-lg">
          Last updated: December 2024
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* Introduction */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground mb-4">
            Al Hikmah Institute Crawley ("we", "our", or "us") is committed to
            protecting and respecting your privacy. This policy explains how we
            collect, use, and safeguard your personal information in accordance
            with the UK General Data Protection Regulation (UK GDPR) and the
            Data Protection Act 2018.
          </p>
          <p className="text-muted-foreground">
            <strong>Data Controller:</strong> Al Hikmah Institute Crawley
            <br />
            <strong>Address:</strong> Crawley, West Sussex, UK
            <br />
            <strong>Email:</strong> alhikmahinstitutecrawley@gmail.com
            <br />
            <strong>Phone:</strong> +44 7411 061242
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

          <h3 className="text-xl font-semibold mb-3">
            2.1 Student Information
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Full name and Arabic name (if applicable)</li>
            <li>Date of birth and age</li>
            <li>Gender</li>
            <li>Home address and contact details</li>
            <li>
              Medical information (allergies, conditions, emergency contacts)
            </li>
            <li>Academic progress and attendance records</li>
            <li>Photographs and videos for educational purposes</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            2.2 Parent/Guardian Information
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Full name and contact details</li>
            <li>Email address and phone numbers</li>
            <li>Relationship to student</li>
            <li>Emergency contact information</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.3 Website Usage Data</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>IP address and browser type</li>
            <li>Pages visited and time spent on site</li>
            <li>Referring website addresses</li>
            <li>Device information (mobile, tablet, desktop)</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            3. How We Use Your Information
          </h2>

          <p className="text-muted-foreground mb-4">
            We use your personal information for the following purposes:
          </p>

          <h3 className="text-xl font-semibold mb-3">
            3.1 Educational Services
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Managing student enrollment and class assignments</li>
            <li>Recording attendance and academic progress</li>
            <li>Providing educational reports to parents</li>
            <li>Issuing certificates and achievements</li>
            <li>Tracking memorization progress (Quran, Duas, Hadiths)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.2 Communication</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Sending important updates about classes and events</li>
            <li>Notifying parents about attendance and fees</li>
            <li>Responding to inquiries and support requests</li>
            <li>Sending newsletters and educational content</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            3.3 Financial Management
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Processing fee payments and generating invoices</li>
            <li>Managing outstanding fees and fines</li>
            <li>Providing financial statements to parents</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.4 Legal Basis</h3>
          <p className="text-muted-foreground mb-4">
            We process your data under the following legal bases:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              <strong>Consent:</strong> You have given clear consent for us to
              process your data
            </li>
            <li>
              <strong>Contract:</strong> Processing is necessary for the
              enrollment contract
            </li>
            <li>
              <strong>Legal Obligation:</strong> Required for safeguarding and
              health & safety
            </li>
            <li>
              <strong>Legitimate Interests:</strong> Running an effective
              educational institution
            </li>
          </ul>
        </section>

        {/* Data Sharing */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            4. Data Sharing and Disclosure
          </h2>

          <p className="text-muted-foreground mb-4">
            We do not sell, rent, or trade your personal information. We may
            share data only in these circumstances:
          </p>

          <h3 className="text-xl font-semibold mb-3">4.1 Service Providers</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              <strong>Supabase:</strong> Database hosting (UK/EU servers)
            </li>
            <li>
              <strong>Resend:</strong> Email delivery service
            </li>
            <li>
              <strong>Vercel:</strong> Website hosting
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.2 Legal Requirements</h3>
          <p className="text-muted-foreground mb-4">
            We may disclose information if required by law or to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Comply with legal obligations (court orders, safeguarding)</li>
            <li>Protect the rights and safety of students and staff</li>
            <li>Prevent fraud or security threats</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.3 Parental Access</h3>
          <p className="text-muted-foreground">
            Parents have access to their own child's information through the
            secure parent portal. We verify identity before granting access.
          </p>
        </section>

        {/* Data Security */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>

          <p className="text-muted-foreground mb-4">
            We implement appropriate security measures to protect your data:
          </p>

          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              <strong>Encryption:</strong> All data transmitted is encrypted
              using SSL/TLS
            </li>
            <li>
              <strong>Access Control:</strong> Role-based access with password
              protection
            </li>
            <li>
              <strong>Secure Storage:</strong> Data stored in secure, encrypted
              databases
            </li>
            <li>
              <strong>Regular Backups:</strong> Daily backups to prevent data
              loss
            </li>
            <li>
              <strong>Staff Training:</strong> All staff trained in data
              protection
            </li>
            <li>
              <strong>Regular Audits:</strong> Security reviews and updates
            </li>
          </ul>

          <p className="text-muted-foreground">
            While we take all reasonable precautions, no method of transmission
            over the internet is 100% secure. We cannot guarantee absolute
            security but are committed to protecting your data.
          </p>
        </section>

        {/* Data Retention */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>

          <p className="text-muted-foreground mb-4">
            We retain personal data for different periods depending on its
            purpose:
          </p>

          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              <strong>Current Students:</strong> Duration of enrollment plus 3
              years
            </li>
            <li>
              <strong>Former Students:</strong> Academic records kept for 7
              years
            </li>
            <li>
              <strong>Financial Records:</strong> 6 years (UK tax requirements)
            </li>
            <li>
              <strong>Safeguarding Records:</strong> Until the child reaches 25
              years (UK guidance)
            </li>
            <li>
              <strong>Application Data:</strong> 1 year for unsuccessful
              applications
            </li>
            <li>
              <strong>Website Analytics:</strong> 26 months (Google Analytics
              default)
            </li>
          </ul>

          <p className="text-muted-foreground">
            After these periods, data is securely deleted or anonymized.
          </p>
        </section>

        {/* Your Rights */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            7. Your Rights Under UK GDPR
          </h2>

          <p className="text-muted-foreground mb-4">
            You have the following rights regarding your personal data:
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                7.1 Right to Access
              </h3>
              <p className="text-muted-foreground">
                Request a copy of the personal data we hold about you or your
                child.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                7.2 Right to Rectification
              </h3>
              <p className="text-muted-foreground">
                Correct inaccurate or incomplete data.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                7.3 Right to Erasure ("Right to be Forgotten")
              </h3>
              <p className="text-muted-foreground">
                Request deletion of your data (subject to legal retention
                requirements).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                7.4 Right to Restrict Processing
              </h3>
              <p className="text-muted-foreground">
                Limit how we use your data in certain circumstances.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                7.5 Right to Data Portability
              </h3>
              <p className="text-muted-foreground">
                Receive your data in a structured, commonly used format.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                7.6 Right to Object
              </h3>
              <p className="text-muted-foreground">
                Object to processing based on legitimate interests or direct
                marketing.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                7.7 Right to Withdraw Consent
              </h3>
              <p className="text-muted-foreground">
                Withdraw consent at any time (does not affect previous
                processing).
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm font-semibold mb-2">
              To Exercise Your Rights:
            </p>
            <p className="text-sm text-muted-foreground">
              Email: alhikmahinstitutecrawley@gmail.com
              <br />
              Phone: +44 7411 061242
              <br />
              We will respond within 30 days.
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking</h2>

          <p className="text-muted-foreground mb-4">
            We use cookies and similar technologies to improve your experience.
            See our{" "}
            <a href="/cookies" className="text-primary hover:underline">
              Cookie Policy
            </a>{" "}
            for details.
          </p>

          <h3 className="text-xl font-semibold mb-3">
            Types of Cookies We Use:
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              <strong>Essential Cookies:</strong> Required for the website to
              function (login, security)
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how
              visitors use our site
            </li>
            <li>
              <strong>Preference Cookies:</strong> Remember your settings (dark
              mode, language)
            </li>
          </ul>

          <p className="text-muted-foreground">
            You can control cookies through your browser settings. Disabling
            essential cookies may affect site functionality.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>

          <p className="text-muted-foreground mb-4">
            We are committed to protecting children's privacy. Our services are
            designed for children aged 5-16 under parental supervision.
          </p>

          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              We require parental consent before collecting children's data
            </li>
            <li>Children's data is only used for educational purposes</li>
            <li>Parents have full access to their child's information</li>
            <li>We comply with all safeguarding requirements</li>
            <li>Staff are DBS checked and trained in child protection</li>
          </ul>
        </section>

        {/* International Transfers */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            10. International Data Transfers
          </h2>

          <p className="text-muted-foreground mb-4">
            We primarily store data within the UK/EU. When we use services with
            servers outside the UK:
          </p>

          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>We ensure appropriate safeguards are in place</li>
            <li>Data is protected to UK GDPR standards</li>
            <li>
              We use providers with adequate data protection certifications
            </li>
          </ul>
        </section>

        {/* Changes to Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            11. Changes to This Policy
          </h2>

          <p className="text-muted-foreground mb-4">
            We may update this privacy policy from time to time. Changes will be
            posted on this page with an updated revision date. Significant
            changes will be communicated via email.
          </p>

          <p className="text-muted-foreground">
            Continued use of our services after changes constitutes acceptance
            of the updated policy.
          </p>
        </section>

        {/* Complaints */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">12. Complaints and ICO</h2>

          <p className="text-muted-foreground mb-4">
            If you have concerns about how we handle your data, please contact
            us first. If you're not satisfied with our response, you have the
            right to complain to the UK's supervisory authority:
          </p>

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold mb-2">
              Information Commissioner's Office (ICO)
            </p>
            <p className="text-sm text-muted-foreground">
              Website:{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ico.org.uk
              </a>
              <br />
              Helpline: 0303 123 1113
              <br />
              Address: Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">13. Contact Us</h2>

          <p className="text-muted-foreground mb-4">
            For any questions about this privacy policy or how we handle your
            data:
          </p>

          <div className="p-6 bg-card border rounded-lg">
            <h3 className="font-semibold mb-4">Al Hikmah Institute Crawley</h3>
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
      <div className="mt-12 p-4 bg-primary/10 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          This privacy policy was last updated on December 2024 and complies
          with UK GDPR and Data Protection Act 2018.
        </p>
      </div>
    </div>
  );
}
