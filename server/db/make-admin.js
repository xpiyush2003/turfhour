import { pool } from "../src/db.js";

// usage: npm run make-admin -- someone@example.com
const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.log("Give the email of an existing account");
  process.exit(1);
}

const result = await pool.query(
  `UPDATE users SET role = 'admin'
   WHERE email = $1 AND NOT is_demo
   RETURNING name`,
  [email],
);

if (result.rows.length === 0) {
  console.log("No account found with that email");
} else {
  console.log(`${result.rows[0].name} is now an admin`);
}
await pool.end();
