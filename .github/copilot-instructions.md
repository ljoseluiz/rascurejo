# Copilot Instructions: Varejix Retail Management System

**Purpose:** AI-assisted development guidance for Varejix, a **React + Vite** retail management frontend with mock Express backend.  
**Status:** Production-ready architecture with auth, CSRF protection, CRUD products, dashboards, and E2E tests.

---

## Quick Agent Checklist

Before making changes:
1. ✓ Project type: **React 18 + Vite + Express mock backend** (see `package.json`)
2. ✓ Dev environment: dual-terminal setup (frontend on `5173`, backend mock on `3000`)
3. ✓ Entry points: `src/main.jsx` → `src/App.jsx` → `src/routes/AppRoutes.jsx`
4. ✓ State: **React Context** (`AuthContext`) + **component local state**; no Redux
5. ✓ UI framework: **Chakra UI + Framer Motion**; simple CSS in `src/index.css`

---

## Essential Developer Workflows

### Startup (Two Terminals)

**Terminal 1 – Backend Mock (Express with auth, CSRF, CRUD):**
```powershell
npm run mock:express:watch
# Listens on http://localhost:3000
# Includes: auth endpoints, product CRUD, stats, reports with CSV export
```

**Terminal 2 – Frontend (Vite dev server with HMR):**
```powershell
npm run dev
# Listens on http://localhost:5173
# Vite proxy routes /api/* → http://localhost:3000 (see vite.config.js)
```

Default login: `admin` / `password`

### Build & Test

- **Production build:** `npm run build` → `dist/` (optimized with Vite)
- **Preview production locally:** `npm run preview`
- **E2E tests (Playwright):** `npx playwright test` (headless) or `npx playwright test --ui` (interactive)
- **Test file:** `e2e/auth-and-products.spec.js` — covers login, product CRUD flow

---

## Architecture: Three Key Layers

### 1. **Authentication & Security Context** (`src/context/AuthContext.jsx`)
- **Provider pattern:** wraps app, hydrates user on mount via `GET /auth/me`
- **State exposed:** `{ user, csrfToken, loading, login(), logout(), isAuthenticated }`
- **CSRF flow:** 
  - `GET /auth/csrf` fetches server-side token (stored in session)
  - Token included in all state-changing requests via `api.injectCsrf(opts, csrfToken)`
- **Cookie-based auth:** backend uses `httpOnly` cookies + JWT; frontend reads user object from hydration

**Usage in components:**
```jsx
import { useAuth } from '../context/AuthContext'
const { user, csrfToken, login, logout } = useAuth()
// inject CSRF: const opts = api.injectCsrf({}, csrfToken)
```

### 2. **Unified API Client** (`src/services/api.js`)
- **URL routing:** 
  - **Dev mode:** `/api/…` → proxied to `http://localhost:3000` (see `vite.config.js`)
  - **Prod mode:** uses `VITE_API_BASE_URL` env var or falls back to relative paths
- **Methods:** `get(path, opts)`, `post(path, body, opts)`, `put(path, body, opts)`, `delete(path, body, opts)`
- **Credentials:** `include` flag always set (sends cookies with cross-origin requests)
- **CSRF injection helper:** `injectCsrf(opts, csrfToken)` adds `X-CSRF-Token` header

**Example:**
```javascript
const data = await api.post('/products', { name: 'Widget', price: 29.99 }, 
  api.injectCsrf({}, csrfToken)
)
```

### 3. **Route Protection** (`src/routes/RequireAuth.jsx`)
- **Wrapper component:** conditionally renders children or redirects to login
- **Usage:** `<RequireAuth><Inventory /></RequireAuth>` in `AppRoutes.jsx`
- **Checks:** `auth.isAuthenticated` from context

---

## Page Data Flow Pattern

**All pages follow this structure** (see `Products.jsx`, `Dashboard.jsx`, `Reports.jsx`):

```jsx
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function ProductsPage() {
  const auth = useAuth()  // Get CSRF token
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function load() {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/products', opts)
      setItems(data.items || [])
    }
    load()
  }, [auth.csrfToken])  // Refetch if CSRF token changes
  
  // Render with Chakra UI components
}
```

**Key pattern:** `useEffect` re-runs when `auth.csrfToken` updates (security boundary).

---

## Backend Mock Endpoints & Contracts

