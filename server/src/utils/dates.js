const indiaClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// the date and time in India right now, e.g. { date: "2026-10-12", hour: 18, minute: 5 }
export function nowInIndia() {
  const parts = {};
  for (const part of indiaClock.formatToParts(new Date())) {
    parts[part.type] = part.value;
  }
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function todayInIndia() {
  return nowInIndia().date;
}

export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// turns a date and clock time into a count of minutes so two can be compared
function toMinutes(date, hour, minute = 0) {
  return new Date(`${date}T00:00:00Z`).getTime() / 60000 + hour * 60 + minute;
}

// minutes from now until the given hour starts, negative if it has started
export function minutesUntil(date, hour) {
  const now = nowInIndia();
  return toMinutes(date, hour) - toMinutes(now.date, now.hour, now.minute);
}

// the last `count` dates up to today, oldest first
export function lastDays(count) {
  const today = todayInIndia();
  const days = [];
  for (let i = count - 1; i >= 0; i--) {
    days.push(addDays(today, -i));
  }
  return days;
}
