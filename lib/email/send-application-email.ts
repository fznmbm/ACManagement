import { resend, emailConfig } from "./resend";
import { format } from "date-fns";

interface Application {
  application_number: string;
  child_first_name: string;
  child_last_name: string;
  parent_name: string;
  parent_email: string;
  academic_year: string;
  submission_date: string;
}

// HTML Email Templates
function getApplicationReceivedEmailHTML(
  parentName: string,
  childFirstName: string,
  childLastName: string,
  applicationNumber: string,
  academicYear: string,
  submissionDate: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background-color: #16a34a; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Al Hikmah Institute Crawley</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Islamic Educational Centre</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Application Received</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              Dear ${parentName},
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              <strong>Assalamu Alaikum,</strong>
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              Thank you for submitting an application for <strong>${childFirstName} ${childLastName}</strong> to Al Hikmah Institute Crawley.
            </p>
            
            <!-- Details Box -->
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Application Number:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${applicationNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Academic Year:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${academicYear}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Submitted On:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${submissionDate}</td>
                </tr>
              </table>
            </div>
            
            <!-- Info Box -->
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <p style="color: #1e40af; margin: 0; line-height: 1.6;">
                <strong>What happens next?</strong><br/>
                We have received your application and it is currently being reviewed. 
                You will receive a response within <strong>5-7 working days</strong>.
              </p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
               Please keep your application number for reference. If you have any questions, feel free to contact us:<br/>
  <strong>Phone:</strong> <a href="tel:+447411061242" style="color: #16a34a; text-decoration: none;">+44 7411 061242</a><br/>
  <strong>Email:</strong> <a href="mailto:alhikmahinstitutecrawley@gmail.com" style="color: #16a34a; text-decoration: none;">alhikmahinstitutecrawley@gmail.com</a>
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0 0 0;">
              <strong>JazakAllah Khair,</strong><br/>
              Al Hikmah Institute Crawley
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© 2025 Al Hikmah Institute Crawley. All rights reserved.</p>
            <p style="margin: 10px 0 0 0;">Crawley, West Sussex | +44 7411 061242 | alhikmahinstitutecrawley@gmail.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getApplicationAcceptedEmailHTML(
  parentName: string,
  childFirstName: string,
  childLastName: string,
  applicationNumber: string,
  studentNumber: string,
  academicYear: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background-color: #16a34a; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Al Hikmah Institute Crawley</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Islamic Educational Centre</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px; background-color: #f9fafb;">
            <!-- Acceptance Banner -->
            <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; border: 2px solid #16a34a; text-align: center; margin: 0 0 30px 0;">
              <h2 style="color: #166534; margin: 0; font-size: 24px;">Application Accepted!</h2>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              Dear ${parentName},
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              <strong>Assalamu Alaikum,</strong>
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              We are delighted to inform you that the application for <strong>${childFirstName} ${childLastName}</strong> 
              has been <strong style="color: #16a34a;">ACCEPTED</strong> for the ${academicYear} academic year!
            </p>
            
            <!-- Details Box -->
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Application Number:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${applicationNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Student Number:</td>
                  <td style="padding: 10px 0; color: #16a34a; text-align: right; font-weight: bold;">${studentNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Academic Year:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${academicYear}</td>
                </tr>
              </table>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📋 Next Steps:</h3>
              <ol style="color: #1e40af; margin: 0; padding-left: 20px; line-height: 1.8;">
               <li>You will receive the confirmation on WhatsApp</li>
                <li>Attend the parents meeting (date will be communicated)</li>
              </ol>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              We look forward to welcoming <strong>${childFirstName}</strong> to Al Hikmah Institute Crawley! 
  If you have any questions, please contact us:<br/>
  <strong>Phone:</strong> <a href="tel:+447411061242" style="color: #16a34a; text-decoration: none;">+44 7411 061242</a><br/>
  <strong>Email:</strong> <a href="mailto:alhikmahinstitutecrawley@gmail.com" style="color: #16a34a; text-decoration: none;">alhikmahinstitutecrawley@gmail.com</a>
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0 0 0;">
              <strong>JazakAllah Khair,</strong><br/>
              Al Hikmah Institute Crawley
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© 2025 Al Hikmah Institute Crawley. All rights reserved.</p>
            <p style="margin: 10px 0 0 0;">Crawley, West Sussex | +44 7411 061242 | alhikmahinstitutecrawley@gmail.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getApplicationRejectedEmailHTML(
  parentName: string,
  childFirstName: string,
  childLastName: string,
  applicationNumber: string,
  rejectionReason: string,
  academicYear: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background-color: #16a34a; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Al Hikmah Institute Crawley</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Islamic Educational Centre</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Application Status Update</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              Dear ${parentName},
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              <strong>Assalamu Alaikum,</strong>
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              Thank you for your interest in Al Hikmah Institute Crawley and for submitting an 
              application for <strong>${childFirstName} ${childLastName}</strong>.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              After careful consideration, we regret to inform you that we are unable to offer 
              a place to ${childFirstName} for the ${academicYear} academic year at this time.
            </p>
            
            <!-- Details Box -->
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Application Number:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${applicationNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Academic Year:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${academicYear}</td>
                </tr>
              </table>
            </div>
            
            ${
              rejectionReason
                ? `
            <!-- Reason Box -->
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <p style="color: #7f1d1d; margin: 0; line-height: 1.6;">
                <strong>Reason:</strong><br/>
                ${rejectionReason}
              </p>
            </div>
            `
                : ""
            }
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">
              We understand this may be disappointing news. Please know that this decision was 
              made after careful review of all applications and consideration of our current capacity.
            </p>
            
            <!-- Info Box -->
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <p style="color: #1e40af; margin: 0; line-height: 1.6;">
                 We encourage you to apply again in future academic years. If you have any 
  questions or would like to discuss this further, please contact us:<br/>
  <strong>Phone:</strong> <a href="tel:+447411061242" style="color: #16a34a; text-decoration: none;">+44 7411 061242</a><br/>
  <strong>Email:</strong> <a href="mailto:alhikmahinstitutecrawley@gmail.com" style="color: #16a34a; text-decoration: none;">alhikmahinstitutecrawley@gmail.com</a>
              </p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 15px 0 0 0;">
              <strong>JazakAllah Khair,</strong><br/>
              Al Hikmah Institute Crawley
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© 2025 Al Hikmah Institute Crawley. All rights reserved.</p>
            <p style="margin: 10px 0 0 0;">Crawley, West Sussex | +44 7411 061242 | alhikmahinstitutecrawley@gmail.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Send confirmation email when application is submitted
export async function sendApplicationReceivedEmail(application: Application) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [application.parent_email],
      replyTo: emailConfig.replyTo,
      subject: `Application Received - Al Hikmah Institute Crawley`,
      html: getApplicationReceivedEmailHTML(
        application.parent_name,
        application.child_first_name,
        application.child_last_name,
        application.application_number,
        application.academic_year,
        format(new Date(application.submission_date), "MMMM dd, yyyy")
      ),
    });

    if (error) {
      console.error("❌ Failed to send application received email:", error);
      throw error;
    }

    console.log("✅ Application received email sent:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}

// Send acceptance email when application is accepted
export async function sendApplicationAcceptedEmail(
  application: Application,
  studentNumber: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [application.parent_email],
      replyTo: emailConfig.replyTo,
      subject: `Application Accepted - Al Hikmah Institute Crawley`,
      html: getApplicationAcceptedEmailHTML(
        application.parent_name,
        application.child_first_name,
        application.child_last_name,
        application.application_number,
        studentNumber,
        application.academic_year
      ),
    });

    if (error) {
      console.error("❌ Failed to send application accepted email:", error);
      throw error;
    }

    console.log("✅ Application accepted email sent:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}

// Send rejection email when application is rejected
export async function sendApplicationRejectedEmail(
  application: Application,
  rejectionReason: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [application.parent_email],
      replyTo: emailConfig.replyTo,
      subject: `Application Status Update - Al Hikmah Institute Crawley`,
      html: getApplicationRejectedEmailHTML(
        application.parent_name,
        application.child_first_name,
        application.child_last_name,
        application.application_number,
        rejectionReason,
        application.academic_year
      ),
    });

    if (error) {
      console.error("❌ Failed to send application rejected email:", error);
      throw error;
    }

    console.log("✅ Application rejected email sent:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}
