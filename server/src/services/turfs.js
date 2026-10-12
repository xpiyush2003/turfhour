import { pool, withTransaction } from "../db.js";
import { minutesUntil, nowInIndia } from "../utils/dates.js";
import { HttpError } from "../utils/errors.js";
import { checkDateInRange, hoursOf } from "./slots.js";

function checkHours(turf) {
  if (turf.open_hour >= turf.close_hour) {
    throw new HttpError(400, "Closing time must be after opening time");
  }
}

// turfs a customer can book: approved, listed, and from the same side
// (demo customers only see demo turfs, real customers only real ones)
export async function listTurfs(user, filters) {
  const result = await pool.query(
    `SELECT t.id, t.name, t.sport, t.city, t.address, t.description,
            t.open_hour, t.close_hour, t.price_per_hour
     FROM turfs t
     JOIN users o ON o.id = t.owner_id
     WHERE t.status = 'approved' AND t.is_listed AND o.is_demo = $1
       AND ($2::text IS NULL OR t.city = $2)
       AND ($3::text IS NULL OR t.sport = $3)
       AND ($4::text IS NULL OR t.name ILIKE '%' || $4 || '%')
     ORDER BY t.name`,
    [
      user.is_demo,
      filters.city || null,
      filters.sport || null,
      filters.q || null,
    ],
  );
  return result.rows;
}

export async function listCities(user) {
  const result = await pool.query(
    `SELECT DISTINCT t.city
     FROM turfs t
     JOIN users o ON o.id = t.owner_id
     WHERE t.status = 'approved' AND t.is_listed AND o.is_demo = $1
     ORDER BY t.city`,
    [user.is_demo],
  );
  return result.rows.map((row) => row.city);
}

export async function getVisibleTurf(user, turfId) {
  const result = await pool.query(
    `SELECT t.*
     FROM turfs t
     JOIN users o ON o.id = t.owner_id
     WHERE t.id = $1 AND t.status = 'approved' AND t.is_listed
       AND o.is_demo = $2`,
    [turfId, user.is_demo],
  );
  if (result.rows.length === 0) {
    throw new HttpError(404, "Turf not found");
  }
  return result.rows[0];
}

// every hourly slot of the turf for one date, as the customer sees it
export async function getAvailability(user, turfId, date) {
  const turf = await getVisibleTurf(user, turfId);
  checkDateInRange(date);

  const result = await pool.query(
    `SELECT s.start_hour, s.booking_id, b.customer_id
     FROM booking_slots s
     JOIN bookings b ON b.id = s.booking_id
     WHERE s.turf_id = $1 AND s.slot_date = $2`,
    [turf.id, date],
  );
  const taken = new Map(result.rows.map((row) => [row.start_hour, row]));

  const hours = hoursOf(turf.open_hour, turf.close_hour - turf.open_hour);
  const slots = hours.map((hour) => {
    const slot = { start_hour: hour, status: "free" };
    const row = taken.get(hour);
    if (minutesUntil(date, hour) <= 0) {
      slot.status = "past";
    } else if (row && row.customer_id === user.id) {
      slot.status = "yours";
      slot.booking_id = row.booking_id;
    } else if (row) {
      slot.status = "booked";
    }
    return slot;
  });

  return { turf, date, slots };
}

export async function listOwnerTurfs(owner) {
  const result = await pool.query(
    `SELECT t.*,
       (SELECT COUNT(*) FROM bookings b WHERE b.turf_id = t.id) AS booking_count
     FROM turfs t
     WHERE t.owner_id = $1
     ORDER BY t.created_at DESC, t.id DESC`,
    [owner.id],
  );
  return result.rows;
}

