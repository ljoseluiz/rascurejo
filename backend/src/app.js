import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import pino from "pino";
import { v4 as uuidv4 } from "uuid";

import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import statsRouter from "./routes/stats.js";
import reportsRouter from "./routes/reports.js";

import { errorHandler } from "./middlewares/error.js";
import { attachCsrf } from "./middlewares/csrf.js";

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: ["req.headers.authorization", "req.cookies", "password"],
});

const app = express();

// Request correlation id
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader("X-Request-Id", req.id);
  next();
});

app.use(helmet());

// CORS with credentials aligned to front
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// CSRF attach (issue token endpoint and verify on state-changing)
app.use(attachCsrf);

// Health and readiness
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.get("/ready", (req, res) => res.json({ status: "ready" }));

// API routes (keep /api prefix if front proxy expects it)
const prefix = process.env.API_PREFIX || "/api";

app.use(`${prefix}/auth`, authRouter);
app.use(`${prefix}/products`, productsRouter);
app.use(`${prefix}/stats`, statsRouter);
app.use(`${prefix}/reports`, reportsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

// Error handler
app.use(errorHandler(logger));

export default app;
