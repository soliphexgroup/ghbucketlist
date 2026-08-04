import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserEmail } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { hostApplicationDecision } from "@/lib/email/templates";

type AppRow = { user_id: string; email: string | null; full_name: string | null; status: string };

// Emails the applicant the outcome of their host application. Admin-only.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const applicationId = typeof body?.applicationId === "string" ? body.applicationId : "";
  if (!applicationId) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin === false) return NextResponse.json({ ok: true });

  const { data } = await supabase
    .from("host_applications")
    .select("user_id,email,full_name,status")
    .eq("id", applicationId)
    .maybeSingle();

  const row = data as AppRow | null;
  if (!row || row.status === "pending") return NextResponse.json({ ok: true });

  // Prefer the email on the application; fall back to the applicant's account email.
  const to = row.email || (await getUserEmail(row.user_id));
  if (!to) return NextResponse.json({ ok: true });

  const t = hostApplicationDecision({ name: row.full_name, approved: row.status === "approved" });
  await sendEmail({ to, subject: t.subject, html: t.html });
  return NextResponse.json({ ok: true });
}
