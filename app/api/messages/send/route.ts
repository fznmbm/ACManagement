import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
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
  variables: Record<string, any>,
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
        { status: 400 },
      );
    }

    // ===========================================
    // INDIVIDUAL STUDENT MESSAGE
    // ===========================================
    if (messageType === "individual") {
      if (!studentId || !parentContactType) {
        return NextResponse.json(
          { error: "Student ID and parent contact type required" },
          { status: 400 },
        );
      }

      // Get student details
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(
          "first_name, last_name, parent_name, parent_email, parent_phone, parent_phone_secondary, class_id",
        )
        .eq("id", studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 },
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

      // Email delivery removed — use WhatsApp for parent communication
      if (deliveryMethod === "email") {
        return NextResponse.json(
          { error: "Email delivery is not supported. Please use WhatsApp." },
          { status: 400 },
        );
      }

      // WHATSAPP DELIVERY
      if (deliveryMethod === "whatsapp_individual") {
        if (phoneNumbers.length === 0) {
          return NextResponse.json(
            { error: "No parent phone numbers available" },
            { status: 400 },
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
          { status: 400 },
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

      // Email to class removed — use WhatsApp group for class communication
      if (deliveryMethod === "email") {
        return NextResponse.json(
          {
            error:
              "Email delivery is not supported. Please use WhatsApp group.",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid message type or delivery method" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Send Message API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 },
    );
  }
}
