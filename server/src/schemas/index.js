import { z } from "zod";

export const SPORTS = [
  "football",
  "cricket",
  "badminton",
  "tennis",
  "basketball",
];

export const DEMO_DOMAIN = "@turfhour.example";

// 1 lakh rupees in paise
const MAX_PRICE = 1_00_000 * 100;

const id = z.int("Pick a turf").positive();
const date = z.iso.date("Enter a valid date");
const startHour = z
  .int("Pick a start time")
  .min(0, "Pick a start time")
  .max(23, "Pick a start time");
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name is too long"),
  email: email.refine((value) => !value.endsWith(DEMO_DOMAIN), {
    message: "This email address cannot be used",
  }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  role: z.enum(["customer", "owner"], "Pick what you want to do"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const demoSchema = z.object({
  role: z.enum(["customer", "owner", "admin"], "Pick a demo account"),
});

const turfFields = {
  name: z
    .string()
    .trim()
    .min(1, "Turf name is required")
    .max(60, "Turf name is too long"),
  sport: z.enum(SPORTS, "Pick a sport"),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(40, "City is too long"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(150, "Address is too long"),
  description: z.string().trim().max(500, "Description is too long"),
  open_hour: z
    .int("Pick an opening time")
    .min(0, "Pick an opening time")
    .max(23, "Pick an opening time"),
  close_hour: z
    .int("Pick a closing time")
    .min(1, "Pick a closing time")
    .max(24, "Pick a closing time"),
  price_per_hour: z
    .int("Price must be a whole number of paise")
    .min(100, "Price must be at least ₹1")
    .max(MAX_PRICE, "Price is too high"),
};

export const createTurfSchema = z.object({
  ...turfFields,
  description: turfFields.description.default(""),
});

// every field is optional here, the turf keeps what is not sent
export const updateTurfSchema = z
  .object({ ...turfFields, is_listed: z.boolean() })
  .partial();

export const bookingSchema = z.object({
  turf_id: id,
  booking_date: date,
  start_hour: startHour,
  hours: z
    .int("Pick how many hours")
    .min(1, "Pick how many hours")
    .max(3, "You can book up to 3 hours at a time"),
});

export const rescheduleSchema = z.object({
  booking_date: date,
  start_hour: startHour,
});

export const reasonSchema = z.object({
  reason: z
    .string("Please give a reason")
    .trim()
    .min(1, "Please give a reason")
    .max(200, "The reason is too long"),
});

export const dateQuerySchema = z.object({ date });

export const turfFiltersSchema = z.object({
  city: z.string().trim().optional(),
  sport: z.enum(SPORTS, "Pick a sport").optional(),
  q: z.string().trim().max(60).optional(),
});

export const ownerBookingFiltersSchema = z.object({
  turf_id: z.coerce.number().int().positive().optional(),
  date: date.optional(),
  status: z.enum(["confirmed", "cancelled"]).optional(),
});

export const adminTurfsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});
