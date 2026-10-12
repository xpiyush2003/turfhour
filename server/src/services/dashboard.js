import { pool } from "../db.js";
import { lastDays, nowInIndia } from "../utils/dates.js";
import { hoursOf } from "./slots.js";

const DAYS = 30;

// totals and chart data for the owner's turfs over the last 30 days
export async function getOwnerDashboard(owner) {
  const days = lastDays(DAYS);
  const startDate = days[0];
  const now = nowInIndia();
  const params = [owner.id, startDate, now.date];

  const [totals, upcoming, byDay, byHour, byTurf] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'confirmed'), 0) AS revenue,
         COALESCE(SUM(b.hours) FILTER (WHERE b.status = 'confirmed'), 0) AS hours_booked,
         COUNT(*) FILTER (WHERE b.status = 'confirmed') AS confirmed,
         COUNT(*) FILTER (WHERE b.status = 'cancelled') AS cancelled
       FROM bookings b
       JOIN turfs t ON t.id = b.turf_id
       WHERE t.owner_id = $1 AND b.booking_date BETWEEN $2 AND $3`,
      params,
    ),
    pool.query(
      `SELECT COUNT(*) AS count
       FROM bookings b
       JOIN turfs t ON t.id = b.turf_id
       WHERE t.owner_id = $1 AND b.status = 'confirmed'
         AND (b.booking_date > $2
              OR (b.booking_date = $2 AND b.start_hour > $3))`,
      [owner.id, now.date, now.hour],
    ),
    pool.query(
      `SELECT b.booking_date AS date, SUM(b.total_price) AS revenue
       FROM bookings b
       JOIN turfs t ON t.id = b.turf_id
       WHERE t.owner_id = $1 AND b.status = 'confirmed'
         AND b.booking_date BETWEEN $2 AND $3
       GROUP BY b.booking_date`,
      params,
    ),
    pool.query(
      `SELECT s.start_hour AS hour, COUNT(*) AS bookings
       FROM booking_slots s
       JOIN turfs t ON t.id = s.turf_id
       WHERE t.owner_id = $1 AND s.slot_date BETWEEN $2 AND $3
       GROUP BY s.start_hour`,
      params,
    ),
    pool.query(
      `SELECT t.id, t.name, t.open_hour, t.close_hour,
         COALESCE(SUM(b.total_price) FILTER (
           WHERE b.status = 'confirmed' AND b.booking_date BETWEEN $2 AND $3
         ), 0) AS revenue
       FROM turfs t
       LEFT JOIN bookings b ON b.turf_id = t.id
       WHERE t.owner_id = $1
       GROUP BY t.id
       ORDER BY t.name`,
      params,
    ),
  ]);

  const { revenue, hours_booked, confirmed, cancelled } = totals.rows[0];
  const all = confirmed + cancelled;

  // fill in zero for days and hours with no bookings
  const dayTotals = new Map(byDay.rows.map((row) => [row.date, row.revenue]));
  const hourTotals = new Map(
    byHour.rows.map((row) => [row.hour, row.bookings]),
  );
  const turfs = byTurf.rows;
  const firstHour = Math.min(...turfs.map((turf) => turf.open_hour));
  const lastHour = Math.max(...turfs.map((turf) => turf.close_hour));
  const hours =
    turfs.length > 0 ? hoursOf(firstHour, lastHour - firstHour) : [];

  return {
    days: DAYS,
    revenue,
    hours_booked,
    upcoming_bookings: upcoming.rows[0].count,
    cancelled_percent: all > 0 ? Math.round((cancelled / all) * 100) : 0,
    by_day: days.map((date) => ({ date, revenue: dayTotals.get(date) || 0 })),
    by_hour: hours.map((hour) => ({
      hour,
      bookings: hourTotals.get(hour) || 0,
    })),
    by_turf: turfs.map((turf) => ({
      id: turf.id,
      name: turf.name,
      revenue: turf.revenue,
    })),
  };
}
