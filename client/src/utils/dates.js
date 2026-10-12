const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
});

// today's date in India as "YYYY-MM-DD"
export function todayInIndia() {
  return indiaDate.format(new Date());
}

export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// a calendar date has no timezone, so it is always formatted as UTC
function format(date, options) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    ...options,
    timeZone: "UTC",
  });
}

// "2026-10-12" -> "Mon, 12 Oct 2026"
export function formatDate(date) {
  return format(date, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "2026-10-12" -> "12 Oct"
export function formatShortDate(date) {
  return format(date, { day: "numeric", month: "short" });
}

// "2026-10-12" -> "Mon"
export function weekday(date) {
  return format(date, { weekday: "short" });
}

// 18 -> "6 pm", 24 -> "12 am"
export function formatHour(hour) {
  const h = hour % 24;
  return `${h % 12 || 12} ${h < 12 ? "am" : "pm"}`;
}

// 18, 2 -> "6 pm - 8 pm"
export function formatRange(startHour, hours) {
  return `${formatHour(startHour)} - ${formatHour(startHour + hours)}`;
}
