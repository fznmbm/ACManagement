import Link from "next/link";
import { CheckCircle2, Home, Mail } from "lucide-react";

export default function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: { app_number?: string };
}) {
  const applicationNumber = searchParams.app_number || "PENDING";

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Application Submitted Successfully!
          </h1>
          <p className="text-xl text-muted-foreground">
            JazakAllah Khair for applying to Al Hikmah Institute Crawley
          </p>
        </div>

        {/* Application Number */}
        <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-8 mb-8">
          <div className="text-sm text-muted-foreground mb-2">
            Your Application Number
          </div>
          <div className="text-3xl font-bold text-primary mb-4">
            {applicationNumber}
          </div>
          <p className="text-sm text-muted-foreground">
            Please save this number for your records. You will need it to check
            your application status.
          </p>
        </div>

        {/* What's Next */}
        <div className="bg-muted/50 rounded-lg p-8 mb-8 text-left">
          <h2 className="text-2xl font-bold mb-6 text-center">
            What Happens Next?
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email Confirmation</h3>
                <p className="text-sm text-muted-foreground">
                  You will receive a confirmation email shortly with your
                  application details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Application Review</h3>
                <p className="text-sm text-muted-foreground">
                  Our admissions team will review your application within 5-7
                  working days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Decision Notification</h3>
                <p className="text-sm text-muted-foreground">
                  You will be notified via email about the status of your
                  application.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Enrollment (If Accepted)</h3>
                <p className="text-sm text-muted-foreground">
                  Upon acceptance, you will receive enrollment instructions and
                  class information.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Need Help?</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about your application, please contact us:
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:	alhikmahinstitutecrawley@gmail.com"
                className="text-primary hover:underline"
              >
                alhikmahinstitutecrawley@gmail.com
              </a>
            </p>
            <p>
              <strong>Phone:</strong> +44 1293 XXX XXX
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/home"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/10 transition-all"
          >
            <Mail className="mr-2 h-5 w-5" />
            Contact Us
          </Link>
        </div>

        {/* Additional Note */}
        <p className="mt-8 text-sm text-muted-foreground">
          Please check your email inbox (and spam folder) for the confirmation
          email.
        </p>
      </div>
    </div>
  );
}
