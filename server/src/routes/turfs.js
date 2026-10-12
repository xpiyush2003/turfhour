import { Router } from "express";
import { validateQuery } from "../middleware/validate.js";
import { dateQuerySchema, turfFiltersSchema } from "../schemas/index.js";
import * as turfs from "../services/turfs.js";

const router = Router();

router.get("/", validateQuery(turfFiltersSchema), async (req, res) => {
  const [list, cities] = await Promise.all([
    turfs.listTurfs(req.user, req.filters),
    turfs.listCities(req.user),
  ]);
  res.json({ turfs: list, cities });
});

router.get("/:id", async (req, res) => {
  const turf = await turfs.getVisibleTurf(req.user, Number(req.params.id) || 0);
  res.json({ turf });
});

router.get(
  "/:id/availability",
  validateQuery(dateQuerySchema),
  async (req, res) => {
    const turfId = Number(req.params.id) || 0;
    res.json(await turfs.getAvailability(req.user, turfId, req.filters.date));
  },
);

export default router;
