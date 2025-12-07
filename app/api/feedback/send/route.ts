import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface StudentFeedback {
  student_id: string;
  performance_ratings: { [key: string]: string };
  feedback_text: string;
  send_to_primary: boolean;
  send_to_secondary: boolean;
}

function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with 44
  if (cleaned.startsWith("0")) {
    cleaned = "44" + cleaned.substring(1);
  }

  // If doesn't start with 44, add it
  if (!cleaned.startsWith("44")) {
    cleaned = "44" + cleaned;
  }

  return cleaned;
}

function formatPerformanceRatings(ratings: { [key: string]: string }): string {
  const entries = Object.entries(ratings);
  if (entries.length === 0) return "";

  return entries
    .map(
      ([criteria, rating]) =>
        `${criteria}: ${
          rating.charAt(0).toUpperCase() + rating.slice(1).replace("_", " ")
        }`
    )
    .join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const teacherName = profile?.full_name || "Your teacher";

    const body = await request.json();
    const {
      class_id,
      session_date,
      class_summary,
      homework,
      student_feedback,
    }: {
      class_id: string;
      session_date: string;
      class_summary: string;
      homework: string;
      student_feedback: StudentFeedback[];
    } = body;

    // 1. Create or get feedback session
    const { data: sessionData, error: sessionError } = await supabase
      .from("class_feedback_sessions")
      .upsert(
        {
          class_id,
          session_date,
          class_summary: class_summary || null,
          homework: homework || null,
          created_by: user.id,
        },
        { onConflict: "class_id,session_date" }
      )
      .select()
      .single();

    if (sessionError) throw sessionError;

    const sessionId = sessionData.id;

    // 2. Get all students details
    const studentIds = student_feedback.map((f) => f.student_id);
    const { data: students } = await supabase
      .from("students")
      .select(
        "id, first_name, last_name, parent_name, parent_phone, parent_phone_secondary"
      )
      .in("id", studentIds);

    if (!students) throw new Error("Students not found");

    // 3. Save student feedback and create notifications
    const whatsappLinks: Array<{
      student_name: string;
      phone: string;
      message: string;
      url: string;
    }> = [];

    for (const feedbackItem of student_feedback) {
      const student = students.find((s) => s.id === feedbackItem.student_id);
      if (!student) continue;

      // Save feedback to database
      const { data: savedFeedback, error: feedbackError } = await supabase
        .from("student_feedback")
        .upsert(
          {
            session_id: sessionId,
            student_id: feedbackItem.student_id,
            performance_ratings: feedbackItem.performance_ratings,
            feedback_text: feedbackItem.feedback_text || null,
          },
          { onConflict: "session_id,student_id" }
        )
        .select()
        .single();

      if (feedbackError) {
        console.error("Error saving feedback:", feedbackError);
        continue;
      }

      // Build message
      const performanceText = formatPerformanceRatings(
        feedbackItem.performance_ratings
      );
      const feedbackText = feedbackItem.feedback_text
        ? `\n\nFeedback:\n${feedbackItem.feedback_text}`
        : "";
      const classSummaryText = class_summary
        ? `\n\nClass Summary:\n${class_summary}`
        : "";
      const homeworkText = homework ? `\n\nHomework:\n${homework}` : "";

      const message = `Assalamu Alaikum ${student.parent_name},

End of class report for ${student.first_name} ${student.last_name}:

${performanceText}${feedbackText}${classSummaryText}${homeworkText}

JazakAllah Khair,
${teacherName}
Al Hikma Institute Crawley`;

      // Create notification in database (for parent portal)
      const notificationTitle = `Class Feedback - ${student.first_name}`;
      const notificationMessage = message;

      const { data: notification } = await supabase.rpc(
        "create_parent_notification",
        {
          p_student_id: student.id,
          p_type: "feedback",
          p_priority: "normal",
          p_title: notificationTitle,
          p_message: notificationMessage,
          p_link_type: "feedback",
          p_link_id: savedFeedback.id,
        }
      );

      // Update student_feedback with notification_id
      if (notification) {
        await supabase
          .from("student_feedback")
          .update({ notification_id: notification, notification_sent: true })
          .eq("id", savedFeedback.id);
      }

      // Generate WhatsApp links
      const phones: Array<{ phone: string; type: string }> = [];

      if (feedbackItem.send_to_primary && student.parent_phone) {
        phones.push({ phone: student.parent_phone, type: "primary" });
      }

      if (feedbackItem.send_to_secondary && student.parent_phone_secondary) {
        phones.push({
          phone: student.parent_phone_secondary,
          type: "secondary",
        });
      }

      for (const { phone } of phones) {
        const formattedPhone = formatPhoneForWhatsApp(phone);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

        whatsappLinks.push({
          student_name: `${student.first_name} ${student.last_name}`,
          phone,
          message,
          url: whatsappUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      whatsapp_links: whatsappLinks,
      notifications_created: whatsappLinks.length,
    });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
