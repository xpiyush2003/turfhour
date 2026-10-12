import { pool } from "../db.js";
import { HttpError } from "../utils/errors.js";

// the admin only works with turfs from their own side (demo or real)
export async function getStats(admin) {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM turfs t JOIN users o ON o.id = t.owner_id
        WHERE o.is_demo = $1 AND t.status = 'pending') AS pending_turfs,
       (SELECT COUNT(*) FROM turfs t JOIN users o ON o.id = t.owner_id
        WHERE o.is_demo = $1 AND t.status = 'approved') AS approved_turfs,
       (SELECT COUNT(*) FROM users
        WHERE is_demo = $1 AND role = 'customer') AS customers,
       (SELECT COUNT(*) FROM users
        WHERE is_demo = $1 AND role = 'owner') AS owners,
       (SELECT COUNT(*) FROM bookings b JOIN users c ON c.id = b.customer_id
        WHERE c.is_demo = $1) AS bookings`,
    [admin.is_demo],
  );
  return result.rows[0];
}

export async function listTurfsByStatus(admin, status) {
  const result = await pool.query(
    `SELECT t.*, o.name AS owner_name, o.email AS owner_email
     FROM turfs t
     JOIN users o ON o.id = t.owner_id
     WHERE o.is_demo = $1 AND t.status = $2
     ORDER BY t.created_at DESC, t.id DESC`,
    [admin.is_demo, status],
  );
  return result.rows;
}

// moves a turf to a new status, only from the statuses that allow it
async function setStatus(admin, turfId, status, reason, allowedFrom) {
  const result = await pool.query(
    `UPDATE turfs t
     SET status = $3, reject_reason = $4
     FROM users o
     WHERE o.id = t.owner_id AND t.id = $1 AND o.is_demo = $2
       AND t.status = ANY($5::text[])
     RETURNING t.*`,
    [turfId, admin.is_demo, status, reason, allowedFrom],
  );
  if (result.rows.length > 0) {
    return result.rows[0];
  }

  const existing = await pool.query(
    `SELECT 1 FROM turfs t JOIN users o ON o.id = t.owner_id
     WHERE t.id = $1 AND o.is_demo = $2`,
    [turfId, admin.is_demo],
  );
  if (existing.rows.length === 0) {
    throw new HttpError(404, "Turf not found");
  }
  throw new HttpError(409, `This turf is already ${status}`);
}

export function approveTurf(admin, turfId) {
  return setStatus(admin, turfId, "approved", "", ["pending", "rejected"]);
}

export function rejectTurf(admin, turfId, reason) {
  return setStatus(admin, turfId, "rejected", reason, ["pending", "approved"]);
}
