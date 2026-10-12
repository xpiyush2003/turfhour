import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../src/db.js";
import { DEMO_DOMAIN } from "../src/schemas/index.js";
import { DEMO_EMAILS } from "../src/services/auth.js";
import { hoursOf } from "../src/services/slots.js";
import { addDays, todayInIndia } from "../src/utils/dates.js";

const today = todayInIndia();

const people = [
  {
    key: "arjun",
    name: "Arjun Verma",
    role: "customer",
    email: DEMO_EMAILS.customer,
  },
  { key: "priya", name: "Priya Nair", role: "owner", email: DEMO_EMAILS.owner },
  {
    key: "sanjay",
    name: "Sanjay Rao",
    role: "admin",
    email: DEMO_EMAILS.admin,
  },
  {
    key: "vikram",
    name: "Vikram Shetty",
    role: "owner",
    email: `vikram${DEMO_DOMAIN}`,
  },
  {
    key: "neha",
    name: "Neha Joshi",
    role: "customer",
    email: `neha${DEMO_DOMAIN}`,
  },
  {
    key: "rahul",
    name: "Rahul Desai",
    role: "customer",
    email: `rahul${DEMO_DOMAIN}`,
  },
  {
    key: "ananya",
    name: "Ananya Iyer",
    role: "customer",
    email: `ananya${DEMO_DOMAIN}`,
  },
  {
    key: "imran",
    name: "Imran Khan",
    role: "customer",
    email: `imran${DEMO_DOMAIN}`,
  },
  {
    key: "kavya",
    name: "Kavya Reddy",
    role: "customer",
    email: `kavya${DEMO_DOMAIN}`,
  },
  {
    key: "dev",
    name: "Dev Malhotra",
    role: "customer",
    email: `dev${DEMO_DOMAIN}`,
  },
  {
    key: "sara",
    name: "Sara Thomas",
    role: "customer",
    email: `sara${DEMO_DOMAIN}`,
  },
];

const customers = people
  .filter((person) => person.role === "customer")
  .map((person) => person.key);

// prices here are in rupees, they are turned into paise when inserted
const turfs = [
  {
    owner: "priya",
    name: "Greenfield Arena",
    sport: "football",
    city: "Bengaluru",
    address: "14, 5th Cross, Koramangala 4th Block, near Sony Signal",
    description:
      "Five-a-side artificial grass pitch with floodlights, changing rooms and parking for 20 cars.",
    open: 6,
    close: 23,
    price: 1200,
    status: "approved",
  },
  {
    owner: "priya",
    name: "Smash Point Badminton",
    sport: "badminton",
    city: "Bengaluru",
    address: "2nd Floor, Lakshmi Complex, 100 Feet Road, Indiranagar",
    description:
      "Indoor wooden court with good lighting. Rackets and shuttles can be hired at the desk.",
    open: 6,
    close: 22,
    price: 400,
    status: "approved",
  },
  {
    owner: "priya",
    name: "Baseline Tennis Court",
    sport: "tennis",
    city: "Bengaluru",
    address: "27, Outer Ring Road, HSR Layout Sector 2",
    description: "Synthetic hard court. Coaching is available on request.",
    open: 6,
    close: 21,
    price: 600,
    status: "approved",
  },
  {
    owner: "priya",
    name: "Rooftop Hoops",
    sport: "basketball",
    city: "Bengaluru",
    address: "Whitefield",
    description: "Half court on the terrace, open in the evenings.",
    open: 16,
    close: 22,
    price: 500,
    status: "rejected",
    rejectReason:
      "The address is incomplete. Please add the building name and a landmark.",
  },
  {
    owner: "vikram",
    name: "Powerplay Box Cricket",
    sport: "cricket",
    city: "Mumbai",
    address: "Plot 8, Veera Desai Road, Andheri West",
    description:
      "Netted box cricket ground for six-a-side games. Bats, balls and stumps are provided.",
    open: 7,
    close: 24,
    price: 1500,
    status: "approved",
  },
  {
    owner: "vikram",
    name: "Kick Off Turf",
    sport: "football",
    city: "Pune",
    address: "Survey No. 41, Baner Road, opposite Balewadi Stadium",
    description: "Seven-a-side turf with floodlights and a small cafe.",
    open: 6,
    close: 23,
    price: 1000,
    status: "approved",
  },
  {
    owner: "vikram",
    name: "Net Practice Cricket Lanes",
    sport: "cricket",
    city: "Pune",
    address: "Lane 6, Koregaon Park, behind the German Bakery",
    description: "Three practice lanes with a bowling machine.",
    open: 6,
    close: 21,
    price: 700,
    status: "pending",
  },
];

