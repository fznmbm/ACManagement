import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const emailConfig = {
  from: "Al Hikmah Institute Crawley <onboarding@resend.dev>", // Resend test domain
  //replyTo: 'info@alhikmah.org.uk', // Your actual email for replies
  replyTo: "elitequk@gmail.com", // Your actual email for replies
};
