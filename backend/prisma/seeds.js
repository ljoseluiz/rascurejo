import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  // Ensure base units/categories/brands
  await prisma.product_units.upsert({
    where: { code: "UN" },
    update: {},
    create: { code: "UN", name: "Unidade" },
  });

  await prisma.product_categories.upsert({
    where: { name: "Geral" },
    update: {},
    create: { name: "Geral" },
  });

  await prisma.product_brands.upsert({
    where: { name: "Genérica" },
    update: {},
    create: { name: "Genérica" },
  });

  // Admin user
  const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";
  await prisma.users.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password_hash: hashPassword(adminPassword),
      role: "admin",
    },
  });

  // Sample products
  await prisma.products.createMany({
    data: [
      { name: "Produto A", sku: "SKU-A", sale_price: 19.9, active: true },
      { name: "Produto B", sku: "SKU-B", sale_price: 29.9, active: true },
      { name: "Produto C", sku: "SKU-C", sale_price: 39.9, active: true },
    ],
    skipDuplicates: true,
  });

  // eslint-disable-next-line no-console
  console.log("Seed completed");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });