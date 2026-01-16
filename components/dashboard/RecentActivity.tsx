// components/dashboard/RecentActivity.tsx
import { createClient } from "@/lib/supabase/server";
import {
  UserPlus,
  CreditCard,
  Award,
  AlertCircle,
  FileCheck,
  Mail,
  Calendar as CalendarIcon,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

type Activity = {
  id: string;
  type:
    | "student_enrolled"
    | "fee_paid"
    | "certificate_issued"
    | "fine_collected"
    | "application_accepted"
    | "event_created"
    | "attendance_marked"
    | "fine_waived";
  description: string;
  timestamp: Date;
  icon: any;
  color: string;
  bgColor: string;
  href?: string;
};

export default async function RecentActivity() {
  const supabase = await createClient();

  const activities: Activity[] = [];

  // Get recent students (last 5)
  const { data: recentStudents } = await supabase
    .from("students")
    .select("id, first_name, last_name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  recentStudents?.forEach((student) => {
    activities.push({
      id: `student-${student.id}`,
      type: "student_enrolled",
      description: `${student.first_name} ${student.last_name} enrolled`,
      timestamp: new Date(student.created_at),
      icon: UserPlus,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      href: `/students/${student.id}`,
    });
  });

  // Get recent paid invoices (last 5)
  const { data: recentPayments } = await supabase
    .from("fee_invoices")
    .select(
      `
      id,
      invoice_number,
      amount_paid,
      paid_date,
      students (first_name, last_name)
    `
    )
    .eq("status", "paid")
    .not("paid_date", "is", null)
    .order("paid_date", { ascending: false })
    .limit(5);

  recentPayments?.forEach((payment) => {
    activities.push({
      id: `payment-${payment.id}`,
      type: "fee_paid",
      description: `${payment.students?.[0]?.first_name || "Student"} ${
        payment.students?.[0]?.last_name || ""
      } paid £${payment.amount_paid.toFixed(2)}`,
      timestamp: new Date(payment.paid_date),
      icon: CreditCard,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      href: `/fees`,
    });
  });

  // Get recent certificates (last 5)
  const { data: recentCertificates } = await supabase
    .from("certificates")
    .select(
      `
      id,
      certificate_number,
      issued_date,
      students (first_name, last_name)
    `
    )
    .order("issued_date", { ascending: false })
    .limit(5);

  recentCertificates?.forEach((cert) => {
    activities.push({
      id: `cert-${cert.id}`,
      type: "certificate_issued",
      description: `Certificate ${cert.certificate_number} issued to ${
        cert.students?.[0]?.first_name || "Student"
      } ${cert.students?.[0]?.last_name || ""}`,
      timestamp: new Date(cert.issued_date),
      icon: Award,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      href: `/curriculum-assessment/certificates`,
    });
  });

  // Get recent collected fines (last 5)
  const { data: recentFines } = await supabase
    .from("fines")
    .select(
      `
      id,
      amount,
      paid_date,
      status,
      students (first_name, last_name)
    `
    )
    .in("status", ["paid", "waived"])
    .not("paid_date", "is", null)
    .order("paid_date", { ascending: false })
    .limit(5);

  recentFines?.forEach((fine) => {
    activities.push({
      id: `fine-${fine.id}`,
      type: fine.status === "waived" ? "fine_waived" : "fine_collected",
      description: `Fine ${
        fine.status === "waived" ? "waived" : "collected"
      } from ${fine.students?.[0]?.first_name || "Student"} ${
        fine.students?.[0]?.last_name || ""
      } (£${fine.amount.toFixed(2)})`,
      timestamp: new Date(fine.paid_date),
      icon: fine.status === "waived" ? CheckCircle : AlertCircle,
      color:
        fine.status === "waived"
          ? "text-purple-600 dark:text-purple-400"
          : "text-orange-600 dark:text-orange-400",
      bgColor:
        fine.status === "waived"
          ? "bg-purple-100 dark:bg-purple-900/30"
          : "bg-orange-100 dark:bg-orange-900/30",
      href: `/fines`,
    });
  });

  // Get recent accepted applications (last 5)
  const { data: recentApplications } = await supabase
    .from("applications")
    .select("id, student_name, updated_at")
    .eq("status", "accepted")
    .order("updated_at", { ascending: false })
    .limit(5);

  recentApplications?.forEach((app) => {
    activities.push({
      id: `app-${app.id}`,
      type: "application_accepted",
      description: `Application accepted for ${app.student_name}`,
      timestamp: new Date(app.updated_at),
      icon: FileCheck,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
      href: `/applications/${app.id}`,
    });
  });

  // Get recent events (last 3)
  const { data: recentEvents } = await supabase
    .from("events")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  recentEvents?.forEach((event) => {
    activities.push({
      id: `event-${event.id}`,
      type: "event_created",
      description: `Event created: ${event.title}`,
      timestamp: new Date(event.created_at),
      icon: CalendarIcon,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
      href: `/events`,
    });
  });

  // Sort all activities by timestamp (most recent first)
  const sortedActivities = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10); // Show only last 10 activities

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <span className="text-xs text-muted-foreground">Last 10 actions</span>
      </div>

      {sortedActivities.length > 0 ? (
        <div className="space-y-2">
          {sortedActivities.map((activity) => {
            const Icon = activity.icon;
            const content = (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                  <Icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            );

            return activity.href ? (
              <Link key={activity.id} href={activity.href}>
                {content}
              </Link>
            ) : (
              <div key={activity.id}>{content}</div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No recent activity to display
          </p>
        </div>
      )}
    </div>
  );
}
