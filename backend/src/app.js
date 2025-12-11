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
import salesRouter from "./routes/sales.js";

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
// COMPATIBILITY NOTE: Add fallback for both localhost:5173 and 127.0.0.1:5173
const defaultOrigins = "http://localhost:5173,http://127.0.0.1:5173";
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || defaultOrigins)
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

// COMPATIBILITY NOTE: Dual-route mounting for frontend compatibility
// Frontend Vite proxy at localhost:5173 strips /api prefix before forwarding to backend.
// To support both direct calls (/api/...) and proxied calls (without /api),
// we mount all routers at BOTH prefixed and unprefixed paths.
// TODO: Remove unprefixed routes once frontend consistently uses one pattern.
const prefix = process.env.API_PREFIX || "/api";

// Mount with /api prefix
app.use(`${prefix}/auth`, authRouter);
app.use(`${prefix}/products`, productsRouter);
app.use(`${prefix}/stats`, statsRouter);
app.use(`${prefix}/reports`, reportsRouter);
app.use(`${prefix}/sales`, salesRouter);

// Mount without prefix for Vite proxy compatibility
app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/stats", statsRouter);
app.use("/reports", reportsRouter);
app.use("/sales", salesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

// Error handler
app.use(errorHandler(logger));

export default app;