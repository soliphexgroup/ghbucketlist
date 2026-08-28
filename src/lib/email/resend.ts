import { Resend } from "resend";

// Server-only email sender. No-ops gracefully when RESEND_API_KEY isn't configured yet, so email
// setup never blocks the app from running.

export type SendResult = { ok: boolean; message?: string };

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | null | undefined;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  // Defaults to the real GHBucketlist sender. This requires ghbucketlist.com to be a verified
  // domain in Resend; until then, set EMAIL_FROM to a verified sender (e.g. onboarding@resend.dev).
  const from = process.env.EMAIL_FROM || "GHBucketlist <noreply@ghbucketlist.com>";
  if (!apiKey) return { ok: false, message: "Email not configured (RESEND_API_KEY missing)." };
  if (!to) return { ok: false, message: "No recipient." };
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Email send failed." };
  }
}
