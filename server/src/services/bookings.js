import { pool, withTransaction } from "../db.js";
import { minutesUntil } from "../utils/dates.js";
import { HttpError, SLOT_TAKEN } from "../utils/errors.js";
import {
  CANCEL_CUTOFF_MINUTES,
  checkSlotRules,
  insertSlots,
  isAnyHourTaken,
  lockTurf,
} from "./slots.js";
import { getVisibleTurf } from "./turfs.js";

const BOOKING_COLUMNS = `
  b.*, t.name AS turf_name, t.sport AS turf_sport, t.city AS turf_city,
  t.address AS turf_address, c.name AS customer_name, c.email AS customer_email,
  x.role AS cancelled_by_role`;

const BOOKING_JOINS = `
  FROM bookings b
  JOIN turfs t ON t.id = b.turf_id
  JOIN users c ON c.id = b.customer_id
  LEFT JOIN users x ON x.id = b.cancelled_by`;

// adds where the booking stands right now, nothing here is stored
function withState(booking) {
  const minutes = minutesUntil(booking.booking_date, booking.start_hour);
  let state = "completed";
  if (booking.status === "cancelled") state = "cancelled";
  else if (minutes > 0) state = "upcoming";
  else if (minutes > -booking.hours * 60) state = "ongoing";

  const canChange = state === "upcoming" && minutes >= CANCEL_CUTOFF_MINUTES;
  return {
    ...booking,
    state,
    can_cancel: canChange,
    can_reschedule: canChange && !booking.rescheduled,
  };
}

async function getBooking(bookingId) {
  const result = await pool.query(
    `SELECT ${BOOKING_COLUMNS} ${BOOKING_JOINS} WHERE b.id = $1`,
    [bookingId],
  );
  return withState(result.rows[0]);
}

// locks the booking row so two changes to it cannot run at the same time
async function lockBooking(db, bookingId) {
  const result = await db.query(
    `SELECT b.*, t.owner_id
     FROM bookings b
     JOIN turfs t ON t.id = b.turf_id
     WHERE b.id = $1
     FOR UPDATE OF b`,
    [bookingId],
  );
  return result.rows[0];
}

function checkStillUpcoming(booking) {
  if (booking.status !== "confirmed") {
    throw new HttpError(409, "This booking has already been cancelled");
  }
  if (minutesUntil(booking.booking_date, booking.start_hour) <= 0) {
    throw new HttpError(409, "This booking has already started");
  }
}

function checkBeforeCutoff(booking) {
  const minutes = minutesUntil(booking.booking_date, booking.start_hour);
  if (minutes < CANCEL_CUTOFF_MINUTES) {
    throw new HttpError(
      400,
      "Bookings can only be changed up to 2 hours before they start",
    );
  }
}

export async function createBooking(user, body) {
  const { turf_id, booking_date, start_hour, hours } = body;

  // quick checks first so most mistakes get a clear message
  const turf = await getVisibleTurf(user, turf_id);
  checkSlotRules(turf, booking_date, start_hour, hours);
  if (await isAnyHourTaken(pool, turf.id, booking_date, start_hour, hours)) {
    throw new HttpError(409, SLOT_TAKEN);
  }

  const bookingId = await withTransaction(async (db) => {
    const lockedTurf = await lockTurf(db, turf.id);
    checkSlotRules(lockedTurf, booking_date, start_hour, hours);

    const result = await db.query(
      `INSERT INTO bookings
         (turf_id, customer_id, booking_date, start_hour, hours, total_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        turf.id,
        user.id,
        booking_date,
        start_hour,
        hours,
        hours * lockedTurf.price_per_hour,
      ],
    );
    await insertSlots(db, result.rows[0]);
    return result.rows[0].id;
  });

  return getBooking(bookingId);
}

export async function listCustomerBookings(user) {
  const result = await pool.query(
    `SELECT ${BOOKING_COLUMNS} ${BOOKING_JOINS}
     WHERE b.customer_id = $1
     ORDER BY b.booking_date, b.start_hour, b.id`,
    [user.id],
  );
  return result.rows.map(withState);
}

export async function listOwnerBookings(owner, filters) {
  const result = await pool.query(
    `SELECT ${BOOKING_COLUMNS} ${BOOKING_JOINS}
     WHERE t.owner_id = $1
       AND ($2::int IS NULL OR b.turf_id = $2)
       AND ($3::date IS NULL OR b.booking_date = $3)
       AND ($4::text IS NULL OR b.status = $4)
     ORDER BY b.booking_date DESC, b.start_hour DESC, b.id DESC
     LIMIT 200`,
    [
      owner.id,
      filters.turf_id ?? null,
      filters.date ?? null,
      filters.status ?? null,
    ],
  );
  return result.rows.map(withState);
}

// frees the hours and marks the booking, called inside a transaction
async function cancel(db, booking, userId, reason) {
  await db.query("DELETE FROM booking_slots WHERE booking_id = $1", [
    booking.id,
  ]);
  await db.query(
    `UPDATE bookings
     SET status = 'cancelled', cancelled_by = $2, cancel_reason = $3,
         cancelled_at = NOW()
     WHERE id = $1`,
    [booking.id, userId, reason],
  );
}

export async function cancelAsCustomer(user, bookingId) {
  await withTransaction(async (db) => {
    const booking = await lockBooking(db, bookingId);
    if (!booking || booking.customer_id !== user.id) {
      throw new HttpError(404, "Booking not found");
    }
    checkStillUpcoming(booking);
    checkBeforeCutoff(booking);
    await cancel(db, booking, user.id, "");
  });
  return getBooking(bookingId);
}

export async function cancelAsOwner(owner, bookingId, reason) {
  await withTransaction(async (db) => {
    const booking = await lockBooking(db, bookingId);
    if (!booking || booking.owner_id !== owner.id) {
      throw new HttpError(404, "Booking not found");
    }
    checkStillUpcoming(booking);
    await cancel(db, booking, owner.id, reason);
  });
  return getBooking(bookingId);
}

export async function rescheduleBooking(user, bookingId, body) {
  const { booking_date, start_hour } = body;

  await withTransaction(async (db) => {
    const booking = await lockBooking(db, bookingId);
    if (!booking || booking.customer_id !== user.id) {
      throw new HttpError(404, "Booking not found");
    }
    checkStillUpcoming(booking);
    if (booking.rescheduled) {
      throw new HttpError(409, "A booking can only be rescheduled once");
    }
    checkBeforeCutoff(booking);
    if (
      booking.booking_date === booking_date &&
      booking.start_hour === start_hour
    ) {
      throw new HttpError(400, "Pick a different time from the current one");
    }

    const turf = await lockTurf(db, booking.turf_id);
    checkSlotRules(turf, booking_date, start_hour, booking.hours);

    // give up the old hours first, so the new time may overlap the old one
    await db.query("DELETE FROM booking_slots WHERE booking_id = $1", [
      booking.id,
    ]);
    if (
      await isAnyHourTaken(db, turf.id, booking_date, start_hour, booking.hours)
    ) {
      throw new HttpError(409, SLOT_TAKEN);
    }

    const result = await db.query(
      `UPDATE bookings
       SET booking_date = $2, start_hour = $3, total_price = $4,
           rescheduled = TRUE
       WHERE id = $1
       RETURNING *`,
      [
        booking.id,
        booking_date,
        start_hour,
        booking.hours * turf.price_per_hour,
      ],
    );
    await insertSlots(db, result.rows[0]);
  });

  return getBooking(bookingId);
}
