import { NextRequest, NextResponse } from "next/server";
//import { createClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendApplicationReceivedEmail } from "@/lib/email/send-application-email";

export async function POST(request: NextRequest) {
  try {
    // Use service role to bypass RLS for public application submissions
    // This is safe because we validate all input and don't expose admin functions

    //const supabase = await createClient();

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

    // Parse the request body
    const formData = await request.json();

    // Validate required fields
    const requiredFields = [
      "child_first_name",
      "child_last_name",
      "date_of_birth",
      "gender",
      "parent_name",
      "parent_relationship",
      "parent_phone",
      "parent_email",
      "address",
      "city",
      "postal_code",
      "academic_year",
      "photo_consent",
      "terms_accepted",
      "parent_declaration_accepted",
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if applications are still open
    const { data: settings } = await supabase
      .from("application_settings")
      .select("*")
      .eq("academic_year", formData.academic_year)
      .eq("is_active", true)
      .single();

    if (!settings) {
      return NextResponse.json(
        { error: "Applications are not currently open for this academic year" },
        { status: 400 }
      );
    }

    const today = new Date();
    const openDate = new Date(settings.application_open_date);
    const closeDate = new Date(settings.application_close_date);

    if (today < openDate || today > closeDate) {
      return NextResponse.json(
        {
          error: "Applications are closed. Please check the application dates.",
        },
        { status: 400 }
      );
    }

    if (settings.current_applications_count >= settings.max_applications) {
      return NextResponse.json(
        {
          error:
            "Maximum application capacity reached. Applications are now closed.",
        },
        { status: 400 }
      );
    }

    // Validate age requirement
    const birthDate = new Date(formData.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < settings.minimum_age) {
      return NextResponse.json(
        {
          error: `Applicant must be at least ${settings.minimum_age} years old`,
        },
        { status: 400 }
      );
    }

    // Insert application into database
    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert({
        child_first_name: formData.child_first_name,
        child_last_name: formData.child_last_name,
        child_arabic_name: formData.child_arabic_name || null,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        parent_name: formData.parent_name,
        parent_relationship: formData.parent_relationship,
        parent_phone: formData.parent_phone,
        parent_phone_alternate: formData.parent_phone_alternate || null,
        parent_email: formData.parent_email,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        academic_year: formData.academic_year,
        medical_conditions: formData.medical_conditions || null,
        special_requirements: formData.special_requirements || null,
        can_read_write_english: formData.can_read_write_english,
        photo_consent: formData.photo_consent,
        photo_consent_granted_date: new Date().toISOString(),
        terms_accepted: formData.terms_accepted,
        terms_accepted_date: new Date().toISOString(),
        terms_version: formData.terms_version || "1.0",
        parent_declaration_accepted: formData.parent_declaration_accepted,
        parent_declaration_date: new Date().toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit application. Please try again." },
        { status: 500 }
      );
    }

    // Increment application counter (don't fail if this fails)
    try {
      await supabase
        .from("application_settings")
        .update({
          current_applications_count: settings.current_applications_count + 1,
        })
        .eq("id", settings.id);
    } catch (counterError) {
      console.error("Failed to increment counter:", counterError);
      // Don't fail the application submission if counter increment fails
    }

    // Send confirmation email (basic version - we'll enhance this later)
    try {
      console.log(
        "📧 Sending confirmation email to:",
        application.parent_email
      );
      // await sendConfirmationEmail(application, settings);
      const emailResult = await sendApplicationReceivedEmail(application);

      if (emailResult.success) {
        console.log("✅ Confirmation email sent successfully");
      } else {
        console.error("⚠️ Email failed but application was saved");
      }
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail the application if email fails
    }

    // Return success with application number
    return NextResponse.json(
      {
        success: true,
        application_number: application.application_number,
        message: "Application submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Application submission error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// Email sending function (placeholder - we'll implement proper email later)
async function sendConfirmationEmail(application: any, settings: any) {
  // For now, we'll just log it
  // Later we can integrate with Resend, SendGrid, or Gmail SMTP

  console.log("=== CONFIRMATION EMAIL ===");
  console.log(`To: ${application.parent_email}`);
  console.log(`Subject: Application Received - Al Hikmah Institute Crawley`);
  console.log(`Application Number: ${application.application_number}`);
  console.log(
    `Child Name: ${application.child_first_name} ${application.child_last_name}`
  );
  console.log(`Parent Name: ${application.parent_name}`);
  console.log("===========================");

  // TODO: Implement actual email sending
  // Example with Resend (we'll add this later):
  /*
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  await resend.emails.send({
    from: 'Al Hikma Institute <noreply@alhikma.org.uk>',
    to: application.parent_email,
    subject: 'Application Received - Al Hikma Institute Crawley',
    html: `
      <h1>Application Received</h1>
      <p>Dear ${application.parent_name},</p>
      <p>Assalamu Alaikum,</p>
      <p>Thank you for submitting an application for ${application.child_first_name} ${application.child_last_name} to Al Hikma Institute Crawley.</p>
      <p><strong>Your application number is: ${application.application_number}</strong></p>
      <p>We have received your application and it is currently being reviewed. You will receive a response within 5-7 working days.</p>
      <p>If you have any questions, please contact us at info@alhikma.org.uk</p>
      <p>JazakAllah Khair,<br>Al Hikma Institute Crawley</p>
    `
  })
  */
}
