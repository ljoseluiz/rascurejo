require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPostgreSQL } = require('@prisma/adapter-postgresql');

// Driver pg com sua DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase exige SSL
});

// Adapter Prisma 7
const adapter = new PrismaPostgreSQL(pool);

// Prisma Client usando adapter obrigatório no Prisma 7
const prisma = new PrismaClient({
  adapter,   // ← obrigatório
  log: ['error', 'warn']
});

const app = express();

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Teste
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Produtos
app.get('/products', async (req, res) => {
  try {
    const products = await prisma.products.findMany();
    res.json(products);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

module.exports = app;
