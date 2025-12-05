# Varejix — Sistema de Gestão Varejista

Aplicação web completa para gestão de varejo com React + Vite (JavaScript) e backend mock Express.

## 🚀 Quick Start

```powershell
cd C:\Apps\varejix
npm install

# Terminal 1 - Backend mock
npm run mock:express:watch

# Terminal 2 - Frontend dev server
npm run dev
```

Acesse: **http://localhost:5173**  
Login: `admin` / `password`

## 📦 Funcionalidades

- ✅ Autenticação com JWT + httpOnly cookies
- ✅ Proteção CSRF (tokens em sessão)
- ✅ CRUD completo de produtos (criar, editar, deletar)
- ✅ Dashboard com gráficos (vendas, produtos, clientes)
- ✅ Relatórios com filtros e exportação CSV
- ✅ Paginação e busca de produtos
- ✅ UI com Chakra UI + animações Framer Motion
- ✅ Testes E2E com Playwright

## 🛠️ Comandos

### Desenvolvimento
- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run mock:express:watch` — Backend mock com auto-reload (http://localhost:3000)
- `npm run build` — Build de produção
- `npm run preview` — Pré-visualiza build

### Testes
- `npx playwright test` — Roda testes E2E headless
- `npx playwright test --ui` — Testes E2E com UI interativa

## 📂 Estrutura

```
src/
├── components/         # Componentes reutilizáveis
│   ├── Header.jsx
│   ├── ProductCard.jsx
│   ├── ProductForm.jsx
│   └── ProductEdit.jsx
├── context/           # Estado global (Auth, CSRF)
│   └── AuthContext.jsx
├── pages/             # Páginas/rotas
│   ├── Dashboard.jsx  # KPIs + gráficos
│   ├── Products.jsx   # Lista + CRUD
│   ├── Reports.jsx    # Relatórios com CSV
│   ├── Login.jsx
│   └── Logout.jsx
├── routes/            # Configuração de rotas
│   ├── AppRoutes.jsx
│   └── RequireAuth.jsx
├── services/          # API client
│   └── api.js
└── main.jsx           # Entry point

mock/
└── server.js          # Express mock com auth, CSRF, CRUD

e2e/
└── auth-and-products.spec.js  # Testes Playwright
```

## 🔐 Autenticação & Segurança

### Backend Mock (Express)
- **JWT tokens** com 2h de expiração
- **httpOnly cookies** para persistência segura
- **Sessões server-side** (MemoryStore) com CSRF tokens
- **CSRF protection** em POST/PUT/DELETE (token em session)

### Endpoints
```
POST   /auth/login      # { username, password } → retorna user + csrfToken
GET    /auth/me         # Retorna usuário atual (via cookie)
GET    /auth/csrf       # Retorna token CSRF (cria se não existir)
POST   /auth/logout     # Limpa cookies

GET    /products        # Paginado: ?q=termo&page=1&limit=10
POST   /products        # Cria produto (requer auth + CSRF)
PUT    /products/:id    # Atualiza (requer auth + CSRF)
DELETE /products/:id    # Deleta (requer auth + CSRF)

GET    /stats           # Dashboard: totalProducts, totalSales, recentSales
GET    /reports/sales   # Relatório: ?startDate=...&endDate=...
```

### Modo Dev (flexível)
- `ensureAuth`: permite acesso sem token (req.user = null)
- `verifyCsrf`: permite requests sem CSRF (com warning no console)

Para produção, remova os warnings e reforce validação.

## 🌐 Configuração de API

### Desenvolvimento (padrão)
Sem `.env`, o frontend usa proxy Vite: `/api/*` → `http://localhost:3000`

### Produção ou dev direto
Crie `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

Reinicie `npm run dev` após criar/editar `.env`.

## 🧪 Testes E2E

Testes incluídos:
- Login e logout
- Criação de produtos
- Edição de produtos
- Deleção com confirmação
- Busca e paginação
- Rotas protegidas (redirect)

Rodar:
```powershell
npx playwright test
```

## 🎨 Stack Técnica

**Frontend:**
- React 18.2 + Vite 5
- React Router 6
- Chakra UI 2.8 + Framer Motion 10
- Recharts 2.10 (gráficos)

**Backend Mock:**
- Express 4.18
- jsonwebtoken 9 (JWT)
- express-session 1.17 + memorystore 1.6
- cookie-parser, body-parser, cors

**Testes:**
- Playwright 1.40

## 📝 Próximos Passos

- [ ] Substituir MemoryStore por Redis (sessions persistentes)
- [ ] Adicionar gerenciamento de estoque (baixas automáticas)
- [ ] Implementar módulo de clientes
- [ ] Relatórios avançados (lucro, margem, ABC)
- [ ] Deploy: frontend (Vercel/Netlify) + backend (Render/Fly)
- [ ] Autenticação OAuth (Google, Microsoft)

## 🤝 Contribuições

Abra uma issue ou PR com propostas de melhorias.

---

**Desenvolvido por:** [cristovao-pereira](https://github.com/cristovao-pereira)  
**Repositório:** [varejix](https://github.com/cristovao-pereira/varejix)
