import express from "express";
import cors from "cors";
import helmet from "helmet";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import bookingsRouter from "./routes/bookings.js";
import ownerRouter from "./routes/owner.js";
import turfsRouter from "./routes/turfs.js";

const app = express();

// Render sits behind a proxy, this lets the rate limiter see the real IP
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

// everything below needs a logged-in user with the right role
app.use("/api", requireAuth);
app.use("/api/turfs", requireRole("customer"), turfsRouter);
app.use("/api/bookings", requireRole("customer"), bookingsRouter);
app.use("/api/owner", requireRole("owner"), ownerRouter);
app.use("/api/admin", requireRole("admin"), adminRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