export async function createTurf(owner, body) {
  checkHours(body);
  const result = await pool.query(
    `INSERT INTO turfs
       (owner_id, name, sport, city, address, description, open_hour,
        close_hour, price_per_hour)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      owner.id,
      body.name,
      body.sport,
      body.city,
      body.address,
      body.description,
      body.open_hour,
      body.close_hour,
      body.price_per_hour,
    ],
  );
  return result.rows[0];
}

export async function updateTurf(owner, turfId, changes) {
  return withTransaction(async (db) => {
    // lock the turf so no booking can land while the hours are being checked
    const found = await db.query(
      "SELECT * FROM turfs WHERE id = $1 AND owner_id = $2 FOR UPDATE",
      [turfId, owner.id],
    );
    const turf = found.rows[0];
    if (!turf) {
      throw new HttpError(404, "Turf not found");
    }

    const next = { ...turf, ...changes };
    checkHours(next);

    const hoursChanged =
      next.open_hour !== turf.open_hour || next.close_hour !== turf.close_hour;
    if (hoursChanged) {
      const now = nowInIndia();
      const outside = await db.query(
        `SELECT 1 FROM booking_slots
         WHERE turf_id = $1
           AND (slot_date > $2 OR (slot_date = $2 AND start_hour >= $3))
           AND (start_hour < $4 OR start_hour >= $5)
         LIMIT 1`,
        [turf.id, now.date, now.hour, next.open_hour, next.close_hour],
      );
      if (outside.rows.length > 0) {
        throw new HttpError(
          409,
          "You have upcoming bookings outside these hours. Cancel them first.",
        );
      }
    }

    // fixing a rejected turf sends it back to the admin
    const detailsChanged = Object.keys(changes).some(
      (key) => key !== "is_listed",
    );
    if (turf.status === "rejected" && detailsChanged) {
      next.status = "pending";
      next.reject_reason = "";
    }

    const result = await db.query(
      `UPDATE turfs
       SET name = $2, sport = $3, city = $4, address = $5, description = $6,
           open_hour = $7, close_hour = $8, price_per_hour = $9,
           is_listed = $10, status = $11, reject_reason = $12
       WHERE id = $1
       RETURNING *`,
      [
        turf.id,
        next.name,
        next.sport,
        next.city,
        next.address,
        next.description,
        next.open_hour,
        next.close_hour,
        next.price_per_hour,
        next.is_listed,
        next.status,
        next.reject_reason,
      ],
    );
    return result.rows[0];
  });
}

async function getOwnTurf(owner, turfId) {
  const result = await pool.query(
    "SELECT * FROM turfs WHERE id = $1 AND owner_id = $2",
    [turfId, owner.id],
  );
  if (result.rows.length === 0) {
    throw new HttpError(404, "Turf not found");
  }
  return result.rows[0];
}

// a turf that has ever been booked is kept, its bookings are history
export async function deleteTurf(owner, turfId) {
  const turf = await getOwnTurf(owner, turfId);
  const result = await pool.query(
    `DELETE FROM turfs
     WHERE id = $1
       AND NOT EXISTS (SELECT 1 FROM bookings WHERE turf_id = $1)`,
    [turf.id],
  );
  if (result.rowCount === 0) {
    throw new HttpError(
      409,
      "This turf has bookings, so it cannot be deleted. You can unlist it instead.",
    );
  }
}

// the owner's view of one day: every slot and who booked it
export async function getSchedule(owner, turfId, date) {
  const turf = await getOwnTurf(owner, turfId);

  const result = await pool.query(
    `SELECT s.start_hour, b.id AS booking_id, b.start_hour AS booking_start,
            b.hours, c.name AS customer_name, c.email AS customer_email
     FROM booking_slots s
     JOIN bookings b ON b.id = s.booking_id
     JOIN users c ON c.id = b.customer_id
     WHERE s.turf_id = $1 AND s.slot_date = $2`,
    [turf.id, date],
  );
  const bookedHours = new Map(result.rows.map((row) => [row.start_hour, row]));

  const hours = hoursOf(turf.open_hour, turf.close_hour - turf.open_hour);
  const slots = hours.map((hour) => {
    const booked = bookedHours.get(hour);
    return {
      start_hour: hour,
      is_past: minutesUntil(date, hour) <= 0,
      booking: booked
        ? {
            id: booked.booking_id,
            start_hour: booked.booking_start,
            hours: booked.hours,
            customer_name: booked.customer_name,
            customer_email: booked.customer_email,
          }
        : null,
    };
  });

  return { turf, date, slots };
}
