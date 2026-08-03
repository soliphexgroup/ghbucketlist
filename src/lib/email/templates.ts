// Branded HTML email templates (server-only). Plain strings with inline styles for wide client
// support. Each builder returns { subject, html }.

const BRAND = "#0e7c42";
const SITE = "https://ghbucketlist.com";

function ghs(n: number) {
  return `GHS ${Number(n).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
}

function niceDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function layout(heading: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f6f7;font-family:Arial,Helvetica,sans-serif;color:#1a2332;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:${BRAND};border-radius:16px 16px 0 0;padding:20px 24px;">
      <span style="color:#fff;font-size:20px;font-weight:800;">GH<span style="color:#f4a261;">Bucketlist</span></span>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:24px;border:1px solid #e7ebf0;border-top:none;">
      <h1 style="margin:0 0 12px;font-size:20px;">${esc(heading)}</h1>
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#8a94a3;font-size:12px;margin:16px 0;">
      GH Bucketlist · <a href="${SITE}" style="color:${BRAND};text-decoration:none;">ghbucketlist.com</a>
    </p>
  </div></body></html>`;
}

function detailRow(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:#5b6875;font-size:14px;">${esc(label)}</td>
    <td style="padding:6px 0;text-align:right;font-size:14px;font-weight:600;">${esc(value)}</td></tr>`;
}

function button(href: string, text: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;background:${BRAND};color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px;">${esc(text)}</a>`;
}

export function bookingConfirmationCustomer(input: {
  guestName?: string | null;
  listingTitle: string;
  reference: string;
  startDate: string;
  endDate: string;
  total: number;
  requestOnly: boolean;
}) {
  const greeting = input.guestName ? `Hi ${input.guestName},` : "Hi there,";
  const lead = input.requestOnly
    ? "We've sent your request to the host — you'll hear back shortly. You won't be charged unless they accept."
    : "Your booking is confirmed. Here are the details:";
  const body = `
    <p style="font-size:14px;line-height:1.6;">${esc(greeting)}</p>
    <p style="font-size:14px;line-height:1.6;">${lead}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;">
      ${detailRow("Listing", input.listingTitle)}
      ${detailRow("Reference", input.reference)}
      ${detailRow("Dates", `${niceDate(input.startDate)} → ${niceDate(input.endDate)}`)}
      ${detailRow("Total", ghs(input.total))}
    </table>
    ${button(`${SITE}/dashboard/user/bookings`, "View in My Bookings")}
  `;
  return {
    subject: input.requestOnly
      ? `Request sent — ${input.listingTitle}`
      : `Booking confirmed — ${input.listingTitle}`,
    html: layout(input.requestOnly ? "Request sent" : "Booking confirmed", body),
  };
}

export function newBookingHost(input: {
  listingTitle: string;
  guestName?: string | null;
  reference: string;
  startDate: string;
  endDate: string;
  total: number;
  requestOnly: boolean;
}) {
  const body = `
    <p style="font-size:14px;line-height:1.6;">You have a ${input.requestOnly ? "new booking request" : "new booking"} for <strong>${esc(input.listingTitle)}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;">
      ${detailRow("Guest", input.guestName || "—")}
      ${detailRow("Reference", input.reference)}
      ${detailRow("Dates", `${niceDate(input.startDate)} → ${niceDate(input.endDate)}`)}
      ${detailRow("Total", ghs(input.total))}
    </table>
    ${button(`${SITE}/dashboard/host/bookings`, "Manage bookings")}
  `;
  return {
    subject: `${input.requestOnly ? "New request" : "New booking"} — ${input.listingTitle}`,
    html: layout(input.requestOnly ? "New booking request" : "New booking", body),
  };
}

export function hostApplicationDecision(input: { name?: string | null; approved: boolean }) {
  const greeting = input.name ? `Hi ${input.name},` : "Hi there,";
  const body = input.approved
    ? `<p style="font-size:14px;line-height:1.6;">${esc(greeting)}</p>
       <p style="font-size:14px;line-height:1.6;">Great news — your application to host on GH Bucketlist has been <strong>approved</strong>. You can now publish listings from your host dashboard.</p>
       ${button(`${SITE}/dashboard/host`, "Go to host dashboard")}`
    : `<p style="font-size:14px;line-height:1.6;">${esc(greeting)}</p>
       <p style="font-size:14px;line-height:1.6;">Thank you for your interest in hosting on GH Bucketlist. After review, we're not moving forward with your application at this time. You're welcome to apply again in the future.</p>`;
  return {
    subject: input.approved ? "You're approved to host on GH Bucketlist" : "Update on your host application",
    html: layout(input.approved ? "You're approved to host 🎉" : "Host application update", body),
  };
}

export function payoutDecision(input: { amount: number; method?: string | null; approved: boolean }) {
  const methodLabel = input.method === "mobile-money" ? "Mobile Money" : input.method === "bank" ? "Bank Transfer" : input.method || "—";
  const body = input.approved
    ? `<p style="font-size:14px;line-height:1.6;">Your payout request has been <strong>approved</strong> and is being processed.</p>
       <table style="width:100%;border-collapse:collapse;margin-top:12px;">
         ${detailRow("Amount", ghs(input.amount))}
         ${detailRow("Method", methodLabel)}
       </table>
       ${button(`${SITE}/dashboard/host/earnings`, "View earnings")}`
    : `<p style="font-size:14px;line-height:1.6;">Your payout request of <strong>${ghs(input.amount)}</strong> was not approved. Please check your earnings dashboard or contact support for details.</p>
       ${button(`${SITE}/dashboard/host/earnings`, "View earnings")}`;
  return {
    subject: input.approved ? "Your payout has been approved" : "Update on your payout request",
    html: layout(input.approved ? "Payout approved" : "Payout update", body),
  };
}
