const ENV_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const MODE = import.meta.env.MODE || 'development'

function buildUrl(path) {
  const p = path || ''
  if (p.startsWith('http')) return p

  // If a base is configured, use it (production or explicit dev base)
  if (ENV_BASE) {
    return `${ENV_BASE}${p.startsWith('/') ? '' : '/'}${p}`
  }

  // No base configured: in development, route through the Vite proxy at `/api`
  // so fetch('/api/products') -> proxied to the mock/backend.
  if (MODE === 'development') {
    return `/api${p.startsWith('/') ? '' : '/'}${p}`
  }

  // Fallback: relative path
  return p
}

async function request(method, path, body, opts = {}) {
  const url = buildUrl(path)
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {})
  const fetchOpts = {
    method,
    headers,
    // include credentials so httpOnly cookies are sent to the backend
    credentials: 'include',
    ...opts
  }
  if (body !== undefined && body !== null) fetchOpts.body = JSON.stringify(body)

  const res = await fetch(url, fetchOpts)
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`HTTP ${res.status}: ${text}`)
    err.status = res.status
    throw err
  }
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

// wrapper to include CSRF token header for state-changing requests
const originalGet = (path, opts) => request('GET', path, undefined, opts)
const originalPost = (path, body, opts) => {
  const headers = Object.assign({}, (opts && opts.headers) || {})
  // CSRF will be injected by a wrapper component if needed
  return request('POST', path, body, Object.assign({}, opts || {}, { headers }))
}
const originalPut = (path, body, opts) => {
  const headers = Object.assign({}, (opts && opts.headers) || {})
  return request('PUT', path, body, Object.assign({}, opts || {}, { headers }))
}
const originalDelete = (path, body, opts) => {
  const headers = Object.assign({}, (opts && opts.headers) || {})
  return request('DELETE', path, body, Object.assign({}, opts || {}, { headers }))
}

// helper to inject CSRF from context
function injectCsrf(opts, csrfToken) {
  if (!csrfToken) return opts
  const headers = Object.assign({}, (opts && opts.headers) || {})
  headers['X-CSRF-Token'] = csrfToken
  return Object.assign({}, opts || {}, { headers })
}

export default {
  get: (path, opts) => originalGet(path, opts),
  post: (path, body, opts) => originalPost(path, body, opts),
  put: (path, body, opts) => originalPut(path, body, opts),
  delete: (path, body, opts) => originalDelete(path, body, opts),
  rawRequest: request,
  injectCsrf
}
