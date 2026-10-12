import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { bookingSchema, rescheduleSchema } from "../schemas/index.js";
import * as bookings from "../services/bookings.js";

const router = Router();

router.get("/", async (req, res) => {
  res.json({ bookings: await bookings.listCustomerBookings(req.user) });
});

router.post("/", validate(bookingSchema), async (req, res) => {
  const booking = await bookings.createBooking(req.user, req.body);
  res.status(201).json({ booking });
});

router.post("/:id/cancel", async (req, res) => {
  const bookingId = Number(req.params.id) || 0;
  res.json({ booking: await bookings.cancelAsCustomer(req.user, bookingId) });
});

router.post("/:id/reschedule", validate(rescheduleSchema), async (req, res) => {
  const bookingId = Number(req.params.id) || 0;
  const booking = await bookings.rescheduleBooking(
    req.user,
    bookingId,
    req.body,
  );
  res.json({ booking });
});

export default router;
