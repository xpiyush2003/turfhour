CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'owner', 'admin')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- hours are whole clock hours, close_hour 24 means midnight
-- price_per_hour is in paise
CREATE TABLE IF NOT EXISTS turfs (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users (id),
  name TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (
    sport IN ('football', 'cricket', 'badminton', 'tennis', 'basketball')
  ),
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  open_hour INTEGER NOT NULL CHECK (open_hour BETWEEN 0 AND 23),
  close_hour INTEGER NOT NULL CHECK (close_hour BETWEEN 1 AND 24),
  price_per_hour INTEGER NOT NULL CHECK (price_per_hour > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  reject_reason TEXT NOT NULL DEFAULT '',
  is_listed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (open_hour < close_hour)
);

-- kept forever, even after cancelling
-- total_price is in paise, saved when the booking is made
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  turf_id INTEGER NOT NULL REFERENCES turfs (id),
  customer_id INTEGER NOT NULL REFERENCES users (id),
  booking_date DATE NOT NULL,
  start_hour INTEGER NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  hours INTEGER NOT NULL CHECK (hours BETWEEN 1 AND 3),
  total_price INTEGER NOT NULL CHECK (total_price > 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (
    status IN ('confirmed', 'cancelled')
  ),
  rescheduled BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_by INTEGER REFERENCES users (id),
  cancel_reason TEXT NOT NULL DEFAULT '',
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_hour + hours <= 24)
);

-- one row per hour that is taken right now
-- the primary key is what stops two bookings for the same hour
CREATE TABLE IF NOT EXISTS booking_slots (
  turf_id INTEGER NOT NULL REFERENCES turfs (id),
  slot_date DATE NOT NULL,
  start_hour INTEGER NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  booking_id INTEGER NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  PRIMARY KEY (turf_id, slot_date, start_hour)
);

CREATE INDEX IF NOT EXISTS turfs_owner_idx ON turfs (owner_id);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS bookings_turf_date_idx ON bookings (turf_id, booking_date);
CREATE INDEX IF NOT EXISTS booking_slots_booking_idx ON booking_slots (booking_id);
