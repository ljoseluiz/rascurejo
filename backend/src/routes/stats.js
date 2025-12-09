import express from "express";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

// Basic stats example; extend per your docs later
router.get("/", async (req, res, next) => {
  try {
    const [totalProducts, totalBrands, totalCategories, totalSuppliers] = await Promise.all([
      prisma.products.count(),
      prisma.product_brands.count(),
      prisma.product_categories.count(),
      prisma.suppliers.count(),
    ]);
    res.json({
      totalProducts,
      totalBrands,
      totalCategories,
      totalSuppliers,
    });
  } catch (err) {
    next(err);
  }
});

export default router;