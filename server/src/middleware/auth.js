import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { HttpError } from "../utils/errors.js";

export function createToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// reads the token from the header and loads the user onto req.user
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    throw new HttpError(401, "Please log in");
  }

  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Your session has expired, please log in again");
  }

  const result = await pool.query(
    "SELECT id, name, email, role, is_demo FROM users WHERE id = $1",
    [payload.userId],
  );
  if (result.rows.length === 0) {
    throw new HttpError(401, "Please log in");
  }

  req.user = result.rows[0];
  next();
}

// only lets the given roles through, used after requireAuth
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, "Your account is not allowed to do this");
    }
    next();
  };
}
