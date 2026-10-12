import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { demoSchema, loginSchema, registerSchema } from "../schemas/index.js";
import * as auth from "../services/auth.js";

const router = Router();

const limitOptions = {
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "Too many tries, please wait a few minutes" },
};
const limiter = rateLimit(limitOptions);
// the demo buttons get their own count so failed logins do not block them
const demoLimiter = rateLimit(limitOptions);

router.post(
  "/register",
  limiter,
  validate(registerSchema),
  async (req, res) => {
    res.status(201).json(await auth.register(req.body));
  },
);

router.post("/login", limiter, validate(loginSchema), async (req, res) => {
  res.json(await auth.login(req.body));
});

router.post("/demo", demoLimiter, validate(demoSchema), async (req, res) => {
  res.json(await auth.demoLogin(req.body.role));
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: auth.publicUser(req.user) });
});

export default router;
