import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Email sender address (must be verified in Resend)
export const EMAIL_FROM = process.env.EMAIL_FROM || "Flock & Fur <noreply@flockfur.com>";

// Base URL for links in emails
export const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Email types for the application
export type EmailType =
  | "application_received"
  | "application_accepted"
  | "job_started"
  | "job_completed"
  | "job_confirmed"
  | "payment_processed"
  | "review_received";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  // Skip sending emails in development if no API key
  if (!process.env.RESEND_API_KEY) {
    console.log("Email skipped (no RESEND_API_KEY):", { to, subject });
    return { success: true, skipped: true };
  }

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

// Email template wrapper
function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flock & Fur</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #18181b;">Flock & Fur</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; color: #71717a; font-size: 12px;">
              <p style="margin: 0;">Flock & Fur - Animal Cleanup Services in Birmingham, AL</p>
              <p style="margin: 8px 0 0 0;">
                <a href="${BASE_URL}" style="color: #71717a;">Visit our website</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Button component for emails
function emailButton(text: string, url: string): string {
  return `
    <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 16px 0;">
      ${text}
    </a>
  `;
}

// ==========================================
// Email Templates
// ==========================================

export function applicationReceivedEmail(data: {
  clientName: string;
  jobTitle: string;
  cleanerName: string;
  proposedPrice?: number;
  message?: string;
  jobUrl: string;
}): { subject: string; html: string } {
  const subject = `New application for "${data.jobTitle}"`;
  const html = emailTemplate(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">New Application Received</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Hi ${data.clientName},
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      <strong>${data.cleanerName}</strong> has applied to your job: <strong>${data.jobTitle}</strong>
    </p>
    ${data.proposedPrice ? `
    <p style="margin: 0 0 8px 0; color: #3f3f46; line-height: 1.5;">
      <strong>Proposed price:</strong> $${data.proposedPrice.toFixed(2)}
    </p>
    ` : ""}
    ${data.message ? `
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      <strong>Message:</strong> "${data.message}"
    </p>
    ` : ""}
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Review their application and accept if you'd like to work with them.
    </p>
    ${emailButton("View Application", data.jobUrl)}
  `);

  return { subject, html };
}

export function applicationAcceptedEmail(data: {
  cleanerName: string;
  jobTitle: string;
  clientName: string;
  agreedPrice: number;
  jobAddress: string;
  jobUrl: string;
}): { subject: string; html: string } {
  const subject = `You've been accepted for "${data.jobTitle}"`;
  const html = emailTemplate(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Congratulations!</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Hi ${data.cleanerName},
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Great news! <strong>${data.clientName}</strong> has accepted your application for: <strong>${data.jobTitle}</strong>
    </p>
    <div style="background-color: #f4f4f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; color: #3f3f46;"><strong>Agreed price:</strong> $${data.agreedPrice.toFixed(2)}</p>
      <p style="margin: 0 0 8px 0; color: #3f3f46;"><strong>Your payout (80%):</strong> $${(data.agreedPrice * 0.8).toFixed(2)}</p>
      <p style="margin: 0; color: #3f3f46;"><strong>Location:</strong> ${data.jobAddress}</p>
    </div>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      You can now start working on this job when you're ready.
    </p>
    ${emailButton("View Job Details", data.jobUrl)}
  `);

  return { subject, html };
}

export function jobStartedEmail(data: {
  clientName: string;
  jobTitle: string;
  cleanerName: string;
  jobUrl: string;
}): { subject: string; html: string } {
  const subject = `${data.cleanerName} has started working on "${data.jobTitle}"`;
  const html = emailTemplate(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Job In Progress</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Hi ${data.clientName},
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      <strong>${data.cleanerName}</strong> has started working on your job: <strong>${data.jobTitle}</strong>
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      You'll receive another notification when they mark the job as complete with photos.
    </p>
    ${emailButton("View Job", data.jobUrl)}
  `);

  return { subject, html };
}

export function jobCompletedEmail(data: {
  clientName: string;
  jobTitle: string;
  cleanerName: string;
  agreedPrice: number;
  jobUrl: string;
}): { subject: string; html: string } {
  const subject = `"${data.jobTitle}" has been completed - Please confirm`;
  const html = emailTemplate(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Job Completed</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Hi ${data.clientName},
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      <strong>${data.cleanerName}</strong> has marked your job as complete: <strong>${data.jobTitle}</strong>
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Please review the completion photos and confirm the job is done to your satisfaction.
      Once confirmed, you'll be prompted to make the payment of <strong>$${data.agreedPrice.toFixed(2)}</strong>.
    </p>
    ${emailButton("Review & Confirm", data.jobUrl)}
  `);

  return { subject, html };
}

export function jobConfirmedEmail(data: {
  cleanerName: string;
  jobTitle: string;
  clientName: string;
  cleanerPayout: number;
  jobUrl: string;
}): { subject: string; html: string } {
  const subject = `"${data.jobTitle}" confirmed - Payment incoming`;
  const html = emailTemplate(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Job Confirmed!</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Hi ${data.cleanerName},
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      <strong>${data.clientName}</strong> has confirmed the completion of: <strong>${data.jobTitle}</strong>
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Payment is being processed. You'll receive <strong>$${data.cleanerPayout.toFixed(2)}</strong> once the transaction completes.
    </p>
    ${emailButton("View Job", data.jobUrl)}
  `);

  return { subject, html };
}

export function paymentProcessedEmail(data: {
  cleanerName: string;
  jobTitle: string;
  cleanerPayout: number;
  jobUrl: string;
}): { subject: string; html: string } {
  const subject = `Payment received: $${data.cleanerPayout.toFixed(2)} for "${data.jobTitle}"`;
  const html = emailTemplate(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Payment Received!</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Hi ${data.cleanerName},
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Great news! Payment has been processed for: <strong>${data.jobTitle}</strong>
    </p>
    <div style="background-color: #dcfce7; padding: 16px; border-radius: 6px; margin: 16px 0; text-align: center;">
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #166534;">
        $${data.cleanerPayout.toFixed(2)}
      </p>
      <p style="margin: 8px 0 0 0; color: #166534; font-size: 14px;">
        deposited to your connected account
      </p>
    </div>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Thank you for your great work! Don't forget to leave a review for your client.
    </p>
    ${emailButton("Leave a Review", data.jobUrl)}
  `);

  return { subject, html };
}

export function reviewReceivedEmail(data: {
  recipientName: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  jobTitle: string;
  jobUrl: string;
}): { subject: string; html: string } {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  const subject = `${data.reviewerName} left you a ${data.rating}-star review`;
  const html = emailTemplate(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">New Review</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      Hi ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.5;">
      <strong>${data.reviewerName}</strong> has left a review for: <strong>${data.jobTitle}</strong>
    </p>
    <div style="background-color: #f4f4f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 24px; color: #eab308;">${stars}</p>
      ${data.comment ? `<p style="margin: 0; color: #3f3f46; font-style: italic;">"${data.comment}"</p>` : ""}
    </div>
    ${emailButton("View Review", data.jobUrl)}
  `);

  return { subject, html };
}
