import { HttpError, SLOT_TAKEN } from "../utils/errors.js";

const UNIQUE_VIOLATION = "23505";
const DEADLOCK = "40P01";

export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

// every error thrown in a route ends up here
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: "The request body is not valid JSON" });
  }

  // the database refused the row because the hour is already taken
  if (
    err.code === UNIQUE_VIOLATION &&
    err.constraint === "booking_slots_pkey"
  ) {
    return res.status(409).json({ error: SLOT_TAKEN });
  }
  if (err.code === UNIQUE_VIOLATION && err.constraint === "users_email_key") {
    return res
      .status(409)
      .json({ error: "An account with this email already exists" });
  }
  // two bookings were waiting on each other and the database stopped one
  if (err.code === DEADLOCK) {
    return res.status(409).json({ error: SLOT_TAKEN });
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong, please try again" });
}
