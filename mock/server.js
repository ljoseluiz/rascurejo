import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import session from 'express-session'
import memorystore from 'memorystore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const MemoryStore = memorystore(session)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const SECRET = process.env.MOCK_JWT_SECRET || 'dev-secret'

// Allow requests from the Vite dev server and include credentials (cookies)
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow any localhost port during development
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, 
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// Parse JSON bodies with multiple fallbacks
app.use(express.json({ limit: '10mb' }))
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

// Raw body parser for debugging
app.use(express.text({ type: 'application/json' }))

app.use(cookieParser())

// setup sessions with in-memory store
app.use(session({
  store: new MemoryStore(),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000 } // 2 hours
}))

// simple in-memory user for demo
const users = [
  { id: 1, username: 'admin', password: 'password', name: 'Admin' }
]

// load initial data from db.json
const dbPath = join(__dirname, '..', 'db.json')
const db = JSON.parse(readFileSync(dbPath, 'utf-8'))
let products = Array.isArray(db.products) ? db.products.slice() : []
let categories = Array.isArray(db.categories) ? db.categories.slice() : []
let brands = Array.isArray(db.brands) ? db.brands.slice() : []
let suppliers = Array.isArray(db.suppliers) ? db.suppliers.slice() : []
let stockLocations = Array.isArray(db.stock_locations) ? db.stock_locations.slice() : []
let stockMovements = Array.isArray(db.stock_movements) ? db.stock_movements.slice() : []
let stockLevels = Array.isArray(db.stock_levels) ? db.stock_levels.slice() : []
let stockBatches = Array.isArray(db.stock_batches) ? db.stock_batches.slice() : []
let stockAlerts = Array.isArray(db.stock_alerts) ? db.stock_alerts.slice() : []
let accountsPayable = Array.isArray(db.accounts_payable) ? db.accounts_payable.slice() : []
let accountsReceivable = Array.isArray(db.accounts_receivable) ? db.accounts_receivable.slice() : []
let cashBoxes = Array.isArray(db.cash_boxes) ? db.cash_boxes.slice() : []
let cashMovements = Array.isArray(db.cash_movements) ? db.cash_movements.slice() : []
let cashFlowForecast = Array.isArray(db.cash_flow_forecast) ? db.cash_flow_forecast.slice() : []

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`)
  if (req.body) {
    console.log('  body:', typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
  }
  next()
})

// Test endpoint to verify body parsing
app.post('/debug/body', (req, res) => {
  console.log('[DEBUG] Full request object:')
  console.log('  body:', req.body)
  console.log('  method:', req.method)
  console.log('  path:', req.path)
  console.log('  headers:', req.headers)
  res.json({ received: req.body })
})

// auth endpoint
app.post('/auth/login', (req, res) => {
  console.log('[LOGIN] Body raw:', req.body)
  console.log('[LOGIN] Headers:', req.headers)
  const body = req.body || {}
  const { username, password } = body
  console.log('[LOGIN] Extracted:', { username, password })
  console.log('[LOGIN] Users:', users.map(u => ({ id: u.id, username: u.username })))
  
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) {
    console.log('[LOGIN] FAILED - no matching user')
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  
  console.log('[LOGIN] SUCCESS - generating token')
  const token = jwt.sign({ sub: user.id, username: user.username }, SECRET, { expiresIn: '2h' })
  
  // set httpOnly session cookie and attach CSRF token to session
  req.session.userId = user.id
  const csrf = Math.random().toString(36).slice(2)
  req.session.csrfToken = csrf
  
  res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax' })
  res.json({ user: { id: user.id, username: user.username, name: user.name }, csrfToken: csrf })
})

// middleware to protect routes (optional auth - accepts token or cookie)
function ensureAuth(req, res, next) {
  // Accept token from Authorization header or httpOnly cookie
  const auth = req.headers.authorization || ''
  const parts = auth.split(' ')
  let token = null
  if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1]
  if (!token && req.cookies && req.cookies.auth_token) token = req.cookies.auth_token
  
  // In dev/demo, allow unauthenticated access but attach user if token present
  if (!token) {
    req.user = null
    return next()
  }
  
  try {
    const decoded = jwt.verify(token, SECRET)
    req.user = decoded
    next()
  } catch (err) {
    // Invalid token, but allow to continue (dev mode)
    req.user = null
    return next()
  }
}

// CSRF protection middleware for state-changing requests (dev: optional)
function verifyCsrf(req, res, next) {
  const method = (req.method || '').toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next()
  
  // In dev mode, allow requests without CSRF token for testing
  const header = req.get('X-CSRF-Token') || req.get('x-csrf-token')
  if (!header) {
    // No CSRF token sent, but allow in dev (log warning)
    console.warn('[DEV] CSRF token missing, but allowing request')
    return next()
  }
  
  const expected = (req.session && req.session.csrfToken)
  if (header !== expected) {
    console.warn('[DEV] CSRF mismatch: received', header, 'expected', expected)
    return next() // Allow anyway in dev
  }
  return next()
}

// public products endpoint with pagination and filtering
app.get('/products', (req, res) => {
  // query: q, page, limit, category, brand, active
  const q = (req.query.q || '').toLowerCase()
  const category = req.query.category ? (req.query.category || '').toLowerCase() : null
  const brand = req.query.brand ? (req.query.brand || '').toLowerCase() : null
  const active = req.query.active !== undefined ? req.query.active === 'true' : null
  const page = Math.max(1, parseInt(req.query.page || '1', 10))
  const limit = Math.max(1, parseInt(req.query.limit || '10', 10))

  let filtered = products.slice()
  
  // Filtrar por busca
  if (q) {
    filtered = filtered.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q)
    )
  }
  
  // Filtrar por categoria
  if (category) {
    filtered = filtered.filter(p => (p.category || '').toLowerCase().includes(category))
  }
  
  // Filtrar por marca
  if (brand) {
    filtered = filtered.filter(p => (p.brand || '').toLowerCase().includes(brand))
  }
  
  // Filtrar por status ativo/inativo
  if (active !== null) {
    filtered = filtered.filter(p => p.active === active)
  }
  
  const total = filtered.length
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit)

  res.json({ items, total, page, limit })
})

// protected inventory endpoint with search and pagination
app.get('/inventory', ensureAuth, (req, res) => {
  const q = (req.query.q || '').toLowerCase()
  const page = Math.max(1, parseInt(req.query.page || '1', 10))
  const limit = Math.max(1, parseInt(req.query.limit || '10', 10))

  // Generate inventory with random stock levels
  let inventory = products.map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    price: p.price,
    stock: Math.floor(Math.random() * 100) // Random stock 0-99
  }))

  // Filter by search query
  if (q) {
    inventory = inventory.filter(item =>
      (item.sku || '').toLowerCase().includes(q) ||
      (item.name || '').toLowerCase().includes(q)
    )
  }

  // Paginate
  const total = inventory.length
  const start = (page - 1) * limit
  const items = inventory.slice(start, start + limit)

  res.json({ items, total, page, limit })
})

// protected sales endpoint with filters and pagination
app.get('/sales', ensureAuth, (req, res) => {
  const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = req.query.endDate || new Date().toISOString().split('T')[0]
  const statusFilter = req.query.status || 'all'
  const page = Math.max(1, parseInt(req.query.page || '1', 10))
  const limit = Math.max(1, parseInt(req.query.limit || '10', 10))

  // Generate mock sales data
  const statuses = ['completed', 'pending', 'cancelled']
  const customers = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza']
  
  let allSales = []
  for (let i = 1; i <= 50; i++) {
    const randomDays = Math.floor(Math.random() * 30)
    const saleDate = new Date(Date.now() - randomDays * 24 * 60 * 60 * 1000)
    const product = products[Math.floor(Math.random() * products.length)]
    const quantity = Math.floor(Math.random() * 5) + 1
    const unitPrice = product ? product.price : 50
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    allSales.push({
      id: i,
      date: saleDate.toISOString(),
      customer: customers[Math.floor(Math.random() * customers.length)],
      product: product ? product.name : 'Produto ' + i,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      status
    })
  }

  // Filter by date range
  allSales = allSales.filter(s => {
    const sDate = s.date.split('T')[0]
    return sDate >= startDate && sDate <= endDate
  })

  // Filter by status
  if (statusFilter !== 'all') {
    allSales = allSales.filter(s => s.status === statusFilter)
  }

  // Paginate
  const total = allSales.length
  const start = (page - 1) * limit
  const items = allSales.slice(start, start + limit)

  res.json({ items, total, page, limit })
})

// ============================================
// PRODUTOS - ENDPOINTS AVANÇADOS
// ============================================

// Validar estrutura do produto
function validateProduct(body) {
  const errors = []
  
  if (!body.name || !body.name.trim()) errors.push('Nome do produto é obrigatório')
  if (!body.sku || !body.sku.trim()) errors.push('SKU é obrigatório')
  if (!body.category || !body.category.trim()) errors.push('Categoria é obrigatória')
  if (!body.brand || !body.brand.trim()) errors.push('Marca é obrigatória')
  if (body.prices) {
    if (body.prices.sale === undefined || body.prices.sale === null) errors.push('Preço de venda é obrigatório')
    if (isNaN(parseFloat(body.prices.sale))) errors.push('Preço de venda deve ser um número')
  }
  
  return { valid: errors.length === 0, errors }
}

// Criar entrada de histórico
function createHistoryEntry(type, field, oldValue, newValue, changedBy) {
  return {
    id: Date.now(),
    type,
    field,
    oldValue,
    newValue,
    changedBy: changedBy || 'system',
    changedAt: new Date().toISOString()
  }
}

// POST /products - Criar novo produto
app.post('/products', ensureAuth, verifyCsrf, (req, res) => {
  console.log('[POST /products] Criando novo produto:', req.body)
  const body = req.body || {}
  
  // Validar
  const validation = validateProduct(body)
  if (!validation.valid) {
    return res.status(400).json({ error: 'Dados inválidos', details: validation.errors })
  }
  
  // Verificar SKU duplicado
  if (products.find(p => p.sku === body.sku)) {
    return res.status(409).json({ error: 'SKU já existe no sistema' })
  }
  
  const id = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1
  const newProduct = {
    id,
    name: body.name.trim(),
    sku: body.sku.trim(),
    barcode: body.barcode || '',
    category: body.category.trim(),
    subcategory: body.subcategory || '',
    brand: body.brand.trim(),
    supplier: body.supplier || '',
    description: body.description || '',
    prices: {
      sale: parseFloat(body.prices?.sale) || 0,
      promotion: parseFloat(body.prices?.promotion) || 0,
      wholesale: parseFloat(body.prices?.wholesale) || 0
    },
    unit: body.unit || 'un',
    images: body.images || [],
    variations: body.variations || [],
    active: body.active !== false,
    stock: parseInt(body.stock) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [createHistoryEntry('created', null, null, null, req.user?.username)]
  }
  
  products.push(newProduct)
  console.log('[POST /products] Produto criado:', newProduct)
  res.status(201).json(newProduct)
})

// PUT /products/:id - Atualizar produto
app.put('/products/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const product = products.find(p => p.id === id)
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' })
  
  const body = req.body || {}
  console.log('[PUT /products/:id] Atualizando produto', id, ':', body)
  
  // Verificar SKU duplicado (se foi alterado)
  if (body.sku && body.sku !== product.sku && products.find(p => p.sku === body.sku && p.id !== id)) {
    return res.status(409).json({ error: 'SKU já existe no sistema' })
  }
  
  // Registrar alterações no histórico
  const historyEntries = []
  
  if (body.name && body.name !== product.name) {
    historyEntries.push(createHistoryEntry('updated', 'name', product.name, body.name, req.user?.username))
    product.name = body.name.trim()
  }
  
  if (body.sku && body.sku !== product.sku) {
    historyEntries.push(createHistoryEntry('updated', 'sku', product.sku, body.sku, req.user?.username))
    product.sku = body.sku.trim()
  }
  
  if (body.category && body.category !== product.category) {
    historyEntries.push(createHistoryEntry('updated', 'category', product.category, body.category, req.user?.username))
    product.category = body.category.trim()
  }
  
  if (body.subcategory !== undefined && body.subcategory !== product.subcategory) {
    historyEntries.push(createHistoryEntry('updated', 'subcategory', product.subcategory, body.subcategory, req.user?.username))
    product.subcategory = body.subcategory || ''
  }
  
  if (body.brand && body.brand !== product.brand) {
    historyEntries.push(createHistoryEntry('updated', 'brand', product.brand, body.brand, req.user?.username))
    product.brand = body.brand.trim()
  }
  
  if (body.supplier !== undefined && body.supplier !== product.supplier) {
    historyEntries.push(createHistoryEntry('updated', 'supplier', product.supplier, body.supplier, req.user?.username))
    product.supplier = body.supplier || ''
  }
  
  if (body.description !== undefined && body.description !== product.description) {
    historyEntries.push(createHistoryEntry('updated', 'description', product.description?.substring(0, 50), body.description?.substring(0, 50), req.user?.username))
    product.description = body.description || ''
  }
  
  if (body.prices) {
    const oldSale = product.prices.sale
    if (body.prices.sale !== undefined) {
      const newSale = parseFloat(body.prices.sale)
      if (newSale !== oldSale) {
        historyEntries.push(createHistoryEntry('updated', 'price_sale', oldSale, newSale, req.user?.username))
        product.prices.sale = newSale
      }
    }
    if (body.prices.promotion !== undefined) {
      product.prices.promotion = parseFloat(body.prices.promotion) || 0
    }
    if (body.prices.wholesale !== undefined) {
      product.prices.wholesale = parseFloat(body.prices.wholesale) || 0
    }
  }
  
  if (body.unit && body.unit !== product.unit) {
    historyEntries.push(createHistoryEntry('updated', 'unit', product.unit, body.unit, req.user?.username))
    product.unit = body.unit
  }
  
  if (body.stock !== undefined && parseInt(body.stock) !== product.stock) {
    historyEntries.push(createHistoryEntry('updated', 'stock', product.stock, parseInt(body.stock), req.user?.username))
    product.stock = parseInt(body.stock)
  }
  
  if (body.active !== undefined && body.active !== product.active) {
    historyEntries.push(createHistoryEntry('updated', 'active', product.active, body.active, req.user?.username))
    product.active = body.active
  }
  
  if (body.images) {
    product.images = body.images
  }
  
  if (body.variations) {
    product.variations = body.variations
  }
  
  if (body.barcode !== undefined && body.barcode !== product.barcode) {
    product.barcode = body.barcode
  }
  
  // Adicionar entradas ao histórico
  if (historyEntries.length > 0) {
    if (!product.history) product.history = []
    product.history.push(...historyEntries)
  }
  
  product.updatedAt = new Date().toISOString()
  console.log('[PUT /products/:id] Produto atualizado:', product)
  res.json(product)
})

// DELETE /products/:id - Deletar produto
app.delete('/products/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Produto não encontrado' })
  
  const deleted = products.splice(idx, 1)[0]
  console.log('[DELETE /products/:id] Produto deletado:', deleted.id)
  res.json({ message: 'Produto deletado com sucesso', product: deleted })
})

// GET /products/search - Busca avançada com filtros
app.get('/products/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase()
  const category = req.query.category ? (req.query.category || '').toLowerCase() : null
  const brand = req.query.brand ? (req.query.brand || '').toLowerCase() : null
  const active = req.query.active !== undefined ? req.query.active === 'true' : null
  const page = Math.max(1, parseInt(req.query.page || '1', 10))
  const limit = Math.max(1, parseInt(req.query.limit || '10', 10))
  
  let filtered = products.slice()
  
  // Filtrar por busca
  if (q) {
    filtered = filtered.filter(p => 
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q)
    )
  }
  
  // Filtrar por categoria
  if (category) {
    filtered = filtered.filter(p => (p.category || '').toLowerCase().includes(category))
  }
  
  // Filtrar por marca
  if (brand) {
    filtered = filtered.filter(p => (p.brand || '').toLowerCase().includes(brand))
  }
  
  // Filtrar por status ativo/inativo
  if (active !== null) {
    filtered = filtered.filter(p => p.active === active)
  }
  
  const total = filtered.length
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit)
  
  res.json({ items, total, page, limit })
})

// GET /products/categories - Listar categorias (strings para consumo simples no front)
app.get('/products/categories', (req, res) => {
  const categoryNames = categories.map(c => c.name)
  res.json(categoryNames)
})

// GET /products/brands - Listar marcas (strings)
app.get('/products/brands', (req, res) => {
  const brandNames = brands.map(b => b.name)
  res.json(brandNames)
})

// GET /products/suppliers - Listar fornecedores (strings)
app.get('/products/suppliers', (req, res) => {
  const supplierNames = suppliers.map(s => s.name)
  res.json(supplierNames)
})

// GET /products/units - Listar unidades de medida (pré-definidas)
app.get('/products/units', (req, res) => {
  const units = [
    { id: 1, name: 'un', label: 'Unidade' },
    { id: 2, name: 'kg', label: 'Quilograma' },
    { id: 3, name: 'g', label: 'Grama' },
    { id: 4, name: 'l', label: 'Litro' },
    { id: 5, name: 'ml', label: 'Mililitro' },
    { id: 6, name: 'm', label: 'Metro' },
    { id: 7, name: 'cm', label: 'Centímetro' },
    { id: 8, name: 'par', label: 'Par' },
    { id: 9, name: 'caixa', label: 'Caixa' },
    { id: 10, name: 'pacote', label: 'Pacote' },
    { id: 11, name: 'fardo', label: 'Fardo' },
    { id: 12, name: 'cx', label: 'Caixa (cx)' },
    { id: 13, name: 'saco', label: 'Saco' },
    { id: 14, name: 'm²', label: 'Metro Quadrado' },
    { id: 15, name: 'm³', label: 'Metro Cúbico' }
  ]
  res.json(units)
})

// ============================================
// CATEGORIAS - CRUD COMPLETO
// ============================================

// GET /categories - Listar todas as categorias
app.get('/categories', ensureAuth, (req, res) => {
  res.json(categories)
})

// POST /categories - Criar categoria
app.post('/categories', ensureAuth, verifyCsrf, (req, res) => {
  const { name, description } = req.body || {}
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' })
  }
  
  // Verificar duplicação
  if (categories.find(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Categoria já existe' })
  }
  
  const id = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1
  const newCategory = {
    id,
    name: name.trim(),
    description: description?.trim() || ''
  }
  
  categories.push(newCategory)
  console.log('[POST /categories] Categoria criada:', newCategory)
  res.status(201).json(newCategory)
})

// PUT /categories/:id - Atualizar categoria
app.put('/categories/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const category = categories.find(c => c.id === id)
  if (!category) return res.status(404).json({ error: 'Categoria não encontrada' })
  
  const { name, description } = req.body || {}
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' })
  }
  
  // Verificar duplicação (exceto com ela mesma)
  if (categories.find(c => c.id !== id && c.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Categoria já existe' })
  }
  
  category.name = name.trim()
  category.description = description?.trim() || ''
  
  console.log('[PUT /categories/:id] Categoria atualizada:', category)
  res.json(category)
})

// DELETE /categories/:id - Deletar categoria
app.delete('/categories/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const idx = categories.findIndex(c => c.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Categoria não encontrada' })
  
  const deleted = categories.splice(idx, 1)[0]
  console.log('[DELETE /categories/:id] Categoria deletada:', deleted)
  res.json({ message: 'Categoria deletada com sucesso', category: deleted })
})

// ============================================
// MARCAS - CRUD COMPLETO
// ============================================

// GET /brands - Listar todas as marcas
app.get('/brands', ensureAuth, (req, res) => {
  res.json(brands)
})

// POST /brands - Criar marca
app.post('/brands', ensureAuth, verifyCsrf, (req, res) => {
  const { name } = req.body || {}
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome da marca é obrigatório' })
  }
  
  // Verificar duplicação
  if (brands.find(b => b.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Marca já existe' })
  }
  
  const id = brands.length ? Math.max(...brands.map(b => b.id)) + 1 : 1
  const newBrand = {
    id,
    name: name.trim()
  }
  
  brands.push(newBrand)
  console.log('[POST /brands] Marca criada:', newBrand)
  res.status(201).json(newBrand)
})

// PUT /brands/:id - Atualizar marca
app.put('/brands/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const brand = brands.find(b => b.id === id)
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  
  const { name } = req.body || {}
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome da marca é obrigatório' })
  }
  
  // Verificar duplicação (exceto com ela mesma)
  if (brands.find(b => b.id !== id && b.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Marca já existe' })
  }
  
  brand.name = name.trim()
  
  console.log('[PUT /brands/:id] Marca atualizada:', brand)
  res.json(brand)
})

// DELETE /brands/:id - Deletar marca
app.delete('/brands/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const idx = brands.findIndex(b => b.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Marca não encontrada' })
  
  const deleted = brands.splice(idx, 1)[0]
  console.log('[DELETE /brands/:id] Marca deletada:', deleted)
  res.json({ message: 'Marca deletada com sucesso', brand: deleted })
})

// ============================================
// FORNECEDORES - CRUD COMPLETO
// ============================================

// GET /suppliers - Listar todos os fornecedores
app.get('/suppliers', ensureAuth, (req, res) => {
  res.json(suppliers)
})

// POST /suppliers - Criar fornecedor
app.post('/suppliers', ensureAuth, verifyCsrf, (req, res) => {
  const { name, contact, phone } = req.body || {}
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome do fornecedor é obrigatório' })
  }
  
  // Verificar duplicação
  if (suppliers.find(s => s.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Fornecedor já existe' })
  }
  
  const id = suppliers.length ? Math.max(...suppliers.map(s => s.id)) + 1 : 1
  const newSupplier = {
    id,
    name: name.trim(),
    contact: contact?.trim() || '',
    phone: phone?.trim() || ''
  }
  
  suppliers.push(newSupplier)
  console.log('[POST /suppliers] Fornecedor criado:', newSupplier)
  res.status(201).json(newSupplier)
})

// PUT /suppliers/:id - Atualizar fornecedor
app.put('/suppliers/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const supplier = suppliers.find(s => s.id === id)
  if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado' })
  
  const { name, contact, phone } = req.body || {}
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome do fornecedor é obrigatório' })
  }
  
  // Verificar duplicação (exceto com ele mesmo)
  if (suppliers.find(s => s.id !== id && s.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Fornecedor já existe' })
  }
  
  supplier.name = name.trim()
  supplier.contact = contact?.trim() || ''
  supplier.phone = phone?.trim() || ''
  
  console.log('[PUT /suppliers/:id] Fornecedor atualizado:', supplier)
  res.json(supplier)
})

// DELETE /suppliers/:id - Deletar fornecedor
app.delete('/suppliers/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const idx = suppliers.findIndex(s => s.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Fornecedor não encontrado' })
  
  const deleted = suppliers.splice(idx, 1)[0]
  console.log('[DELETE /suppliers/:id] Fornecedor deletado:', deleted)
  res.json({ message: 'Fornecedor deletado com sucesso', supplier: deleted })
})

// GET /products/:id - Obter detalhes do produto
app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const product = products.find(p => p.id === id)
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' })
  
  res.json(product)
})

// GET /products/categories - Listar categorias
app.get('/products/categories', (req, res) => {
  const categories = [
    { id: 1, name: 'Roupas', description: 'Vestuário em geral' },
    { id: 2, name: 'Calçados', description: 'Sapatos e tênis' },
    { id: 3, name: 'Acessórios', description: 'Acessórios diversos' },
    { id: 4, name: 'Alimentos', description: 'Produtos alimentícios' }
  ]
  res.json(categories)
})

// GET /products/brands - Listar marcas
app.get('/products/brands', (req, res) => {
  const brands = [...new Set(products.map(p => p.brand))].filter(Boolean).map((name, idx) => ({
    id: idx + 1,
    name
  }))
  res.json(brands)
})

// GET /products/suppliers - Listar fornecedores
app.get('/products/suppliers', (req, res) => {
  const suppliers = [
    { id: 1, name: 'Fornecedor A', contact: 'contato@fornecedor-a.com', phone: '(11) 98765-4321' },
    { id: 2, name: 'Fornecedor B', contact: 'vendas@fornecedor-b.com', phone: '(11) 98765-4322' },
    { id: 3, name: 'Fornecedor C', contact: 'pedidos@fornecedor-c.com', phone: '(11) 98765-4323' }
  ]
  res.json(suppliers)
})

// endpoint to return current user based on cookie token (no auth required to call, returns 401 if not authed)
app.get('/auth/me', (req, res) => {
  let token = null
  const auth = req.headers.authorization || ''
  const parts = auth.split(' ')
  if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1]
  if (!token && req.cookies && req.cookies.auth_token) token = req.cookies.auth_token
  
  // If no token, just return empty user (not authenticated)
  if (!token) return res.json({ user: null })
  
  try {
    const decoded = jwt.verify(token, SECRET)
    const user = users.find(u => u.id === decoded.sub)
    if (!user) return res.json({ user: null })
    res.json({ user: { id: user.id, username: user.username, name: user.name } })
  } catch (err) {
    return res.json({ user: null })
  }
})

// endpoint to get current session CSRF token (no auth required)
app.get('/auth/csrf', (req, res) => {
  // Create CSRF token if session exists but no token yet
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = Math.random().toString(36).slice(2)
  }
  const token = (req.session && req.session.csrfToken) || Math.random().toString(36).slice(2)
  if (req.session) {
    req.session.csrfToken = token
  }
  res.json({ csrfToken: token })
})

// logout clears the cookie
app.post('/auth/logout', (req, res) => {
  res.clearCookie('auth_token')
  res.json({ ok: true })
})

// dashboard stats endpoint with enriched data
app.get('/stats', ensureAuth, (req, res) => {
  const totalProducts = products.length
  const totalSales = 45230.50
  const totalCustomers = 127
  const monthlySales = 342
  const salesGrowth = 12.5 // percentage
  const revenueGrowth = 8.3 // percentage
  const averageTicket = monthlySales > 0 ? totalSales / monthlySales : 0
  
  // Calculate low stock items (stock < 10)
  const lowStockItems = products.filter(p => {
    const randomStock = Math.floor(Math.random() * 100)
    return randomStock < 10
  }).length

  // Simulate 7 days of sales data
  const recentSales = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    recentSales.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      amount: Math.floor(Math.random() * 1500) + 800
    })
  }

  // Top 5 products by sales
  const topProducts = products.slice(0, 5).map((p, idx) => ({
    name: p.name,
    sales: Math.floor(Math.random() * 50) + 10
  })).sort((a, b) => b.sales - a.sales)

  // Sales by category
  const categories = ['Eletrônicos', 'Roupas', 'Alimentos', 'Livros', 'Casa']
  const salesByCategory = categories.map(cat => ({
    name: cat,
    value: Math.floor(Math.random() * 5000) + 1000
  }))

  // Sales by status
  const salesByStatus = [
    { status: 'Concluídas', count: 289, percentage: 84.5 },
    { status: 'Pendentes', count: 38, percentage: 11.1 },
    { status: 'Canceladas', count: 15, percentage: 4.4 }
  ]

  res.json({ 
    totalProducts, 
    totalSales, 
    totalCustomers, 
    monthlySales,
    salesGrowth,
    revenueGrowth,
    averageTicket,
    lowStockItems,
    recentSales,
    topProducts,
    salesByCategory,
    salesByStatus
  })
})

// sales report endpoint with date filtering
app.get('/reports/sales', ensureAuth, (req, res) => {
  const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = req.query.endDate || new Date().toISOString().split('T')[0]
  
  const sales = [
    { id: 1, date: startDate, product: 'Camiseta básica', quantity: 10, unitPrice: 29.9, total: 299 },
    { id: 2, date: startDate, product: 'Calça jeans', quantity: 5, unitPrice: 129.0, total: 645 },
    { id: 3, date: endDate, product: 'Tênis esporte', quantity: 3, unitPrice: 199.0, total: 597 }
  ]
  res.json({ sales, startDate, endDate })
})

// ========== STOCK MODULE ENDPOINTS ==========

// Helper: recalculate stock levels based on movements
function recalculateStockLevel(productId, locationId) {
  const movements = stockMovements.filter(m => 
    m.product_id === productId && m.location_id === locationId
  )
  
  const totalIn = movements
    .filter(m => m.type === 'in')
    .reduce((sum, m) => sum + m.quantity, 0)
  
  const totalOut = movements
    .filter(m => m.type === 'out')
    .reduce((sum, m) => sum + m.quantity, 0)
  
  return totalIn - totalOut
}

// Helper: update or create stock level
function updateStockLevel(productId, locationId) {
  const quantity = recalculateStockLevel(productId, locationId)
  const index = stockLevels.findIndex(l => 
    l.product_id === productId && l.location_id === locationId
  )
  
  if (index >= 0) {
    stockLevels[index].quantity = quantity
    stockLevels[index].last_updated = new Date().toISOString()
  } else {
    stockLevels.push({
      product_id: productId,
      location_id: locationId,
      quantity,
      min_stock: 10,
      max_stock: 100,
      last_updated: new Date().toISOString()
    })
  }
  
  // Check alerts
  checkStockAlerts(productId, locationId)
}

// Helper: check and create alerts
function checkStockAlerts(productId, locationId) {
  const level = stockLevels.find(l => 
    l.product_id === productId && l.location_id === locationId
  )
  
  if (!level) return
  
  const product = products.find(p => p.id === productId)
  const location = stockLocations.find(l => l.id === locationId)
  
  if (!product || !location) return
  
  // Remove existing alerts for this product/location
  stockAlerts = stockAlerts.filter(a => 
    !(a.product_id === productId && a.location_id === locationId)
  )
  
  if (level.quantity <= 0) {
    stockAlerts.push({
      id: Date.now(),
      type: 'out_of_stock',
      severity: 'critical',
      product_id: productId,
      location_id: locationId,
      message: `${product.name} está em RUPTURA em ${location.name}`,
      current_quantity: level.quantity,
      threshold: 0,
      created_at: new Date().toISOString(),
      resolved: false
    })
  } else if (level.quantity < level.min_stock) {
    stockAlerts.push({
      id: Date.now() + 1,
      type: 'low_stock',
      severity: 'warning',
      product_id: productId,
      location_id: locationId,
      message: `${product.name} abaixo do mínimo em ${location.name}`,
      current_quantity: level.quantity,
      threshold: level.min_stock,
      created_at: new Date().toISOString(),
      resolved: false
    })
  } else if (level.quantity > level.max_stock) {
    stockAlerts.push({
      id: Date.now() + 2,
      type: 'high_stock',
      severity: 'info',
      product_id: productId,
      location_id: locationId,
      message: `${product.name} acima do máximo em ${location.name}`,
      current_quantity: level.quantity,
      threshold: level.max_stock,
      created_at: new Date().toISOString(),
      resolved: false
    })
  }
}

// GET /stock/locations - List all stock locations
app.get('/stock/locations', ensureAuth, (req, res) => {
  const activeOnly = req.query.active === 'true'
  const filtered = activeOnly ? stockLocations.filter(l => l.active) : stockLocations
  res.json(filtered)
})

// POST /stock/locations - Create location
app.post('/stock/locations', ensureAuth, verifyCsrf, (req, res) => {
  const { name, type, address, active = true } = req.body
  
  if (!name || !type) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios' })
  }
  
  const newLocation = {
    id: Math.max(0, ...stockLocations.map(l => l.id)) + 1,
    name,
    type,
    address: address || '',
    active
  }
  
  stockLocations.push(newLocation)
  res.status(201).json(newLocation)
})

// PUT /stock/locations/:id - Update location
app.put('/stock/locations/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const index = stockLocations.findIndex(l => l.id === id)
  
  if (index === -1) {
    return res.status(404).json({ error: 'Local não encontrado' })
  }
  
  const { name, type, address, active } = req.body
  
  if (name !== undefined) stockLocations[index].name = name
  if (type !== undefined) stockLocations[index].type = type
  if (address !== undefined) stockLocations[index].address = address
  if (active !== undefined) stockLocations[index].active = active
  
  res.json(stockLocations[index])
})

// DELETE /stock/locations/:id - Delete location
app.delete('/stock/locations/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const index = stockLocations.findIndex(l => l.id === id)
  
  if (index === -1) {
    return res.status(404).json({ error: 'Local não encontrado' })
  }
  
  // Check if location has stock
  const hasStock = stockLevels.some(l => l.location_id === id && l.quantity > 0)
  if (hasStock) {
    return res.status(400).json({ error: 'Não é possível deletar local com estoque' })
  }
  
  stockLocations.splice(index, 1)
  res.status(204).send()
})

// GET /stock/movements - List movements with filters
app.get('/stock/movements', ensureAuth, (req, res) => {
  const { product_id, location_id, type, subtype, start_date, end_date, q, page = 1, limit = 20 } = req.query
  
  let filtered = stockMovements.slice()
  
  if (product_id) {
    filtered = filtered.filter(m => m.product_id === parseInt(product_id, 10))
  }
  
  if (location_id) {
    filtered = filtered.filter(m => m.location_id === parseInt(location_id, 10))
  }
  
  if (type) {
    filtered = filtered.filter(m => m.type === type)
  }
  
  if (subtype) {
    filtered = filtered.filter(m => m.subtype === subtype)
  }
  
  if (start_date) {
    filtered = filtered.filter(m => m.created_at >= start_date)
  }
  
  if (end_date) {
    filtered = filtered.filter(m => m.created_at <= end_date)
  }
  
  if (q) {
    const query = q.toLowerCase()
    filtered = filtered.filter(m => {
      const product = products.find(p => p.id === m.product_id)
      const location = stockLocations.find(l => l.id === m.location_id)
      return (
        (product && product.name.toLowerCase().includes(query)) ||
        (location && location.name.toLowerCase().includes(query)) ||
        (m.reference_doc && m.reference_doc.toLowerCase().includes(query)) ||
        (m.batch_number && m.batch_number.toLowerCase().includes(query))
      )
    })
  }
  
  // Sort by date descending
  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  // Enrich with product and location names
  const enriched = filtered.map(m => {
    const product = products.find(p => p.id === m.product_id)
    const location = stockLocations.find(l => l.id === m.location_id)
    return {
      ...m,
      product_name: product?.name || 'Produto não encontrado',
      product_sku: product?.sku || '',
      location_name: location?.name || 'Local não encontrado'
    }
  })
  
  const pageNum = Math.max(1, parseInt(page, 10))
  const limitNum = Math.max(1, parseInt(limit, 10))
  const total = enriched.length
  const start = (pageNum - 1) * limitNum
  const items = enriched.slice(start, start + limitNum)
  
  res.json({ items, total, page: pageNum, limit: limitNum })
})

// POST /stock/movements - Create movement
app.post('/stock/movements', ensureAuth, verifyCsrf, (req, res) => {
  const {
    product_id,
    location_id,
    type,
    subtype,
    quantity,
    unit_cost,
    batch_number,
    expiration_date,
    reference_doc,
    notes
  } = req.body
  
  // Validation
  if (!product_id || !location_id || !type || !subtype || !quantity) {
    return res.status(400).json({ error: 'Campos obrigatórios: product_id, location_id, type, subtype, quantity' })
  }
  
  const product = products.find(p => p.id === product_id)
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado' })
  }
  
  const location = stockLocations.find(l => l.id === location_id)
  if (!location) {
    return res.status(404).json({ error: 'Local não encontrado' })
  }
  
  if (!['in', 'out'].includes(type)) {
    return res.status(400).json({ error: 'Tipo deve ser "in" ou "out"' })
  }
  
  const validSubtypes = {
    in: ['purchase', 'return', 'transfer_in', 'adjustment_positive'],
    out: ['sale', 'loss', 'transfer_out', 'adjustment_negative']
  }
  
  if (!validSubtypes[type].includes(subtype)) {
    return res.status(400).json({ error: `Subtipo inválido para tipo "${type}"` })
  }
  
  if (quantity <= 0) {
    return res.status(400).json({ error: 'Quantidade deve ser maior que zero' })
  }
  
  // Check if there's enough stock for OUT movements
  if (type === 'out') {
    const currentStock = recalculateStockLevel(product_id, location_id)
    if (currentStock < quantity) {
      return res.status(400).json({ 
        error: 'Estoque insuficiente',
        current_stock: currentStock,
        requested: quantity
      })
    }
  }
  
  const newMovement = {
    id: Math.max(0, ...stockMovements.map(m => m.id)) + 1,
    product_id,
    location_id,
    type,
    subtype,
    quantity,
    unit_cost: unit_cost || 0,
    total_cost: (unit_cost || 0) * quantity,
    batch_number: batch_number || null,
    expiration_date: expiration_date || null,
    reference_doc: reference_doc || null,
    notes: notes || '',
    created_by: req.user?.username || 'system',
    created_at: new Date().toISOString()
  }
  
  stockMovements.push(newMovement)
  
  // Update stock level
  updateStockLevel(product_id, location_id)
  
  // Update product stock (total across all locations)
  const totalStock = stockLevels
    .filter(l => l.product_id === product_id)
    .reduce((sum, l) => sum + l.quantity, 0)
  
  const productIndex = products.findIndex(p => p.id === product_id)
  if (productIndex >= 0) {
    products[productIndex].stock = totalStock
  }
  
  res.status(201).json(newMovement)
})

// GET /stock/levels - List stock levels with filters
app.get('/stock/levels', ensureAuth, (req, res) => {
  const { product_id, location_id, alert_type, page = 1, limit = 50 } = req.query
  
  let filtered = stockLevels.slice()
  
  if (product_id) {
    filtered = filtered.filter(l => l.product_id === parseInt(product_id, 10))
  }
  
  if (location_id) {
    filtered = filtered.filter(l => l.location_id === parseInt(location_id, 10))
  }
  
  if (alert_type) {
    if (alert_type === 'low') {
      filtered = filtered.filter(l => l.quantity < l.min_stock)
    } else if (alert_type === 'out') {
      filtered = filtered.filter(l => l.quantity <= 0)
    } else if (alert_type === 'high') {
      filtered = filtered.filter(l => l.quantity > l.max_stock)
    }
  }
  
  // Enrich with product and location data
  const enriched = filtered.map(l => {
    const product = products.find(p => p.id === l.product_id)
    const location = stockLocations.find(loc => loc.id === l.location_id)
    
    let status = 'ok'
    if (l.quantity <= 0) status = 'out_of_stock'
    else if (l.quantity < l.min_stock) status = 'low'
    else if (l.quantity > l.max_stock) status = 'high'
    
    return {
      ...l,
      product_name: product?.name || 'Desconhecido',
      product_sku: product?.sku || '',
      product_price: product?.prices?.sale || 0,
      location_name: location?.name || 'Desconhecido',
      location_type: location?.type || '',
      status
    }
  })
  
  const pageNum = Math.max(1, parseInt(page, 10))
  const limitNum = Math.max(1, parseInt(limit, 10))
  const total = enriched.length
  const start = (pageNum - 1) * limitNum
  const items = enriched.slice(start, start + limitNum)
  
  res.json({ items, total, page: pageNum, limit: limitNum })
})

// PUT /stock/levels/:product_id/:location_id - Update min/max thresholds
app.put('/stock/levels/:product_id/:location_id', ensureAuth, verifyCsrf, (req, res) => {
  const productId = parseInt(req.params.product_id, 10)
  const locationId = parseInt(req.params.location_id, 10)
  const { min_stock, max_stock } = req.body
  
  const index = stockLevels.findIndex(l => 
    l.product_id === productId && l.location_id === locationId
  )
  
  if (index === -1) {
    return res.status(404).json({ error: 'Nível de estoque não encontrado' })
  }
  
  if (min_stock !== undefined) {
    stockLevels[index].min_stock = Math.max(0, min_stock)
  }
  
  if (max_stock !== undefined) {
    stockLevels[index].max_stock = Math.max(0, max_stock)
  }
  
  // Recheck alerts
  checkStockAlerts(productId, locationId)
  
  res.json(stockLevels[index])
})

// GET /stock/alerts - List active alerts
app.get('/stock/alerts', ensureAuth, (req, res) => {
  const { type, severity, resolved, product_id, location_id } = req.query
  
  let filtered = stockAlerts.slice()
  
  if (type) {
    filtered = filtered.filter(a => a.type === type)
  }
  
  if (severity) {
    filtered = filtered.filter(a => a.severity === severity)
  }
  
  if (resolved !== undefined) {
    filtered = filtered.filter(a => a.resolved === (resolved === 'true'))
  }
  
  if (product_id) {
    filtered = filtered.filter(a => a.product_id === parseInt(product_id, 10))
  }
  
  if (location_id) {
    filtered = filtered.filter(a => a.location_id === parseInt(location_id, 10))
  }
  
  // Enrich with product and location names
  const enriched = filtered.map(a => {
    const product = products.find(p => p.id === a.product_id)
    const location = stockLocations.find(l => l.id === a.location_id)
    return {
      ...a,
      product_name: product?.name || 'Desconhecido',
      product_sku: product?.sku || '',
      location_name: location?.name || 'Desconhecido'
    }
  })
  
  // Sort by severity: critical > warning > info
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  enriched.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  
  res.json(enriched)
})

// PUT /stock/alerts/:id/resolve - Mark alert as resolved
app.put('/stock/alerts/:id/resolve', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const alert = stockAlerts.find(a => a.id === id)
  
  if (!alert) {
    return res.status(404).json({ error: 'Alerta não encontrado' })
  }
  
  alert.resolved = true
  alert.resolved_at = new Date().toISOString()
  alert.resolved_by = req.user?.username || 'system'
  
  res.json(alert)
})

// GET /stock/batches - List batches
app.get('/stock/batches', ensureAuth, (req, res) => {
  const { product_id, location_id, expired } = req.query
  
  let filtered = stockBatches.slice()
  
  if (product_id) {
    filtered = filtered.filter(b => b.product_id === parseInt(product_id, 10))
  }
  
  if (location_id) {
    filtered = filtered.filter(b => b.location_id === parseInt(location_id, 10))
  }
  
  if (expired === 'true') {
    const now = new Date()
    filtered = filtered.filter(b => b.expiration_date && new Date(b.expiration_date) < now)
  } else if (expired === 'false') {
    const now = new Date()
    filtered = filtered.filter(b => !b.expiration_date || new Date(b.expiration_date) >= now)
  }
  
  // Enrich with product data
  const enriched = filtered.map(b => {
    const product = products.find(p => p.id === b.product_id)
    const location = stockLocations.find(l => l.id === b.location_id)
    const supplier = suppliers.find(s => s.id === b.supplier_id)
    
    const isExpired = b.expiration_date && new Date(b.expiration_date) < new Date()
    
    return {
      ...b,
      product_name: product?.name || 'Desconhecido',
      location_name: location?.name || 'Desconhecido',
      supplier_name: supplier?.name || 'Desconhecido',
      is_expired: isExpired
    }
  })
  
  res.json(enriched)
})

// ========== STOCK REPORTS ==========

// GET /stock/reports/turnover - Stock turnover report
app.get('/stock/reports/turnover', ensureAuth, (req, res) => {
  const { start_date, end_date, location_id } = req.query
  
  const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const endDate = end_date ? new Date(end_date) : new Date()
  
  let movements = stockMovements.filter(m => {
    const date = new Date(m.created_at)
    return date >= startDate && date <= endDate && m.type === 'out' && m.subtype === 'sale'
  })
  
  if (location_id) {
    movements = movements.filter(m => m.location_id === parseInt(location_id, 10))
  }
  
  // Group by product
  const productStats = {}
  
  movements.forEach(m => {
    if (!productStats[m.product_id]) {
      const product = products.find(p => p.id === m.product_id)
      const avgStock = stockLevels
        .filter(l => l.product_id === m.product_id)
        .reduce((sum, l) => sum + l.quantity, 0) / 
        (stockLevels.filter(l => l.product_id === m.product_id).length || 1)
      
      productStats[m.product_id] = {
        product_id: m.product_id,
        product_name: product?.name || 'Desconhecido',
        product_sku: product?.sku || '',
        total_sold: 0,
        average_stock: avgStock,
        turnover_rate: 0,
        days_in_period: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      }
    }
    
    productStats[m.product_id].total_sold += m.quantity
  })
  
  // Calculate turnover rate
  const items = Object.values(productStats).map(stat => {
    stat.turnover_rate = stat.average_stock > 0 
      ? (stat.total_sold / stat.average_stock).toFixed(2) 
      : 0
    return stat
  })
  
  // Sort by turnover rate descending
  items.sort((a, b) => parseFloat(b.turnover_rate) - parseFloat(a.turnover_rate))
  
  res.json({ items, start_date: startDate.toISOString(), end_date: endDate.toISOString() })
})

// GET /stock/reports/top-sellers - Top selling products
app.get('/stock/reports/top-sellers', ensureAuth, (req, res) => {
  const { start_date, end_date, location_id, limit = 10 } = req.query
  
  const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const endDate = end_date ? new Date(end_date) : new Date()
  
  let movements = stockMovements.filter(m => {
    const date = new Date(m.created_at)
    return date >= startDate && date <= endDate && m.type === 'out' && m.subtype === 'sale'
  })
  
  if (location_id) {
    movements = movements.filter(m => m.location_id === parseInt(location_id, 10))
  }
  
  // Group by product
  const productStats = {}
  
  movements.forEach(m => {
    if (!productStats[m.product_id]) {
      const product = products.find(p => p.id === m.product_id)
      productStats[m.product_id] = {
        product_id: m.product_id,
        product_name: product?.name || 'Desconhecido',
        product_sku: product?.sku || '',
        category: product?.category || '',
        quantity_sold: 0,
        revenue: 0,
        profit: 0
      }
    }
    
    productStats[m.product_id].quantity_sold += m.quantity
    const product = products.find(p => p.id === m.product_id)
    const salePrice = product?.prices?.sale || 0
    productStats[m.product_id].revenue += m.quantity * salePrice
    productStats[m.product_id].profit += m.quantity * (salePrice - (m.unit_cost || 0))
  })
  
  const items = Object.values(productStats)
  items.sort((a, b) => b.quantity_sold - a.quantity_sold)
  
  const limitNum = Math.min(parseInt(limit, 10), items.length)
  
  res.json({ 
    items: items.slice(0, limitNum), 
    start_date: startDate.toISOString(), 
    end_date: endDate.toISOString() 
  })
})

// GET /stock/reports/slow-movers - Slow moving / stagnant products
app.get('/stock/reports/slow-movers', ensureAuth, (req, res) => {
  const { days = 30, location_id } = req.query
  
  const daysNum = parseInt(days, 10)
  const cutoffDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000)
  
  // Get products with stock but no sales in period
  let levels = stockLevels.filter(l => l.quantity > 0)
  
  if (location_id) {
    levels = levels.filter(l => l.location_id === parseInt(location_id, 10))
  }
  
  const slowMovers = []
  
  levels.forEach(level => {
    const recentSales = stockMovements.filter(m => 
      m.product_id === level.product_id &&
      m.location_id === level.location_id &&
      m.type === 'out' &&
      m.subtype === 'sale' &&
      new Date(m.created_at) >= cutoffDate
    )
    
    if (recentSales.length === 0) {
      const product = products.find(p => p.id === level.product_id)
      const location = stockLocations.find(l => l.id === level.location_id)
      
      // Calculate days since last movement
      const lastMovement = stockMovements
        .filter(m => m.product_id === level.product_id && m.location_id === level.location_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      
      const daysSinceMovement = lastMovement 
        ? Math.floor((Date.now() - new Date(lastMovement.created_at)) / (1000 * 60 * 60 * 24))
        : 999
      
      slowMovers.push({
        product_id: level.product_id,
        product_name: product?.name || 'Desconhecido',
        product_sku: product?.sku || '',
        location_id: level.location_id,
        location_name: location?.name || 'Desconhecido',
        quantity: level.quantity,
        value_at_cost: level.quantity * (product?.prices?.wholesale || 0),
        value_at_sale: level.quantity * (product?.prices?.sale || 0),
        days_without_movement: daysSinceMovement,
        last_movement_date: lastMovement?.created_at || null
      })
    }
  })
  
  // Sort by days without movement descending
  slowMovers.sort((a, b) => b.days_without_movement - a.days_without_movement)
  
  res.json({ items: slowMovers, period_days: daysNum })
})

// GET /stock/reports/profit-margin - Profit margin by product
app.get('/stock/reports/profit-margin', ensureAuth, (req, res) => {
  const items = products.map(p => {
    const salePrice = p.prices?.sale || 0
    const wholesalePrice = p.prices?.wholesale || 0
    const profit = salePrice - wholesalePrice
    const marginPercent = salePrice > 0 ? ((profit / salePrice) * 100).toFixed(2) : 0
    
    const totalStock = stockLevels
      .filter(l => l.product_id === p.id)
      .reduce((sum, l) => sum + l.quantity, 0)
    
    return {
      product_id: p.id,
      product_name: p.name,
      product_sku: p.sku,
      category: p.category,
      sale_price: salePrice,
      cost_price: wholesalePrice,
      profit_per_unit: profit,
      margin_percent: parseFloat(marginPercent),
      current_stock: totalStock,
      potential_profit: profit * totalStock
    }
  })
  
  // Sort by margin percent descending
  items.sort((a, b) => b.margin_percent - a.margin_percent)
  
  res.json({ items })
})

// GET /stock/reports/stockout - Products out of stock or critical
app.get('/stock/reports/stockout', ensureAuth, (req, res) => {
  const { location_id } = req.query
  
  let levels = stockLevels.slice()
  
  if (location_id) {
    levels = levels.filter(l => l.location_id === parseInt(location_id, 10))
  }
  
  const critical = levels.filter(l => l.quantity <= 0 || l.quantity < l.min_stock)
  
  const items = critical.map(level => {
    const product = products.find(p => p.id === level.product_id)
    const location = stockLocations.find(l => l.id === level.location_id)
    
    let status = 'low'
    if (level.quantity <= 0) status = 'out_of_stock'
    
    return {
      product_id: level.product_id,
      product_name: product?.name || 'Desconhecido',
      product_sku: product?.sku || '',
      location_id: level.location_id,
      location_name: location?.name || 'Desconhecido',
      current_quantity: level.quantity,
      min_stock: level.min_stock,
      status,
      reorder_quantity: Math.max(0, level.max_stock - level.quantity)
    }
  })
  
  // Sort by status (out first) and then by quantity
  items.sort((a, b) => {
    if (a.status === 'out_of_stock' && b.status !== 'out_of_stock') return -1
    if (a.status !== 'out_of_stock' && b.status === 'out_of_stock') return 1
    return a.current_quantity - b.current_quantity
  })
  
  res.json({ items })
})

// GET /stock/reports/audit - Audit trail of movements
app.get('/stock/reports/audit', ensureAuth, (req, res) => {
  const { start_date, end_date, product_id, location_id, created_by } = req.query
  
  let movements = stockMovements.slice()
  
  if (start_date) {
    movements = movements.filter(m => m.created_at >= start_date)
  }
  
  if (end_date) {
    movements = movements.filter(m => m.created_at <= end_date)
  }
  
  if (product_id) {
    movements = movements.filter(m => m.product_id === parseInt(product_id, 10))
  }
  
  if (location_id) {
    movements = movements.filter(m => m.location_id === parseInt(location_id, 10))
  }
  
  if (created_by) {
    movements = movements.filter(m => m.created_by === created_by)
  }
  
  // Enrich with full details
  const items = movements.map(m => {
    const product = products.find(p => p.id === m.product_id)
    const location = stockLocations.find(l => l.id === m.location_id)
    
    return {
      ...m,
      product_name: product?.name || 'Desconhecido',
      product_sku: product?.sku || '',
      location_name: location?.name || 'Desconhecido',
      direction: m.type === 'in' ? 'Entrada' : 'Saída'
    }
  })
  
  // Sort by date descending
  items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  // Summary stats
  const summary = {
    total_movements: items.length,
    total_in: items.filter(i => i.type === 'in').reduce((sum, i) => sum + i.quantity, 0),
    total_out: items.filter(i => i.type === 'out').reduce((sum, i) => sum + i.quantity, 0),
    total_value_in: items.filter(i => i.type === 'in').reduce((sum, i) => sum + i.total_cost, 0),
    total_value_out: items.filter(i => i.type === 'out').reduce((sum, i) => sum + i.total_cost, 0)
  }
  
  res.json({ items, summary })
})

// ==================== FINANCIAL MODULE ====================

// Suppliers
app.get('/suppliers', (req, res) => {
  res.json({ items: suppliers })
})

app.post('/suppliers', ensureAuth, verifyCsrf, (req, res) => {
  const { name, cnpj, email, phone, address, city, state } = req.body
  if (!name || !cnpj) return res.status(400).json({ error: 'Nome e CNPJ obrigatórios' })
  
  const newSupplier = {
    id: Math.max(...suppliers.map(s => s.id), 0) + 1,
    name, cnpj, email, phone, address, city, state,
    active: true,
    created_at: new Date().toISOString()
  }
  suppliers.push(newSupplier)
  res.status(201).json(newSupplier)
})

// Accounts Payable
app.get('/financial/accounts-payable', (req, res) => {
  const { status, page = 1, limit = 10 } = req.query
  let items = accountsPayable
  
  if (status) items = items.filter(a => a.status === status)
  
  const total = items.length
  const start = (page - 1) * limit
  const paged = items.slice(start, start + limit)
  
  res.json({ items: paged, total, page: parseInt(page), limit: parseInt(limit) })
})

app.post('/financial/accounts-payable', ensureAuth, verifyCsrf, (req, res) => {
  const { supplier_id, invoice_number, amount, due_date, payment_method, description } = req.body
  if (!supplier_id || !amount || !due_date) return res.status(400).json({ error: 'Campos obrigatórios faltando' })
  
  const supplier = suppliers.find(s => s.id === supplier_id)
  const newPayable = {
    id: Math.max(...accountsPayable.map(a => a.id), 0) + 1,
    supplier_id,
    supplier_name: supplier?.name || 'Desconhecido',
    invoice_number,
    amount: parseFloat(amount),
    due_date,
    status: 'pending',
    payment_method,
    description,
    created_at: new Date().toISOString(),
    paid_at: null,
    notes: ''
  }
  accountsPayable.push(newPayable)
  res.status(201).json(newPayable)
})

app.put('/financial/accounts-payable/:id/pay', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id)
  const item = accountsPayable.find(a => a.id === id)
  if (!item) return res.status(404).json({ error: 'Conta a pagar não encontrada' })
  
  item.status = 'paid'
  item.paid_at = new Date().toISOString()
  res.json(item)
})

// Accounts Receivable
app.get('/financial/accounts-receivable', (req, res) => {
  const { status, page = 1, limit = 10 } = req.query
  let items = accountsReceivable
  
  if (status) items = items.filter(a => a.status === status)
  
  const total = items.length
  const start = (page - 1) * limit
  const paged = items.slice(start, start + limit)
  
  res.json({ items: paged, total, page: parseInt(page), limit: parseInt(limit) })
})

app.post('/financial/accounts-receivable', ensureAuth, verifyCsrf, (req, res) => {
  const { customer_name, amount, due_date, payment_method, description, installments = 1 } = req.body
  if (!customer_name || !amount || !due_date) return res.status(400).json({ error: 'Campos obrigatórios faltando' })
  
  const newReceivable = {
    id: Math.max(...accountsReceivable.map(a => a.id), 0) + 1,
    customer_id: null,
    customer_name,
    sale_date: new Date().toISOString().split('T')[0],
    amount: parseFloat(amount),
    due_date,
    status: 'pending',
    installments: parseInt(installments),
    current_installment: 1,
    payment_method,
    description,
    created_at: new Date().toISOString(),
    paid_at: null,
    received_at: null,
    notes: ''
  }
  accountsReceivable.push(newReceivable)
  res.status(201).json(newReceivable)
})

app.put('/financial/accounts-receivable/:id/receive', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id)
  const item = accountsReceivable.find(a => a.id === id)
  if (!item) return res.status(404).json({ error: 'Conta a receber não encontrada' })
  
  item.status = 'received'
  item.received_at = new Date().toISOString()
  res.json(item)
})

// Cash Boxes
app.get('/financial/cash-boxes', (req, res) => {
  res.json({ items: cashBoxes })
})

app.get('/financial/cash-boxes/:id/balance', (req, res) => {
  const id = parseInt(req.params.id)
  const box = cashBoxes.find(c => c.id === id)
  if (!box) return res.status(404).json({ error: 'Caixa não encontrada' })
  
  const movements = cashMovements.filter(m => m.cash_box_id === id)
  const balance = box.balance
  
  res.json({ box, movements, balance })
})

// Cash Movements
app.post('/financial/cash-movements', ensureAuth, verifyCsrf, (req, res) => {
  const { cash_box_id, type, category, amount, description, reference } = req.body
  if (!cash_box_id || !type || !amount) return res.status(400).json({ error: 'Campos obrigatórios' })
  
  const newMovement = {
    id: Math.max(...cashMovements.map(m => m.id), 0) + 1,
    cash_box_id: parseInt(cash_box_id),
    type,
    category,
    amount: parseFloat(amount),
    description,
    reference,
    created_at: new Date().toISOString(),
    created_by: req.user?.username || 'admin'
  }
  
  // Update cash box balance
  const box = cashBoxes.find(c => c.id === newMovement.cash_box_id)
  if (box) {
    if (type === 'entry') box.balance += newMovement.amount
    else if (type === 'exit' || type === 'transfer') box.balance -= newMovement.amount
  }
  
  cashMovements.push(newMovement)
  res.status(201).json(newMovement)
})

// Cash Flow Forecast
app.get('/financial/cash-flow', (req, res) => {
  const pendingPayables = accountsPayable
    .filter(a => a.status === 'pending' || a.status === 'overdue')
    .reduce((sum, a) => sum + a.amount, 0)
  
  const pendingReceivables = accountsReceivable
    .filter(a => a.status === 'pending' || a.status === 'overdue')
    .reduce((sum, a) => sum + a.amount, 0)
  
  const totalBalance = cashBoxes.reduce((sum, c) => sum + c.balance, 0)
  
  res.json({
    cash_flow: cashFlowForecast,
    total_balance: totalBalance,
    pending_payables: pendingPayables,
    pending_receivables: pendingReceivables,
    net_flow: pendingReceivables - pendingPayables
  })
})

// Financial Dashboard / Reports
app.get('/financial/dashboard', (req, res) => {
  const totalPayable = accountsPayable.reduce((sum, a) => sum + a.amount, 0)
  const totalReceivable = accountsReceivable.reduce((sum, a) => sum + a.amount, 0)
  const overduPayables = accountsPayable.filter(a => a.status === 'overdue').reduce((sum, a) => sum + a.amount, 0)
  const overdueReceivables = accountsReceivable.filter(a => a.status === 'overdue').reduce((sum, a) => sum + a.amount, 0)
  const totalBalance = cashBoxes.reduce((sum, c) => sum + c.balance, 0)
  
  const dailyMovements = cashMovements
    .filter(m => {
      const today = new Date().toISOString().split('T')[0]
      return m.created_at.startsWith(today)
    })
    .reduce((acc, m) => {
      const type = m.type === 'entry' ? 'entries' : 'exits'
      acc[type] = (acc[type] || 0) + m.amount
      return acc
    }, {})
  
  res.json({
    summary: {
      total_payable: totalPayable,
      total_receivable: totalReceivable,
      overdue_payables: overduPayables,
      overdue_receivables: overdueReceivables,
      total_balance: totalBalance,
      daily_entries: dailyMovements.entries || 0,
      daily_exits: dailyMovements.exits || 0
    },
    pending_payables: accountsPayable.filter(a => a.status === 'pending' || a.status === 'overdue').slice(0, 5),
    pending_receivables: accountsReceivable.filter(a => a.status === 'pending' || a.status === 'overdue').slice(0, 5)
  })
})

// Financial Reports - DRE
app.get('/financial/reports/dre', (req, res) => {
  const totalSales = accountsReceivable.filter(a => a.status === 'received').reduce((sum, a) => sum + a.amount, 0)
  const totalCosts = accountsPayable.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.amount, 0)
  const profit = totalSales - totalCosts
  const margin = totalSales > 0 ? ((profit / totalSales) * 100) : 0
  
  res.json({
    revenue: totalSales,
    costs: totalCosts,
    profit,
    margin: parseFloat(margin.toFixed(2)),
    type: 'DRE Simplificado'
  })
})

// Financial Reports - By Category
app.get('/financial/reports/by-category', (req, res) => {
  // Agrupar produtos por categoria
  const categoryStats = {}
  
  products.forEach(product => {
    const cat = product.category || 'Sem Categoria'
    if (!categoryStats[cat]) {
      categoryStats[cat] = {
        category: cat,
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        avgPrice: 0,
      }
    }
    
    categoryStats[cat].totalProducts++
    categoryStats[cat].totalStock += product.stock || 0
    categoryStats[cat].totalValue += (product.prices?.sale || 0) * (product.stock || 0)
  })
  
  // Calcular médias e ordenar por valor
  const results = Object.values(categoryStats).map(cat => ({
    ...cat,
    avgPrice: cat.totalProducts > 0 ? cat.totalValue / cat.totalStock : 0,
    margin: 0, // Pode ser calculado com dados de custo real
  })).sort((a, b) => b.totalValue - a.totalValue)
  
  res.json({ items: results })
})

// Financial Reports - By Product
app.get('/financial/reports/by-product', (req, res) => {
  const limit = parseInt(req.query.limit || '20', 10)
  
  // Top produtos por valor em estoque
  const productStats = products.map(product => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    brand: product.brand,
    stock: product.stock || 0,
    price: product.prices?.sale || 0,
    totalValue: (product.prices?.sale || 0) * (product.stock || 0),
    margin: 0, // Pode ser calculado se houver preço de custo
  })).sort((a, b) => b.totalValue - a.totalValue)
  
  res.json({ items: productStats.slice(0, limit) })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock Express server listening on http://localhost:${PORT}`)
})
