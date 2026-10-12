import { Router } from "express";
import { validate, validateQuery } from "../middleware/validate.js";
import {
  createTurfSchema,
  dateQuerySchema,
  ownerBookingFiltersSchema,
  reasonSchema,
  updateTurfSchema,
} from "../schemas/index.js";
import * as bookings from "../services/bookings.js";
import { getOwnerDashboard } from "../services/dashboard.js";
import * as turfs from "../services/turfs.js";

const router = Router();

router.get("/dashboard", async (req, res) => {
  res.json(await getOwnerDashboard(req.user));
});

router.get("/turfs", async (req, res) => {
  res.json({ turfs: await turfs.listOwnerTurfs(req.user) });
});

router.post("/turfs", validate(createTurfSchema), async (req, res) => {
  const turf = await turfs.createTurf(req.user, req.body);
  res.status(201).json({ turf });
});

router.patch("/turfs/:id", validate(updateTurfSchema), async (req, res) => {
  const turfId = Number(req.params.id) || 0;
  res.json({ turf: await turfs.updateTurf(req.user, turfId, req.body) });
});

router.delete("/turfs/:id", async (req, res) => {
  await turfs.deleteTurf(req.user, Number(req.params.id) || 0);
  res.json({ ok: true });
});

router.get(
  "/turfs/:id/schedule",
  validateQuery(dateQuerySchema),
  async (req, res) => {
    const turfId = Number(req.params.id) || 0;
    res.json(await turfs.getSchedule(req.user, turfId, req.filters.date));
  },
);

router.get(
  "/bookings",
  validateQuery(ownerBookingFiltersSchema),
  async (req, res) => {
    const list = await bookings.listOwnerBookings(req.user, req.filters);
    res.json({ bookings: list });
  },
);

router.post(
  "/bookings/:id/cancel",
  validate(reasonSchema),
  async (req, res) => {
    const booking = await bookings.cancelAsOwner(
      req.user,
      Number(req.params.id) || 0,
      req.body.reason,
    );
    res.json({ booking });
  },
);

export default router;
