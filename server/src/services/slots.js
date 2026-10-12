import { addDays, minutesUntil, todayInIndia } from "../utils/dates.js";
import { HttpError } from "../utils/errors.js";

export const MAX_DAYS_AHEAD = 14;
export const CANCEL_CUTOFF_MINUTES = 120;

// 18, 2 -> [18, 19]
export function hoursOf(startHour, hours) {
  return Array.from({ length: hours }, (_, index) => startHour + index);
}

// 18 -> "6 pm"
export function formatHour(hour) {
  const h = hour % 24;
  return `${h % 12 || 12} ${h < 12 ? "am" : "pm"}`;
}

export function checkDateInRange(date) {
  const today = todayInIndia();
  if (date < today) {
    throw new HttpError(400, "That date has already passed");
  }
  if (date > addDays(today, MAX_DAYS_AHEAD)) {
    throw new HttpError(
      400,
      `You can only book up to ${MAX_DAYS_AHEAD} days ahead`,
    );
  }
}

// the rules every new or moved booking has to pass
export function checkSlotRules(turf, date, startHour, hours) {
  if (turf.status !== "approved" || !turf.is_listed) {
    throw new HttpError(409, "This turf is not taking bookings right now");
  }
  checkDateInRange(date);
  if (startHour < turf.open_hour || startHour + hours > turf.close_hour) {
    throw new HttpError(
      400,
      `This turf is open from ${formatHour(turf.open_hour)} to ${formatHour(turf.close_hour)}`,
    );
  }
  if (minutesUntil(date, startHour) <= 0) {
    throw new HttpError(400, "That slot has already started");
  }
}

// reads the turf inside a transaction, a change to it waits until we finish
export async function lockTurf(db, turfId) {
  const result = await db.query("SELECT * FROM turfs WHERE id = $1 FOR SHARE", [
    turfId,
  ]);
  return result.rows[0];
}

export async function isAnyHourTaken(db, turfId, date, startHour, hours) {
  const result = await db.query(
    `SELECT 1 FROM booking_slots
     WHERE turf_id = $1 AND slot_date = $2 AND start_hour = ANY($3::int[])`,
    [turfId, date, hoursOf(startHour, hours)],
  );
  return result.rows.length > 0;
}

// one row per hour, the primary key rejects an hour that is already taken
export async function insertSlots(db, booking) {
  await db.query(
    `INSERT INTO booking_slots (turf_id, slot_date, start_hour, booking_id)
     SELECT $1, $2, hour, $4 FROM unnest($3::int[]) AS hour`,
    [
      booking.turf_id,
      booking.booking_date,
      hoursOf(booking.start_hour, booking.hours),
      booking.id,
    ],
  );
}