**Base:** `http://localhost:3000` (dev) / proxied via `/api` in Vite

### Auth
- `POST /auth/login` — `{ username, password }` → `{ user, csrfToken }` (sets httpOnly cookie)
- `GET /auth/me` — Returns `{ user }` from cookie or null
- `GET /auth/csrf` — Returns `{ csrfToken }` (creates session if needed)
- `POST /auth/logout` — Clears cookie

### Products (with pagination & search)
- `GET /products?q=search&page=1&limit=10` → `{ items: [...], total: N }`
- `POST /products` — `{ name, sku, price, ... }` → `{ id, ... }` (requires auth + CSRF)
- `PUT /products/:id` — Updates product (requires auth + CSRF)
- `DELETE /products/:id` — Deletes product (requires auth + CSRF)

### Stats & Reports
- `GET /stats` → `{ totalProducts, totalSales, totalCustomers, recentSales, salesGrowth, ... }`
- `GET /reports/sales?startDate=...&endDate=...` → `{ data: [...], summary: { ... } }` (CSV export)

---

## Code Patterns & Conventions

### Components
- **Files:** `PascalCase.jsx` in `src/components/` for reusable pieces
- **Examples:** `ProductCard.jsx` (displays single item), `ProductForm.jsx` (create/edit modal)
- **Props pattern:** render component, pass `onSubmit`, `onClose` callbacks

### Pages
- **Files:** `src/pages/PageName.jsx` (route-level views)
- **Pattern:** load data in `useEffect`, manage local state, delegate editing to modal components
- **Layout:** wrapped by `<Header />` + `<Sidebar />` in `App.jsx`

### Error Handling
- **API errors:** throw with message (catch and display via Chakra `useToast()`)
- **Network errors:** logged to console; UI shows `<Text color="red">Error: {error.message}</Text>`
- **Auth errors:** caught silently on hydration; user remains null; pages redirect via `<RequireAuth>`

### Styling
- **UI framework:** Chakra UI (component props for layout, spacing, colors)
- **CSS:** `src/index.css` for global resets and utility classes
- **Animations:** Framer Motion (used in components for subtle transitions)

### Boas práticas sugeridas (opt-in)
- **Data fetching:** considerar React Query/TanStack Query para cache, revalidação e estados de loading/error padronizados.
- **Estado global:** Context atual cobre auth; se escalar, considerar Zustand para estados compartilhados complexos.
- **UI kits alternativos:** se migrar de Chakra, opções: Material UI, Tailwind, Ant Design (avaliar impacto visual).
- **Forms/validação:** React Hook Form + Zod para tipagem/validação declarativa e mensagens de erro consistentes.
- **Arquitetura:** manter separação clara de camadas (componentes → serviços → API).

---

## Dev-Specific Behavior

**Mock server in dev mode:**
- `ensureAuth` middleware allows endpoints without token for testing (sets `req.user = null`)
- `/auth/me` returns null user → triggers login redirect (by design)
- Session TTL: 2 hours; CSRF tokens regenerate per session

**Vite proxy (vite.config.js):**
```javascript
proxy: { '/api': { target: 'http://127.0.0.1:3000', cookieDomainRewrite: 'localhost' } }
```
- Strips `/api` prefix when forwarding to backend
- Rewrites cookie domain to `localhost` for cross-port requests

---

## When Adding Features

1. **New page:** create `src/pages/FeaturePage.jsx`, add route in `AppRoutes.jsx`, protect with `<RequireAuth>` if needed
2. **New API endpoint:** extend mock server in `mock/server.js`; document in this guide
3. **Auth-dependent feature:** use `useAuth()` hook, inject CSRF with `api.injectCsrf()`
4. **Modal/form:** create reusable component in `src/components/`, manage state in parent page
5. **Tests:** add to `e2e/` for critical user flows (E2E > unit tests for this UI-heavy project)

---

## Common Tasks for AI Agents

