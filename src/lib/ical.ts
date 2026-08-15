// Minimal, dependency-free iCal (RFC 5545) helpers for calendar sync.
// We only need what OTAs (Booking.com / Airbnb / VRBO) actually emit for availability: VEVENTs with
// all-day DTSTART/DTEND (VALUE=DATE), plus UID. Dates are returned as YYYY-MM-DD with an EXCLUSIVE
// end, matching our blocked_dates [start, end) convention (iCal all-day DTEND is already exclusive).

export type IcsEvent = { uid: string | null; start: string; end: string };

/** Parse the VEVENTs out of an .ics document into date ranges. */
export function parseIcsEvents(ics: string): IcsEvent[] {
  // Unfold RFC 5545 line continuations (a CRLF/LF followed by a space or tab).
  const unfolded = ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\n|\r/);

  const events: IcsEvent[] = [];
  let cur: { uid: string | null; start?: string; end?: string } | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = { uid: null };
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur?.start) {
        let end = cur.end;
        if (!end || end <= cur.start) end = addDay(cur.start); // default/guard: at least one night
        events.push({ uid: cur.uid, start: cur.start, end });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const name = line.slice(0, colon).split(";")[0].toUpperCase(); // "DTSTART;VALUE=DATE" -> "DTSTART"
    const value = line.slice(colon + 1).trim();

    if (name === "UID") cur.uid = value;
    else if (name === "DTSTART") cur.start = toDate(value);
    else if (name === "DTEND") cur.end = toDate(value);
  }
  return events;
}

/** "20260814" or "20260814T130000Z" -> "2026-08-14" (empty string if unparseable). */
function toDate(v: string): string {
  const m = v.match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function addDay(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function icsStamp(d = new Date()): string {
  return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`; // 20260815T123456Z
}

function escapeText(s: string): string {
  return s.replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n");
}

/** Build an .ics feed of "Unavailable" all-day events from date ranges (no PII). */
export function buildIcs(opts: { name: string; events: { uid: string; start: string; end: string }[] }): string {
  const stamp = icsStamp();
  const out = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GHBucketlist//Calendar Sync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.name)}`,
  ];
  for (const e of opts.events) {
    out.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${e.start.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${e.end.replace(/-/g, "")}`,
      "SUMMARY:Unavailable",
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n") + "\r\n";
}
