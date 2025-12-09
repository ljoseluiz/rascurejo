import express from "express";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

// Example CSV export for products
router.get("/products.csv", async (req, res, next) => {
  try {
    const items = await prisma.products.findMany({
      orderBy: { created_at: "desc" },
      select: { id: true, name: true, sku: true, barcode: true, sale_price: true, active: true },
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=products.csv");

    const header = "id,name,sku,barcode,sale_price,active\n";
    const rows = items
      .map((p) =>
        [
          p.id,
          JSON.stringify(p.name),
          JSON.stringify(p.sku || ""),
          JSON.stringify(p.barcode || ""),
          p.sale_price ?? "",
          p.active ? "true" : "false",
        ].join(",")
      )
      .join("\n");

    res.send(header + rows + "\n");
  } catch (err) {
    next(err);
  }
});

export default router;