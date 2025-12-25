import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ApplicationActions from "@/components/applications/ApplicationActions";
import { format } from "date-fns";

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Fetch application details
  const { data: application, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !application) {
    notFound();
  }

  // Calculate age
  const birthDate = new Date(application.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      pending:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
      under_review:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      accepted:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      rejected:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
      waitlist:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    };

    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Link
        href="/applications"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {application.child_first_name} {application.child_last_name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Application #{application.application_number}
          </p>
        </div>

        {/* Status Badge */}
        <div
          className={`px-4 py-2 rounded-lg border-2 font-semibold ${getStatusBadge(
            application.status
          )}`}
        >
          {application.status.replace("_", " ").toUpperCase()}
        </div>
      </div>

      {/* Application Info Banner */}
      <div className="bg-muted/50 border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Academic Year</p>
          <p className="font-semibold">{application.academic_year}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Submitted On</p>
          <p className="font-semibold">
            {format(new Date(application.submission_date), "MMMM dd, yyyy")}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <p className="font-semibold">
            {format(new Date(application.updated_at), "MMMM dd, yyyy")}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Student Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-muted-foreground">
                  First Name
                </label>
                <p className="font-medium">{application.child_first_name}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  Last Name
                </label>
                <p className="font-medium">{application.child_last_name}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  Date of Birth
                </label>
                <p className="font-medium">
                  {format(new Date(application.date_of_birth), "MMMM dd, yyyy")}{" "}
                  ({age} years old)
                </p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Gender</label>
                <p className="font-medium capitalize">{application.gender}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  English Literacy
                </label>
                <div className="flex items-center gap-2">
                  {application.can_read_write_english ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">
                        Confirmed
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-600">
                        Not Confirmed
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Conditions */}
            {application.medical_conditions && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm text-muted-foreground">
                  Medical Conditions / Allergies
                </label>
                <p className="mt-1 text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  {application.medical_conditions}
                </p>
              </div>
            )}

            {/* Special Requirements */}
            {application.special_requirements && (
              <div className="mt-4">
                <label className="text-sm text-muted-foreground">
                  Special Requirements
                </label>
                <p className="mt-1 text-sm bg-muted/50 rounded-lg p-3">
                  {application.special_requirements}
                </p>
              </div>
            )}
          </div>

          {/* Parent/Guardian Information */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Parent/Guardian Information</h2>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Full Name
                  </label>
                  <p className="font-medium">{application.parent_name}</p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Relationship
                  </label>
                  <p className="font-medium">
                    {application.parent_relationship}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <label className="text-sm text-muted-foreground">
                    Email Address
                  </label>
                  <p className="font-medium">
                    <a
                      href={`mailto:${application.parent_email}`}
                      className="text-primary hover:underline"
                    >
                      {application.parent_email}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <label className="text-sm text-muted-foreground">
                    Primary Phone
                  </label>
                  <p className="font-medium">
                    <a
                      href={`tel:${application.parent_phone}`}
                      className="text-primary hover:underline"
                    >
                      {application.parent_phone}
                    </a>
                  </p>
                </div>
              </div>

              {application.parent_phone_alternate && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Alternate Phone
                    </label>
                    <p className="font-medium">
                      <a
                        href={`tel:${application.parent_phone_alternate}`}
                        className="text-primary hover:underline"
                      >
                        {application.parent_phone_alternate}
                      </a>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <label className="text-sm text-muted-foreground">
                    Address
                  </label>
                  <p className="font-medium">
                    {application.address}
                    <br />
                    {application.city}, {application.postal_code}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Consent & Declarations */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Consents & Declarations</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Photo/Video Consent</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {application.photo_consent.replace("_", " ")}
                  </p>
                  {application.photo_consent_granted_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Granted on{" "}
                      {format(
                        new Date(application.photo_consent_granted_date),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Terms & Conditions</p>
                  <p className="text-sm text-muted-foreground">
                    Accepted (Version: {application.terms_version})
                  </p>
                  {application.terms_accepted_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepted on{" "}
                      {format(
                        new Date(application.terms_accepted_date),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Parent Declaration</p>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                  {application.parent_declaration_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Signed on{" "}
                      {format(
                        new Date(application.parent_declaration_date),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          <ApplicationActions application={application} />

          {/* Additional Info */}
          {(application.rejection_reason || application.review_notes) && (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-bold mb-4">Admin Notes</h3>

              {application.rejection_reason && (
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground">
                    Rejection Reason
                  </label>
                  <p className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-1">
                    {application.rejection_reason}
                  </p>
                </div>
              )}

              {application.review_notes && (
                <div>
                  <label className="text-sm text-muted-foreground">Notes</label>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 mt-1">
                    {application.review_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
