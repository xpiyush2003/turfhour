import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { createToken } from "../middleware/auth.js";
import { DEMO_DOMAIN } from "../schemas/index.js";
import { HttpError } from "../utils/errors.js";

// one seeded demo account per role
export const DEMO_EMAILS = {
  customer: `customer${DEMO_DOMAIN}`,
  owner: `owner${DEMO_DOMAIN}`,
  admin: `admin${DEMO_DOMAIN}`,
};

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_demo: user.is_demo,
  };
}

function session(user) {
  return { token: createToken(user), user: publicUser(user) };
}

export async function register({ name, email, password, role }) {
  const existing = await pool.query("SELECT 1 FROM users WHERE email = $1", [
    email,
  ]);
  if (existing.rows.length > 0) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, email, passwordHash, role],
  );
  return session(result.rows[0]);
}

export async function login({ email, password }) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  const user = result.rows[0];
  const matches = user && (await bcrypt.compare(password, user.password_hash));
  if (!matches) {
    throw new HttpError(401, "Wrong email or password");
  }
  return session(user);
}

// one-click login as the seeded demo user for a role
export async function demoLogin(role) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND is_demo",
    [DEMO_EMAILS[role]],
  );
  const user = result.rows[0];
  if (!user) {
    throw new HttpError(503, "The demo account has not been set up yet");
  }
  return session(user);
}
