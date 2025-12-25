import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
//import { Resend } from "resend";
//const resend = new Resend(process.env.RESEND_API_KEY);
import { resend, emailConfig } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    const { parentEmail, studentId } = await request.json();

    if (!parentEmail || !studentId) {
      return NextResponse.json(
        { error: "Parent email and student ID are required" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get parent profile
    const { data: parentProfile, error: parentError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", parentEmail)
      .eq("role", "parent")
      .single();

    if (parentError || !parentProfile) {
      return NextResponse.json(
        { error: "Parent profile not found" },
        { status: 404 }
      );
    }

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("student_number, first_name, last_name")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get all linked students for this parent
    const { data: linkedStudents, error: linksError } = await supabase
      .from("parent_student_links")
      .select(
        `
        student_id,
        students:student_id (
          student_number,
          first_name,
          last_name
        )
      `
      )
      .eq("parent_user_id", parentProfile.id);

    if (linksError) {
      console.error("Error fetching linked students:", linksError);
    }

    // Generate password reset link (magic link for first-time setup)
    const { data: resetData, error: resetError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: parentEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/parent/set-password`,
        },
      });

    if (resetError) {
      console.error("Error generating magic link:", resetError);
      return NextResponse.json(
        { error: "Failed to generate login link" },
        { status: 500 }
      );
    }

    // Build student list for email
    let studentListHtml = "";
    if (linkedStudents && linkedStudents.length > 0) {
      studentListHtml = linkedStudents
        .map((link: any) => {
          const s = link.students;
          return `<li>${s.first_name} ${s.last_name} (${s.student_number})</li>`;
        })
        .join("");
    }

    // Send welcome email with magic link
    try {
      await resend.emails.send({
        from: emailConfig.from,
        replyTo: emailConfig.replyTo,
        to: parentEmail,
        subject: "Welcome to Al Hikmah Parent Portal",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">Welcome to Al Hikmah Parent Portal! 🎉</h2>
            
            <p>Dear ${parentProfile.full_name},</p>
            
            <p>Your parent portal account has been created. You can now track your child's progress, view attendance, check grades, and stay updated with school activities.</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #16a34a;">Your Linked Students</h3>
              <ul style="margin: 10px 0;">
                ${studentListHtml}
              </ul>
            </div>

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2563eb;">Set Up Your Account</h3>
              <p style="margin: 5px 0;">Click the button below to set your password and access the parent portal:</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${resetData.properties.action_link}" 
                   style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Set Password & Login
                </a>
              </div>
              
              <p style="margin: 5px 0; font-size: 12px; color: #666;">
                This link will expire in 24 hours. If you don't set up your account within this time, please contact the school.
              </p>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #d97706;">What You Can Do</h3>
              <ul style="margin: 10px 0;">
              <li>Parent Dashboard</li>
                <li>View real-time attendance records</li>
                <li>Check exam results and report cards</li>
                <li>End of class teacher feedback</li>
                <li>View fee information and payment history</li>
                <li>Receive important announcements and updates</li>
                <li>Check academic progress</li>
              
              </ul>
            </div>

            <p>If you have any questions or need assistance, please contact us.</p>
            
            <p>JazakAllah Khair,<br>
            Al Hikmah Institute Team</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280;">
              <strong>Portal URL:</strong> ${process.env.NEXT_PUBLIC_APP_URL}/parent/login<br>
              <strong>Your Email:</strong> ${parentEmail}
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      return NextResponse.json(
        { error: "Failed to send welcome email" },
        { status: 500 }
      );
    }

    // Update profile to mark that login details have been sent
    await supabase
      .from("profiles")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", parentProfile.id);

    return NextResponse.json({
      success: true,
      message: "Login details sent successfully to parent",
    });
  } catch (error) {
    console.error("Error sending parent login details:", error);
    return NextResponse.json(
      { error: "Failed to send login details" },
      { status: 500 }
    );
  }
}
