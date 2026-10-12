import { Router } from "express";
import { validate, validateQuery } from "../middleware/validate.js";
import { adminTurfsQuerySchema, reasonSchema } from "../schemas/index.js";
import * as admin from "../services/admin.js";

const router = Router();

router.get("/stats", async (req, res) => {
  res.json(await admin.getStats(req.user));
});

router.get("/turfs", validateQuery(adminTurfsQuerySchema), async (req, res) => {
  const turfs = await admin.listTurfsByStatus(req.user, req.filters.status);
  res.json({ turfs });
});

router.post("/turfs/:id/approve", async (req, res) => {
  const turf = await admin.approveTurf(req.user, Number(req.params.id) || 0);
  res.json({ turf });
});

router.post("/turfs/:id/reject", validate(reasonSchema), async (req, res) => {
  const turf = await admin.rejectTurf(
    req.user,
    Number(req.params.id) || 0,
    req.body.reason,
  );
  res.json({ turf });
});

export default router;