| Task | Key Files | Pattern |
|------|-----------|---------|
| Add product field | `mock/server.js` (schema), `ProductForm.jsx` (input), API call in `ProductsAdvanced.jsx` | Edit form, POST to `/products` with new field |
| Add dashboard metric | `mock/server.js` (`/stats` response), `Dashboard.jsx` (render KPI card) | Extend `/stats` endpoint, add new Chakra box |
| Create new protected page | `src/pages/NewPage.jsx`, `AppRoutes.jsx` | Follow Products page pattern; wrap route with `<RequireAuth>` |
| Fix auth flow | `AuthContext.jsx`, `api.injectCsrf()`, `mock/server.js` (CSRF check) | Trace token lifecycle: get → store → inject header → validate |
| Debug API issue | `mock/server.js` (add logging), Playwright test, browser DevTools | Backend logs in terminal; frontend logs in browser console |

---

## Módulo de Produtos - Detalhes Específicos

### Estrutura
- **Backend:** `mock/server.js` (linhas ~150-400) - endpoints `/products*`
- **Componentes:** `ProductForm.jsx`, `ProductVariations.jsx`, `PriceSettings.jsx`
- **Páginas:** `ProductsAdvanced.jsx` (listagem com filtros), `ProductDetail.jsx` (detalhes com abas)
- **Dados:** `db.json` (schema com preços, variações, histórico)
- **Documentação:** `docs/MODULO_PRODUTOS.md` (guia completo)

### Endpoints de Produtos
```
GET    /products                  # Listar com filtros: ?q=termo&category=X&brand=Y&active=true&page=1&limit=10
GET    /products/:id              # Detalhe (inclui histórico)
POST   /products                  # Criar (AUTH + CSRF)
PUT    /products/:id              # Editar (AUTH + CSRF, registra no histórico)
DELETE /products/:id              # Deletar (AUTH + CSRF)
GET    /products/categories       # Listar categorias
GET    /products/brands           # Listar marcas
GET    /products/suppliers        # Listar fornecedores
```

### Fluxo CRUD Completo
1. **Criar:** ProductForm valida → api.post('/products', data, CSRF opts) → backend cria + entry histórico
2. **Editar:** ProductsAdvanced/ProductDetail → ProductForm → api.put(':id', data, CSRF opts) → backend compara e registra alterações
3. **Deletar:** Confirmação → api.delete(':id', {}, CSRF opts) → backend remove
4. **Filtrar:** ProductsAdvanced aplica filtros → GET /products?q=...&category=...&brand=...&active=...
5. **Histórico:** ProductDetail → Aba "Histórico" mostra todas as alterações de cada campo

### Schema de Produto (db.json)
```javascript
{
  "id": 1,
  "name": "Camiseta",
  "sku": "CAM-001",
  "barcode": "7891234567890",
  "category": "Roupas",
  "subcategory": "Camisetas",
  "brand": "TechWear",
  "supplier": "Fornecedor A",
  "description": "...",
  "prices": { "sale": 29.90, "promotion": 24.90, "wholesale": 15.00 },
  "unit": "un",
  "images": [{ "id": 1, "url": "...", "alt": "..." }],
  "variations": [{ "id": 1, "type": "Cor", "value": "Branco" }],
  "active": true,
  "stock": 150,
  "createdAt": "...",
  "updatedAt": "...",
  "history": [{ "id": ..., "type": "created|updated", "field": "...", "oldValue": ..., "newValue": ..., "changedBy": "admin", "changedAt": "..." }]
}
```

### Padrões Importantes
- **Validação:** Backend valida nome, SKU (único), categoria, marca, preço venda
- **CSRF:** SEMPRE injete token em POST/PUT/DELETE: `api.injectCsrf({}, auth.csrfToken)`
- **Histórico:** Automático - cada alteração de campo cria entry com antes/depois/quem/quando
- **Filtros:** case-insensitive, suportam parciais (ex: "cami" encontra "Camiseta")
- **Paginação:** page/limit obrigatórios, retorna items + total

### Como Adicionar Campo Novo
1. **Backend:** Adicionar validação em `validateProduct()`, salvar no objeto, registrar no histórico se edição
2. **Frontend:** Adicionar input/select em `ProductForm.jsx`, adicionar à `formData` state
3. **Teste:** Criar produto → editar campo → verificar histórico mostra alteração

### Componentes Reutilizáveis
- `ProductForm` - Formulário completo (props: `product`, `onSubmit`)
- `ProductVariations` - Gerenciador de variações (props: `variations`, `onChange`)
- `PriceSettings` - 3 preços em grid (props: `prices`, `onChange`)
- `ProductCard` - Card para grid view (props: `product`, `onEdit`, `onDelete`, `onView`)
