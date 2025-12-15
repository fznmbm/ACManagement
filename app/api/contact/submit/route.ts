// File: app/api/contact/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Parse form data from request
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Map subject codes to readable text
    const subjectMap: { [key: string]: string } = {
      general_inquiry: "General Inquiry",
      admissions: "Admissions Information",
      programs: "Programs & Classes",
      fees: "Fees & Payments",
      schedule: "Class Schedule",
      other: "Other",
    };

    const subjectText = subject ? subjectMap[subject] || subject : "No Subject";

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Al Hikmah Institute <noreply@al-hikmah.org>", // Update with your verified domain
      to: ["alhikmahinstitutecrawley@gmail.com"], // School email
      replyTo: email, // User's email for easy reply
      subject: `Contact Form: ${subjectText}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .field {
                margin-bottom: 20px;
                padding: 15px;
                background: white;
                border-radius: 6px;
                border-left: 4px solid #22c55e;
              }
              .label {
                font-weight: bold;
                color: #16a34a;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
              }
              .value {
                color: #1f2937;
                font-size: 15px;
              }
              .message-box {
                background: white;
                padding: 20px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
                margin-top: 10px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Al Hikmah Institute Crawley</p>
              </div>
              
              <div class="content">
                <div class="field">
                  <div class="label">From</div>
                  <div class="value">${name}</div>
                </div>

                <div class="field">
                  <div class="label">Email Address</div>
                  <div class="value"><a href="mailto:${email}" style="color: #22c55e;">${email}</a></div>
                </div>

                ${
                  phone
                    ? `
                <div class="field">
                  <div class="label">Phone Number</div>
                  <div class="value"><a href="tel:${phone}" style="color: #22c55e;">${phone}</a></div>
                </div>
                `
                    : ""
                }

                <div class="field">
                  <div class="label">Subject</div>
                  <div class="value">${subjectText}</div>
                </div>

                <div class="field">
                  <div class="label">Message</div>
                  <div class="message-box">
                    ${message.replace(/\n/g, "<br>")}
                  </div>
                </div>

                <div class="footer">
                  <p>This message was sent from the contact form on your website.</p>
                  <p>Reply directly to this email to respond to ${name}.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Check for errors
    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
