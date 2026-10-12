# TurfHour

TurfHour is a web app for booking sports turfs by the hour. I built it as my
second full-stack project. My first one (an expense splitter) was about money
logic, so with this one I wanted to learn two different things: how to stop two
people from booking the same slot at the same moment, and how to give
different kinds of users different permissions.

There are three kinds of accounts:

- **Customers** browse turfs, see which hours are free on a date and book them.
- **Owners** list their turfs, set the opening hours and price, and see their
  bookings and earnings.
- **Admins** approve new turfs before customers can see them.

There are no online payments. The app shows the price and the customer pays at
the venue.

## Features

- Sign up as a customer or an owner, plus one-click demo logins for all three
  roles
- Browse turfs by city, sport and name
- A slot grid for every turf and date showing free, booked and past hours
- Book 1 to 3 hours in a row, up to 14 days ahead
- Cancel or reschedule a booking up to 2 hours before it starts
- Booking history with upcoming, past and cancelled bookings
- Owners can add and edit turfs, unlist them, see bookings as a list or a day
  view, and cancel a booking with a reason
- An owner dashboard with revenue per day, busiest hours and revenue per turf
- Admins can approve or reject turfs with a reason

## Tech stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Recharts

**Backend:** Node.js, Express, PostgreSQL (hosted on Neon), JWT login, Zod for
validation

I did not use an ORM. All the database queries are plain SQL using the `pg`
library.

## A few things I learned building it

**Checking in code is not enough to stop double bookings.** My first idea was
"look if the slot is free, then save the booking". The problem is that two
requests can both look at the same moment, both see a free slot and both save.
So the real protection is in the database. Every booked hour is one row in a
`booking_slots` table, and the primary key of that table is the turf, the date
and the hour. PostgreSQL will not allow two rows with the same key, so the
second booking fails and the customer sees "Someone just booked that slot".

**A transaction keeps a booking all-or-nothing.** A 2-hour booking is one row
in `bookings` and two rows in `booking_slots`. They are saved in one
transaction, so if the second hour is taken, the first hour is undone as well.
Nobody ends up holding half a booking.

**Some checks have to happen while holding a lock.** If an owner cancels a
booking at the same moment the customer reschedules it, both requests could
read "this booking is confirmed" and carry on. I lock the booking row with
`SELECT ... FOR UPDATE` at the start of the transaction, so the second request
waits and then sees what the first one did.

**Times are simpler without timestamps.** A slot is stored as a date
(`2026-10-20`) and an hour (`18`), not as a timestamp. That way nothing shifts
when the server and the browser are in different timezones. "Today" and "now"
are always worked out in Indian time.

**Permissions are checked on the server.** Every route says which role may use
it, and after that the code checks that the turf or booking really belongs to
the person asking. Hiding a button in React is not enough.

**The price is saved on the booking.** If an owner changes the hourly price,
old bookings and the revenue chart keep the price that was agreed.

## Running it on your computer

You need Node.js 22 or newer and a PostgreSQL database. I use a free
[Neon](https://neon.tech) database.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and fill in:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | The pooled connection string from Neon, ending in `sslmode=verify-full` |
| `JWT_SECRET` | Any long random string |
| `CLIENT_URL` | Where the frontend runs, `http://localhost:5173` locally |
| `PORT` | The port for the API, `4000` locally |

Then create the tables, load the demo data and start the API:

```bash
npm run migrate
npm run seed
npm run dev
```

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 and click one of the **Try as** buttons.

### Making an admin

Nobody can sign up as an admin. Sign up as a customer first, then run this in
the `server` folder:

```bash
npm run make-admin -- you@example.com
```

## Demo accounts

The seed script creates demo customers, owners, an admin, a few turfs and
about a month of bookings. Demo accounts only ever see demo turfs, and real
accounts only see real turfs, so visitors trying the demo cannot touch real
data. Running `npm run seed` again resets the demo data and leaves real
accounts alone.

## Folder structure

```
client/   React app
  src/api          functions that call the API
  src/components   layout, forms, the slot grid, charts and other shared pieces
  src/context      keeps track of the logged-in user
  src/pages        one file per page
  src/utils        date, time and money helpers

server/   Express API
  src/routes       one file per group of endpoints
  src/services     the booking, turf, admin and dashboard logic
  src/middleware   login check, role check, validation, errors
  src/schemas      validation rules
  db/              the tables, the migration script and the demo data
```

## Deploying

I deploy the database on Neon, the API on Render and the frontend on Vercel.

**Render (API)**

- New Web Service from this repository
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`
- Environment variables: `DATABASE_URL`, `JWT_SECRET` and `CLIENT_URL` (the
  Vercel address, with no slash at the end)

**Vercel (frontend)**

- New project from this repository
- Root directory: `client`
- Framework preset: Vite
- Environment variable: `VITE_API_URL`, the Render address followed by `/api`

To set up the live database, run `npm run migrate` and `npm run seed` from the
`server` folder with `DATABASE_URL` pointing at it.

Render's free plan puts the API to sleep when nobody is using it, so the first
request after a break can take up to a minute.