// what a day of bookings looks like, as [start hour, hours]
const dayPatterns = [
  [[19, 1]],
  [
    [18, 2],
    [7, 1],
  ],
  [
    [19, 2],
    [17, 1],
    [7, 1],
  ],
  [
    [18, 1],
    [19, 2],
    [21, 1],
    [8, 1],
  ],
  [
    [6, 1],
    [16, 2],
    [20, 1],
  ],
  [
    [9, 1],
    [15, 1],
    [18, 2],
    [20, 2],
  ],
];

await withTransaction(async (db) => {
  // clear the old demo data first, real accounts are not touched
  await db.query(
    `DELETE FROM bookings
     WHERE turf_id IN (
       SELECT t.id FROM turfs t JOIN users o ON o.id = t.owner_id
       WHERE o.is_demo
     )`,
  );
  await db.query(
    "DELETE FROM turfs WHERE owner_id IN (SELECT id FROM users WHERE is_demo)",
  );
  await db.query("DELETE FROM users WHERE is_demo");

  // nobody logs in to these accounts with a password
  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  const users = {};
  for (const person of people) {
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, is_demo)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id`,
      [person.name, person.email, passwordHash, person.role],
    );
    users[person.key] = result.rows[0].id;
  }

  let count = 0;
  for (const [turfIndex, turf] of turfs.entries()) {
    const price = turf.price * 100;
    const result = await db.query(
      `INSERT INTO turfs
         (owner_id, name, sport, city, address, description, open_hour,
          close_hour, price_per_hour, status, reject_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        users[turf.owner],
        turf.name,
        turf.sport,
        turf.city,
        turf.address,
        turf.description,
        turf.open,
        turf.close,
        price,
        turf.status,
        turf.rejectReason || "",
      ],
    );
    const turfId = result.rows[0].id;
    if (turf.status !== "approved") continue;

    // bookings from 30 days ago to 7 days ahead
    for (let day = -30; day <= 7; day++) {
      const date = addDays(today, day);
      const pattern =
        dayPatterns[((day + 30) * (turfIndex + 2)) % dayPatterns.length];

      for (const [startHour, hours] of pattern) {
        if (startHour < turf.open || startHour + hours > turf.close) continue;
        count++;

        const customer = customers[count % customers.length];
        const cancelled = count % 7 === 0;
        const byOwner = count % 14 === 0;
        // booked two days before the game, or today for the coming week
        const createdAt = new Date(`${addDays(date, -2)}T12:00:00+05:30`);
        const madeAt = createdAt < new Date() ? createdAt : new Date();

        const inserted = await db.query(
          `INSERT INTO bookings
             (turf_id, customer_id, booking_date, start_hour, hours,
              total_price, status, cancelled_by, cancel_reason, cancelled_at,
              created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id`,
          [
            turfId,
            users[customer],
            date,
            startHour,
            hours,
            hours * price,
            cancelled ? "cancelled" : "confirmed",
            cancelled ? users[byOwner ? turf.owner : customer] : null,
            cancelled && byOwner ? "Pitch closed for maintenance" : "",
            cancelled ? madeAt : null,
            madeAt,
          ],
        );
        if (cancelled) continue;

        await db.query(
          `INSERT INTO booking_slots (turf_id, slot_date, start_hour, booking_id)
           SELECT $1, $2, hour, $4 FROM unnest($3::int[]) AS hour`,
          [turfId, date, hoursOf(startHour, hours), inserted.rows[0].id],
        );
      }
    }
  }
});

console.log("Demo data is ready");
await pool.end();
