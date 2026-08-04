import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserEmail } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { payoutDecision } from "@/lib/email/templates";

type PayoutRow = { host_id: string; amount: number; method: string | null; status: string };

// Emails the host the decision on their payout request. Admin-only.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const payoutId = typeof body?.payoutId === "string" ? body.payoutId : "";
  if (!payoutId) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin === false) return NextResponse.json({ ok: true });

  const { data } = await supabase
    .from("payouts")
    .select("host_id,amount,method,status")
    .eq("id", payoutId)
    .maybeSingle();

  const row = data as PayoutRow | null;
  if (!row || row.status === "pending") return NextResponse.json({ ok: true });

  const hostEmail = await getUserEmail(row.host_id);
  if (hostEmail) {
    const t = payoutDecision({ amount: row.amount, method: row.method, approved: row.status === "approved" });
    await sendEmail({ to: hostEmail, subject: t.subject, html: t.html });
  }
  return NextResponse.json({ ok: true });
}
