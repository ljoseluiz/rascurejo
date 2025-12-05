const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)

const app = express()
const PORT = process.env.PORT || 3000
const SECRET = process.env.MOCK_JWT_SECRET || 'dev-secret'

// Allow requests from the Vite dev server and include credentials (cookies)
app.use(cors({ 
  origin: 'http://localhost:5173', 
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
const db = require('../db.json')
let products = Array.isArray(db.products) ? db.products.slice() : []

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
  const categories = ['Roupas', 'Calçados', 'Acessórios', 'Alimentos']
  res.json(categories)
})

// GET /products/brands - Listar marcas (strings)
app.get('/products/brands', (req, res) => {
  const brands = [...new Set(products.map(p => p.brand))].filter(Boolean)
  res.json(brands)
})

// GET /products/suppliers - Listar fornecedores (strings)
app.get('/products/suppliers', (req, res) => {
  const suppliers = ['Fornecedor A', 'Fornecedor B', 'Fornecedor C']
  res.json(suppliers)
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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock Express server listening on http://localhost:${PORT}`)
})
