import express from "express";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

/**
 * GET /sales/stats
 * 
 * Returns placeholder sales statistics for dashboard.
 * COMPATIBILITY NOTE: Added to match frontend expectations (Dashboard.jsx calls /sales/stats).
 * 
 * Frontend expects: { today_sales, today_revenue, total_revenue, avg_ticket, ... }
 * 
 * If orders table exists in future, compute from real data.
 * For now, return zeros to prevent 500 errors.
 */
router.get("/stats", async (req, res, next) => {
  try {
    // Check if orders/sales table exists in schema
    // Since schema doesn't have orders yet, return placeholder values
    const placeholderStats = {
      today_sales: 0,
      today_revenue: 0,
      total_sales: 0,
      total_revenue: 0,
      cancelled_sales: 0,
      avg_ticket: 0,
      top_sellers: [],
    };

    // TODO: When orders/sales table is added to schema, compute real stats:
    // const today = new Date().toISOString().split('T')[0];
    // const todaySales = await prisma.orders.count({ where: { date: { startsWith: today }, status: 'completed' } });
    // const todayRevenue = await prisma.orders.aggregate({ where: { date: { startsWith: today }, status: 'completed' }, _sum: { total: true } });
    // etc.

    res.json(placeholderStats);
  } catch (err) {
    next(err);
  }
});

export default router;
