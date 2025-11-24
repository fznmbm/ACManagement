import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse the request body
    const { name, email, phone, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Insert contact inquiry into contact_inquiries table
    const { error: insertError } = await supabase
      .from("contact_inquiries")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subject: subject || "General Inquiry",
        message: message.trim(),
        status: "new",
      });

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    // Log for admin notification (TODO: Send email)
    console.log("=== NEW CONTACT INQUIRY ===");
    console.log(`From: ${name} (${email})`);
    console.log(`Phone: ${phone || "N/A"}`);
    console.log(`Subject: ${subject || "General Inquiry"}`);
    console.log(`Message: ${message}`);
    console.log("===========================");

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
