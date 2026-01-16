import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = "force-dynamic";

// Helper: Format UK phone for WhatsApp (07123456789 -> 447123456789)
function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return "44" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("44")) {
    return "44" + cleaned;
  }
  return cleaned;
}

// Helper: Replace template variables
function replaceVariables(
  text: string,
  variables: Record<string, any>
): string {
  let result = text;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{${key}}`, "g");
    result = result.replace(regex, variables[key] || "");
  });
  return result;
}

// POST - Send message
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    const body = await request.json();
    const {
      messageType, // 'individual' or 'class'
      studentId,
      classId,
      parentContactType, // 'father', 'mother', 'both'
      subject,
      message,
      deliveryMethod, // 'email', 'whatsapp_individual', 'whatsapp_group'
      templateUsed,
    } = body;

    // Validate required fields
    if (!messageType || !message || !deliveryMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ===========================================
    // INDIVIDUAL STUDENT MESSAGE
    // ===========================================
    if (messageType === "individual") {
      if (!studentId || !parentContactType) {
        return NextResponse.json(
          { error: "Student ID and parent contact type required" },
          { status: 400 }
        );
      }

      // Get student details
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(
          "first_name, last_name, parent_name, parent_email, parent_phone, parent_phone_secondary, class_id"
        )
        .eq("id", studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      // Fetch class information if student has a class
      let className = "your class";
      if (student.class_id) {
        const { data: classData } = await supabase
          .from("classes")
          .select("name")
          .eq("id", student.class_id)
          .single();

        if (classData) {
          className = classData.name;
        }
      }

      // Determine parent contact and phone numbers
      let parentName = student.parent_name;
      let parentEmail = student.parent_email;
      let phoneNumbers: string[] = [];

      if (parentContactType === "father") {
        if (student.parent_phone) phoneNumbers.push(student.parent_phone);
      } else if (parentContactType === "mother") {
        if (student.parent_phone_secondary)
          phoneNumbers.push(student.parent_phone_secondary);
      } else if (parentContactType === "both") {
        if (student.parent_phone) phoneNumbers.push(student.parent_phone);
        if (student.parent_phone_secondary)
          phoneNumbers.push(student.parent_phone_secondary);
      }

      // EMAIL DELIVERY
      if (deliveryMethod === "email") {
        if (!parentEmail) {
          return NextResponse.json(
            { error: "Parent email not available" },
            { status: 400 }
          );
        }

        try {
          // Replace variables
          const variables = {
            student_name: `${student.first_name} ${student.last_name}`,
            parent_name: parentName,
            teacher_name: profile?.full_name || "Teacher",
            class_name: className,
            ...(body.customVariables || {}), // ✅ ADD THIS LINE - Merge custom variables
          };

          const processedMessage = replaceVariables(message, variables);
          const processedSubject = replaceVariables(
            subject || "Message from Teacher",
            variables
          );

          // Send email via Resend
          await resend.emails.send({
            from: "Al Hikmah Institute <noreply@alhikmainstitute.org>",
            to: parentEmail,
            subject: processedSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #22c55e; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0;">Al Hikmah Institute</h1>
                </div>
                <div style="padding: 30px; background-color: #f9fafb;">
                  <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6; margin: 0;">${processedMessage}</pre>
                  </div>
                  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
                    <p>This is an automated message from Al Hikmah Institute</p>
                  </div>
                </div>
              </div>
            `,
          });

          // Save message record
          const { data: messageRecord, error: messageError } = await supabase
            .from("messages")
            .insert({
              sender_id: user.id,
              message_type: messageType,
              student_id: studentId,
              parent_contact_type: parentContactType,
              parent_name: parentName,
              parent_phone: phoneNumbers.join(", "),
              parent_email: parentEmail,
              subject: processedSubject,
              message: processedMessage,
              template_used: templateUsed,
              delivery_method: deliveryMethod,
              email_sent: true,
              email_sent_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (messageError) throw messageError;

          return NextResponse.json({
            success: true,
            method: "email",
            message: "Email sent successfully",
            messageId: messageRecord.id,
          });
        } catch (emailError: any) {
          // Save failed message record
          await supabase.from("messages").insert({
            sender_id: user.id,
            message_type: messageType,
            student_id: studentId,
            parent_contact_type: parentContactType,
            parent_name: parentName,
            parent_phone: phoneNumbers.join(", "),
            parent_email: parentEmail,
            subject: subject,
            message: message,
            template_used: templateUsed,
            delivery_method: deliveryMethod,
            email_sent: false,
            email_error: emailError.message,
          });

          return NextResponse.json(
            { error: "Failed to send email: " + emailError.message },
            { status: 500 }
          );
        }
      }

      // WHATSAPP DELIVERY
      if (deliveryMethod === "whatsapp_individual") {
        if (phoneNumbers.length === 0) {
          return NextResponse.json(
            { error: "No parent phone numbers available" },
            { status: 400 }
          );
        }

        // Replace variables in message
        const variables = {
          student_name: `${student.first_name} ${student.last_name}`,
          parent_name: parentName,
          teacher_name: profile?.full_name || "Teacher",
          class_name: className,
          ...(body.customVariables || {}), // ✅ ADD THIS LINE - Merge custom variables
        };

        const processedMessage = replaceVariables(message, variables);
        const whatsappMessage = encodeURIComponent(processedMessage);

        // Generate WhatsApp URLs for all phone numbers
        const whatsappUrls = phoneNumbers.map((phone) => {
          const formattedPhone = formatPhoneForWhatsApp(phone);
          return `https://wa.me/${formattedPhone}?text=${whatsappMessage}`;
        });

        // Save message record
        const { data: messageRecord, error: messageError } = await supabase
          .from("messages")
          .insert({
            sender_id: user.id,
            message_type: messageType,
            student_id: studentId,
            parent_contact_type: parentContactType,
            parent_name: parentName,
            parent_phone: phoneNumbers.join(", "),
            parent_email: parentEmail,
            subject: subject,
            message: processedMessage,
            template_used: templateUsed,
            delivery_method: deliveryMethod,
            whatsapp_link_generated: true,
          })
          .select()
          .single();

        if (messageError) throw messageError;

        return NextResponse.json({
          success: true,
          method: "whatsapp",
          whatsappUrls: whatsappUrls,
          parentName: parentName,
          messageId: messageRecord.id,
        });
      }
    }

    // ===========================================
    // CLASS MESSAGE
    // ===========================================
    if (messageType === "class") {
      if (!classId) {
        return NextResponse.json(
          { error: "Class ID required for class messages" },
          { status: 400 }
        );
      }

      // Get class details
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("name")
        .eq("id", classId)
        .single();

      if (classError || !classData) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }

      // WHATSAPP GROUP (just save message, teacher will copy to their group)
      if (deliveryMethod === "whatsapp_group") {
        const { data: messageRecord, error: messageError } = await supabase
          .from("messages")
          .insert({
            sender_id: user.id,
            message_type: messageType,
            class_id: classId,
            subject: subject,
            message: message,
            template_used: templateUsed,
            delivery_method: deliveryMethod,
            whatsapp_message_copied: false,
          })
          .select()
          .single();

        if (messageError) throw messageError;

        return NextResponse.json({
          success: true,
          method: "whatsapp_group",
          message: "Message ready to copy for WhatsApp group",
          messageText: message,
          className: classData.name,
          messageId: messageRecord.id,
        });
      }

      // EMAIL - Send to all parents in class
      if (deliveryMethod === "email") {
        // Get all students in class with parent emails
        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select("id, first_name, last_name, parent_name, parent_email")
          .eq("class_id", classId)
          .eq("status", "active");

        if (studentsError) throw studentsError;

        if (!students || students.length === 0) {
          return NextResponse.json(
            { error: "No active students found in this class" },
            { status: 404 }
          );
        }

        // Filter students with valid email addresses
        const studentsWithEmail = students.filter((s) => s.parent_email);

        if (studentsWithEmail.length === 0) {
          return NextResponse.json(
            { error: "No parent email addresses available for this class" },
            { status: 400 }
          );
        }

        let successCount = 0;
        let failCount = 0;

        // Send email to each parent
        for (const student of studentsWithEmail) {
          try {
            // Replace variables for each student
            const variables = {
              student_name: `${student.first_name} ${student.last_name}`,
              parent_name: student.parent_name,
              teacher_name: profile?.full_name || "Teacher",
              class_name: classData.name,
            };

            const processedMessage = replaceVariables(message, variables);
            const processedSubject = replaceVariables(
              subject || `Class Message - ${classData.name}`,
              variables
            );

            await resend.emails.send({
              from: "Al Hikmah Institute <noreply@alhikmainstitute.org>",
              to: student.parent_email,
              subject: processedSubject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #22c55e; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Al Hikmah Institute</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">${classData.name}</p>
                  </div>
                  <div style="padding: 30px; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6; margin: 0;">${processedMessage}</pre>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
                      <p>This is an automated message from Al Hikmah Institute</p>
                    </div>
                  </div>
                </div>
              `,
            });
            successCount++;
          } catch (error) {
            console.error(
              `Failed to send email to ${student.parent_email}:`,
              error
            );
            failCount++;
          }
        }

        // Save message record
        const { data: messageRecord, error: messageError } = await supabase
          .from("messages")
          .insert({
            sender_id: user.id,
            message_type: messageType,
            class_id: classId,
            subject: subject,
            message: message,
            template_used: templateUsed,
            delivery_method: deliveryMethod,
            email_sent: successCount > 0,
            email_sent_at: successCount > 0 ? new Date().toISOString() : null,
            email_error:
              failCount > 0 ? `${failCount} emails failed to send` : null,
          })
          .select()
          .single();

        if (messageError) throw messageError;

        return NextResponse.json({
          success: true,
          method: "email",
          message: `Emails sent: ${successCount} succeeded, ${failCount} failed`,
          successCount,
          failCount,
          totalStudents: studentsWithEmail.length,
          messageId: messageRecord.id,
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid message type or delivery method" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Send Message API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
