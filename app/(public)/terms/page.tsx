// File: app/(public)/terms/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Al Hikmah Institute Crawley",
  description:
    "Terms and conditions for enrollment and use of services at Al Hikmah Institute Crawley.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
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
            Welcome to Al Hikmah Institute Crawley ("we", "our", "us", or
            "AHIC"). These Terms of Service ("Terms") govern your enrollment and
            use of our educational services and website.
          </p>
          <p className="text-muted-foreground mb-4">
            By enrolling your child or using our services, you agree to be bound
            by these Terms. Please read them carefully before proceeding with
            enrollment.
          </p>
          <p className="text-muted-foreground">
            If you do not agree with any part of these Terms, you should not
            enroll or use our services.
          </p>
        </section>

        {/* Definitions */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              <strong>"Student"</strong> refers to the enrolled child/young
              person
            </li>
            <li>
              <strong>"Parent"</strong> refers to parent, guardian, or
              authorized representative
            </li>
            <li>
              <strong>"Services"</strong> refers to all educational programs and
              facilities provided
            </li>
            <li>
              <strong>"Term"</strong> refers to the academic term or session
              period
            </li>
            <li>
              <strong>"Fees"</strong> refers to all charges for our services
            </li>
          </ul>
        </section>

        {/* Enrollment */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            3. Enrollment and Admission
          </h2>

          <h3 className="text-xl font-semibold mb-3">
            3.1 Application Process
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Applications are subject to availability and approval</li>
            <li>All information provided must be accurate and complete</li>
            <li>
              We reserve the right to refuse admission without providing reasons
            </li>
            <li>Acceptance is confirmed via email or written notification</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.2 Age Requirements</h3>
          <p className="text-muted-foreground mb-4">
            Students must be between 5-16 years old at the time of enrollment.
            Age verification may be required.
          </p>

          <h3 className="text-xl font-semibold mb-3">
            3.3 Required Information
          </h3>
          <p className="text-muted-foreground mb-4">Parents must provide:</p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Complete and accurate student information</li>
            <li>Emergency contact details</li>
            <li>Medical information (allergies, conditions, medications)</li>
            <li>Proof of identity and address (if requested)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            3.4 Enrollment Confirmation
          </h3>
          <p className="text-muted-foreground">Enrollment is confirmed upon:</p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Completion of application form</li>
            <li>Payment of first term's fees (if applicable)</li>
            <li>Acceptance of these Terms</li>
            <li>Receipt of written confirmation from us</li>
          </ul>
        </section>

        {/* Fees and Payment */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Fees and Payment</h2>

          <h3 className="text-xl font-semibold mb-3">4.1 Fee Structure</h3>
          <p className="text-muted-foreground mb-4">
            Current fee information is available on our website and application
            form. Fees are reviewed annually and may change with notice.
          </p>

          <h3 className="text-xl font-semibold mb-3">4.2 Payment Terms</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Fees are payable termly in advance unless otherwise agreed</li>
            <li>Payment is due by the first day of each term</li>
            <li>Late payments may incur additional charges</li>
            <li>
              Payment methods include bank transfer, cash, or as specified
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.3 Late Payment</h3>
          <p className="text-muted-foreground mb-4">
            If fees are not paid by the due date:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>A reminder will be sent to parents</li>
            <li>Late payment fees may apply (as specified in fee schedule)</li>
            <li>Continued non-payment may result in suspension of services</li>
            <li>Outstanding fees may be referred to debt collection</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.4 Refund Policy</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              Fees paid are non-refundable except in exceptional circumstances
            </li>
            <li>No refunds for absence, illness, or holidays</li>
            <li>Withdrawal requires one term's written notice</li>
            <li>Refund requests must be submitted in writing</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.5 Sibling Discounts</h3>
          <p className="text-muted-foreground">
            Multi-child discounts may be available. Contact us for details.
          </p>
        </section>

        {/* Attendance */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Attendance and Absence</h2>

          <h3 className="text-xl font-semibold mb-3">5.1 Regular Attendance</h3>
          <p className="text-muted-foreground mb-4">
            Students are expected to attend all scheduled classes. Regular
            attendance is essential for academic progress.
          </p>

          <h3 className="text-xl font-semibold mb-3">
            5.2 Notification of Absence
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Parents must inform us of absences in advance when possible</li>
            <li>Contact us via phone, email, or parent portal</li>
            <li>Provide reason for absence (illness, emergency, etc.)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.3 Persistent Absence</h3>
          <p className="text-muted-foreground mb-4">
            Repeated absences without valid reason may result in:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Meeting with parents to discuss attendance</li>
            <li>Academic progress concerns</li>
            <li>Review of continued enrollment</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.4 Lateness</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Students should arrive on time for all classes</li>
            <li>Persistent lateness disrupts learning</li>
            <li>Late arrival fines may apply as per fee schedule</li>
          </ul>
        </section>

        {/* Code of Conduct */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            6. Student Code of Conduct
          </h2>

          <p className="text-muted-foreground mb-4">
            All students are expected to:
          </p>

          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Show respect to teachers, staff, and fellow students</li>
            <li>Follow Islamic etiquette and values</li>
            <li>Maintain appropriate dress code (modest Islamic clothing)</li>
            <li>Refrain from disruptive behavior</li>
            <li>Take care of school property and materials</li>
            <li>Complete homework and assignments on time</li>
            <li>Follow all safety and health guidelines</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">
            6.1 Disciplinary Action
          </h3>
          <p className="text-muted-foreground mb-4">
            Breaches of conduct may result in:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Verbal warning</li>
            <li>Written warning to parents</li>
            <li>Temporary suspension</li>
            <li>Permanent exclusion (serious or repeated breaches)</li>
          </ul>

          <p className="text-muted-foreground">
            We reserve the right to exclude students whose behavior negatively
            impacts the learning environment.
          </p>
        </section>

        {/* Parent Responsibilities */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            7. Parent/Guardian Responsibilities
          </h2>

          <p className="text-muted-foreground mb-4">
            Parents/guardians agree to:
          </p>

          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Ensure student arrives on time and attends regularly</li>
            <li>Pay all fees by the due date</li>
            <li>Notify us of any changes to contact or medical information</li>
            <li>Support their child's learning at home</li>
            <li>Attend parent-teacher meetings when requested</li>
            <li>Check the parent portal regularly for updates</li>
            <li>Respond to communications from the school promptly</li>
            <li>
              Ensure student has necessary materials (Quran, notebooks, etc.)
            </li>
            <li>Support school policies and Islamic values</li>
          </ul>
        </section>

        {/* Health and Safety */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">8. Health and Safety</h2>

          <h3 className="text-xl font-semibold mb-3">
            8.1 Medical Information
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              Parents must inform us of any medical conditions, allergies, or
              medications
            </li>
            <li>
              Update medical information immediately if circumstances change
            </li>
            <li>Provide emergency contact information</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">8.2 Illness</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Do not send sick students to class</li>
            <li>Students with contagious illnesses must stay home</li>
            <li>We may send home students who appear unwell</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            8.3 Emergency Procedures
          </h3>
          <p className="text-muted-foreground mb-4">In case of emergency:</p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>We will contact parents/emergency contacts immediately</li>
            <li>We may seek medical attention if necessary</li>
            <li>
              Parents authorize us to act in the best interest of the student
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">8.4 Safeguarding</h3>
          <p className="text-muted-foreground">
            We are committed to safeguarding all students. All staff are DBS
            checked and trained in child protection. We follow UK safeguarding
            guidance and will report concerns to appropriate authorities.
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            9. Intellectual Property and Materials
          </h2>

          <h3 className="text-xl font-semibold mb-3">
            9.1 Educational Materials
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>All teaching materials and resources remain our property</li>
            <li>
              Materials may not be reproduced or shared without permission
            </li>
            <li>Students may use materials for personal study only</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            9.2 Photography and Media
          </h3>
          <p className="text-muted-foreground mb-4">
            By enrolling, parents consent to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Photographs/videos of students for educational purposes</li>
            <li>Use of student work in displays and promotional materials</li>
            <li>Sharing of achievements (with names) in newsletters</li>
          </ul>
          <p className="text-muted-foreground">
            Parents may withdraw consent at any time in writing.
          </p>
        </section>

        {/* Data Protection */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            10. Data Protection and Privacy
          </h2>

          <p className="text-muted-foreground mb-4">
            We process personal data in accordance with UK GDPR and Data
            Protection Act 2018. Please read our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            for full details on how we collect, use, and protect your
            information.
          </p>

          <p className="text-muted-foreground">
            By enrolling, you consent to our processing of your data as
            described in the Privacy Policy.
          </p>
        </section>

        {/* Website Usage */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            11. Website and Parent Portal
          </h2>

          <h3 className="text-xl font-semibold mb-3">11.1 Account Security</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              Parents are responsible for maintaining password confidentiality
            </li>
            <li>Do not share login credentials with others</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>We may suspend accounts showing suspicious activity</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">11.2 Acceptable Use</h3>
          <p className="text-muted-foreground mb-4">
            When using our website or portal, you must not:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Attempt to gain unauthorized access to systems</li>
            <li>Use automated tools to scrape data</li>
            <li>Upload viruses or malicious code</li>
            <li>Interfere with other users' access</li>
            <li>Misuse or abuse the platform</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            11.3 Service Availability
          </h3>
          <p className="text-muted-foreground">
            We strive to maintain service availability but do not guarantee
            uninterrupted access. We may suspend service for maintenance or
            updates with notice when possible.
          </p>
        </section>

        {/* Termination */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            12. Withdrawal and Termination
          </h2>

          <h3 className="text-xl font-semibold mb-3">
            12.1 Voluntary Withdrawal
          </h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>
              Parents may withdraw students with one term's written notice
            </li>
            <li>Notice must be submitted before the start of term</li>
            <li>Fees for the notice period are payable in full</li>
            <li>No refund for fees already paid</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            12.2 Termination by School
          </h3>
          <p className="text-muted-foreground mb-4">
            We reserve the right to terminate enrollment if:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Fees remain unpaid after final reminder</li>
            <li>Student behavior is persistently disruptive</li>
            <li>Parents fail to meet their responsibilities</li>
            <li>Relationship breakdown makes education impossible</li>
          </ul>

          <p className="text-muted-foreground">
            We will provide written notice and opportunity to address concerns
            before termination.
          </p>
        </section>

        {/* Liability */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            13. Limitation of Liability
          </h2>

          <p className="text-muted-foreground mb-4">
            To the extent permitted by law:
          </p>

          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>We are not liable for loss or damage to personal belongings</li>
            <li>
              We are not responsible for injuries except where caused by our
              negligence
            </li>
            <li>We maintain appropriate insurance coverage</li>
            <li>
              Parents are responsible for their child's actions outside school
              premises
            </li>
            <li>
              We are not liable for delays or failures due to circumstances
              beyond our control
            </li>
          </ul>

          <p className="text-muted-foreground">
            Nothing in these Terms excludes our liability for death or personal
            injury caused by negligence, fraud, or other liability that cannot
            be excluded by law.
          </p>
        </section>

        {/* Complaints */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">14. Complaints Procedure</h2>

          <p className="text-muted-foreground mb-4">If you have a complaint:</p>

          <ol className="list-decimal pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Contact the relevant teacher or class coordinator</li>
            <li>If unresolved, contact the Head Teacher/Principal</li>
            <li>Submit a formal written complaint if still unresolved</li>
            <li>We will investigate and respond within 10 working days</li>
          </ol>

          <p className="text-muted-foreground">
            Contact: alhikmahinstitutecrawley@gmail.com or +44 7411 061242
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            15. Changes to These Terms
          </h2>

          <p className="text-muted-foreground mb-4">
            We may update these Terms from time to time. Changes will be:
          </p>

          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
            <li>Posted on our website with updated revision date</li>
            <li>Communicated to parents via email for significant changes</li>
            <li>Effective from the date specified in the notice</li>
          </ul>

          <p className="text-muted-foreground">
            Continued enrollment after changes constitutes acceptance of updated
            Terms.
          </p>
        </section>

        {/* Governing Law */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            16. Governing Law and Jurisdiction
          </h2>

          <p className="text-muted-foreground mb-4">
            These Terms are governed by the laws of England and Wales. Any
            disputes will be subject to the exclusive jurisdiction of the courts
            of England and Wales.
          </p>
        </section>

        {/* Severability */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">17. Severability</h2>

          <p className="text-muted-foreground">
            If any provision of these Terms is found to be invalid or
            unenforceable, the remaining provisions will continue in full force
            and effect.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">18. Contact Information</h2>

          <p className="text-muted-foreground mb-4">
            For questions about these Terms of Service:
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

        {/* Acknowledgment */}
        <section className="mb-8">
          <div className="p-6 bg-primary/10 border-l-4 border-primary rounded-r-lg">
            <h3 className="font-semibold mb-2">Acknowledgment</h3>
            <p className="text-sm text-muted-foreground">
              By completing the enrollment process, you acknowledge that you
              have read, understood, and agree to be bound by these Terms of
              Service.
            </p>
          </div>
        </section>
      </div>

      {/* Footer Note */}
      <div className="mt-12 p-4 bg-muted rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          These Terms of Service were last updated in December 2025.
        </p>
      </div>
    </div>
  );
}
