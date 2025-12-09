import express from "express";
import { prisma } from "../lib/prisma.js";
import { requireCsrf } from "../middlewares/csrf.js";

const router = express.Router();

// GET /products?q=&page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where =
      q.length > 0
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
              { barcode: { contains: q, mode: "insensitive" } },
            ],
            active: true,
          }
        : { active: true };

    const [items, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          cost_price: true,
          sale_price: true,
          active: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.products.count({ where }),
    ]);

    res.json({ items, total });
  } catch (err) {
    next(err);
  }
});

// POST /products
router.post("/", requireCsrf, async (req, res, next) => {
  try {
    const { name, sku, barcode, cost_price, sale_price, active = true } = req.body || {};
    if (!name) {
      const err = new Error("name is required");
      err.status = 400;
      err.code = "BAD_REQUEST";
      throw err;
    }
    const created = await prisma.products.create({
      data: {
        name,
        sku,
        barcode,
        cost_price,
        sale_price,
        active,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    if (String(err.message).includes("Unique constraint")) {
      err.status = 409;
      err.code = "CONFLICT";
    }
    next(err);
  }
});

// PUT /products/:id
router.put("/:id", requireCsrf, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body || {};
    const updated = await prisma.products.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /products/:id
router.delete("/:id", requireCsrf, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.products.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;