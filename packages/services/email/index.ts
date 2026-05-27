import { Resend } from "resend";

export interface SendEmailOptions {
  apiKey?: string;
  from?: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  apiKey,
  from = "noreply@adity.app",
  to,
  subject,
  html,
}: SendEmailOptions) {
  if (!apiKey) {
    console.warn("[Email Service Mock] No API Key provided. Logging email content:");
    console.log(`To: ${to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}
