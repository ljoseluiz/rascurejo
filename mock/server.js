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
app.use(cors({ origin: 'http://localhost:5173', credentials: true, allowedHeaders: ['Content-Type', 'X-CSRF-Token'] }))
app.use(bodyParser.json())
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

// auth endpoint
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ sub: user.id, username: user.username }, SECRET, { expiresIn: '2h' })
  
  // set httpOnly session cookie and attach CSRF token to session
  req.session.userId = user.id
  const csrf = Math.random().toString(36).slice(2)
  req.session.csrfToken = csrf
  
  res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax' })
  res.json({ user: { id: user.id, username: user.username, name: user.name }, csrfToken: csrf })
})// middleware to protect routes
function ensureAuth(req, res, next) {
  // Accept token from Authorization header or httpOnly cookie
  const auth = req.headers.authorization || ''
  const parts = auth.split(' ')
  let token = null
  if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1]
  if (!token && req.cookies && req.cookies.auth_token) token = req.cookies.auth_token
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const decoded = jwt.verify(token, SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// CSRF protection middleware for state-changing requests
function verifyCsrf(req, res, next) {
  const method = (req.method || '').toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next()
  const header = req.get('X-CSRF-Token') || req.get('x-csrf-token')
  const expected = (req.session && req.session.csrfToken)
  if (!header || !expected || header !== expected) {
    return res.status(403).json({ error: 'CSRF token missing or invalid' })
  }
  return next()
}

// public products endpoint with pagination and filtering
app.get('/products', (req, res) => {
  // query: q, page, limit
  const q = (req.query.q || '').toLowerCase()
  const page = Math.max(1, parseInt(req.query.page || '1', 10))
  const limit = Math.max(1, parseInt(req.query.limit || '10', 10))

  let filtered = products.slice()
  if (q) {
    filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
  }
  const total = filtered.length
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit)

  res.json({ items, total, page, limit })
})

// protected inventory endpoint (example)
app.get('/inventory', ensureAuth, (req, res) => {
  // simple derived data
  const inventory = products.map(p => ({ id: p.id, sku: p.sku, stock: Math.floor(Math.random() * 100) }))
  res.json({ items: inventory })
})

// protected sales endpoint (example)
app.get('/sales', ensureAuth, (req, res) => {
  const sales = [
    { id: 1, amount: 129.9, date: new Date().toISOString() },
    { id: 2, amount: 59.5, date: new Date().toISOString() }
  ]
  res.json({ items: sales })
})

// simple admin endpoint to add a product (protected)
app.post('/products', ensureAuth, verifyCsrf, (req, res) => {
  const body = req.body || {}
  const id = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1
  const product = { id, name: body.name || 'Unnamed', sku: body.sku || `SKU-${id}`, price: body.price || 0 }
  products.push(product)
  res.status(201).json(product)
})

// Update product
app.put('/products/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const product = products.find(p => p.id === id)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  
  const body = req.body || {}
  if (body.name) product.name = body.name
  if (body.sku) product.sku = body.sku
  if (body.price !== undefined) product.price = body.price
  
  res.json(product)
})

// Delete product
app.delete('/products/:id', ensureAuth, verifyCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Product not found' })
  
  const deleted = products.splice(idx, 1)
  res.json(deleted[0])
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock Express server listening on http://localhost:${PORT}`)
})

// endpoint to return current user based on cookie token
app.get('/auth/me', (req, res) => {
  let token = null
  const auth = req.headers.authorization || ''
  const parts = auth.split(' ')
  if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1]
  if (!token && req.cookies && req.cookies.auth_token) token = req.cookies.auth_token
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const decoded = jwt.verify(token, SECRET)
    const user = users.find(u => u.id === decoded.sub)
    if (!user) return res.status(401).json({ error: 'User not found' })
    res.json({ user: { id: user.id, username: user.username, name: user.name } })
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
})

// endpoint to get current session CSRF token
app.get('/auth/csrf', (req, res) => {
  if (!req.session || !req.session.csrfToken) {
    return res.status(401).json({ error: 'No session or CSRF token' })
  }
  res.json({ csrfToken: req.session.csrfToken })
})

// logout clears the cookie
app.post('/auth/logout', (req, res) => {
  res.clearCookie('auth_token')
  res.json({ ok: true })
})

// dashboard stats endpoint
app.get('/stats', ensureAuth, (req, res) => {
  const totalProducts = products.length
  const totalSales = Math.floor(Math.random() * 50000) + 10000 // mock data
  const totalCustomers = Math.floor(Math.random() * 500) + 50 // mock data
  const recentSales = [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1200 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1900 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1600 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2100 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2200 },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2800 },
    { date: new Date().toISOString().split('T')[0], amount: 3200 }
  ]
  res.json({ totalProducts, totalSales, totalCustomers, recentSales })
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
