export function formatGHS(amount: number) {
  if (amount === 0) return "Free";
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${hours}.${Math.round((mins / 60) * 10)} hrs`;
}

export function formatScheduleDays(days: string[]) {
  if (days.length >= 6) return "Every day";
  return `Every ${days.join(", ")}`;
}
