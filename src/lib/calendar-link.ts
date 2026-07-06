function parseScheduleTime(scheduleTime: string) {
  const match = scheduleTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return { hours: 9, minutes: 0 };
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

function toGoogleDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildGoogleCalendarLink({
  title,
  dateISO,
  scheduleTime,
  durationMinutes,
  location,
  details,
}: {
  title: string;
  dateISO: string;
  scheduleTime: string;
  durationMinutes: number;
  location: string;
  details: string;
}) {
  const { hours, minutes } = parseScheduleTime(scheduleTime);
  const start = new Date(dateISO);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
