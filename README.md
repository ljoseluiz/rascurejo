# 🏪 Varejix — Sistema de Gestão Varejista

[![GitHub](https://img.shields.io/badge/GitHub-cristovao--pereira%2Fvarejix-blue)](https://github.com/cristovao-pereira/varejix)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()

Aplicação web **completa e production-ready** para gestão de varejo com React 18 + Vite + Express mock backend. Inclui autenticação, proteção CSRF, módulo financeiro, gestão de estoque, produtos com unidades de medida e testes E2E.

---

## 🚀 Quick Start (5 minutos)

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```powershell
# Clone o repositório
git clone https://github.com/cristovao-pereira/varejix.git
cd varejix

# Instale dependências
npm install
```

### Desenvolvimento (2 terminais)

**Terminal 1 - Backend Mock:**
```powershell
npm run mock:express:watch
# Servidor rodando em http://localhost:3000
```

**Terminal 2 - Frontend Dev:**
```powershell
npm run dev
# Aplicação em http://localhost:5173
```

### Login Padrão
```
Usuário: admin
Senha: password
```

---

## 📦 Funcionalidades Principais

### ✅ **Autenticação & Segurança**
- JWT tokens com 2 horas de expiração
- Cookies httpOnly seguros
- Proteção CSRF com tokens em sessão
- Context API para estado global de auth
- Rotas protegidas com redirect automático

### ✅ **Módulo de Produtos**
- CRUD completo (criar, editar, deletar, listar)
- Unidades de medida pré-definidas (15 opções)
- Categorias, marcas, fornecedores
- Variações de produtos (cor, tamanho, etc)
- Histórico de alterações
- Filtros avançados (categoria, marca, unidade, status)
- Busca por nome/SKU
- Paginação
- Visualização em Grid e Tabela
- Importação de imagens

### ✅ **Módulo Financeiro**
- **Contas a Pagar**: criar, filtrar, marcar como pago
- **Contas a Receber**: criar, filtrar, marcar como recebido
- **Caixa**: registrar entradas/saídas/transferências
- **Fluxo de Caixa**: previsão D+0, D+30, D+60 com cenários
- **Relatórios**: DRE, Posição Financeira, Indicadores de saúde
- **Dashboard**: KPIs, movimentação diária, contas vencidas
- **Indicador de Equilíbrio Financeiro**: faturamento × despesas

### ✅ **Módulo de Estoque** (Stock Module)
- Localidades de estoque (múltiplos armazéns)
- Movimentações (entrada, saída, transferência, ajuste)
- Níveis de estoque com alertas
- Lotes com validade
- Rastreabilidade completa
- Dashboard com alertas de baixo estoque

### ✅ **Dashboard & Relatórios**
- KPIs: vendas, produtos, clientes
- Gráficos interativos (Recharts)
- Relatórios com filtros por período
- Exportação de dados em CSV
- Indicadores de saúde financeira

### ✅ **UI/UX**
- Chakra UI com temas responsivos
- Framer Motion para animações
- Layout com Header + Sidebar
- Menu hierárquico (Financial, Inventory, Products)
- Badges e status colors
- Feedback com toast notifications

### ✅ **Testes**
- 9 testes E2E com Playwright
- Cobertura: login, CRUD, API, CSRF, navegação
- Testes manuais documentados

---

## 📂 Estrutura de Pastas

```
varejix/
├── src/
│   ├── components/              # Componentes reutilizáveis
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ProductForm.jsx      # Formulário de produtos
│   │   ├── ProductCard.jsx
│   │   ├── ProductVariations.jsx
│   │   └── PriceSettings.jsx
│   ├── context/
│   │   └── AuthContext.jsx      # Estado global (user, CSRF token)
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx         # Listagem simples
│   │   ├── ProductsAdvanced.jsx # Listagem com filtros avançados
│   │   ├── Inventory.jsx
│   │   ├── Reports.jsx
│   │   ├── Sales.jsx
│   │   ├── FinancialDashboard.jsx
│   │   ├── AccountsPayable.jsx
│   │   ├── AccountsReceivable.jsx
│   │   ├── CashBox.jsx
│   │   ├── CashFlow.jsx
│   │   ├── FinancialReports.jsx
│   │   └── NotFound.jsx
│   ├── routes/
│   │   ├── AppRoutes.jsx        # Configuração de todas as rotas
│   │   └── RequireAuth.jsx      # HOC para proteção de rotas
│   ├── services/
│   │   └── api.js               # Cliente HTTP com CSRF
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── mock/
│   └── server.js                # Express mock com 20+ endpoints
├── e2e/
│   ├── auth-and-products.spec.js
│   └── financial-module.spec.js
├── db.json                      # Database JSON
├── package.json
├── vite.config.js               # Configuração do proxy Vite
├── playwright.config.js
└── README.md
```

---

## 🔌 Endpoints da API

### Autenticação
```
POST   /auth/login               # { username, password }
GET    /auth/me                  # Retorna user atual
GET    /auth/csrf                # Retorna CSRF token
POST   /auth/logout              # Limpa sessão
```

### Produtos
```
GET    /products?q=&category=&brand=&unit=&active=&page=1&limit=10
GET    /products/:id
POST   /products                 # [AUTH + CSRF]
PUT    /products/:id             # [AUTH + CSRF]
DELETE /products/:id             # [AUTH + CSRF]

GET    /products/categories
GET    /products/brands
GET    /products/suppliers
GET    /products/units           # Lista 15 unidades padrão
```

### Estoque
```
GET    /stock/locations
GET    /stock/levels
POST   /stock/movements          # [AUTH + CSRF]
GET    /stock/batches
GET    /stock/alerts
```

### Financeiro
```
GET    /suppliers
GET    /financial/accounts-payable?status=&page=1&limit=10
POST   /financial/accounts-payable # [AUTH + CSRF]
PUT    /financial/accounts-payable/:id/pay # [AUTH + CSRF]

GET    /financial/accounts-receivable?status=&page=1&limit=10
POST   /financial/accounts-receivable # [AUTH + CSRF]
PUT    /financial/accounts-receivable/:id/receive # [AUTH + CSRF]

GET    /financial/cash-boxes
GET    /financial/cash-boxes/:id/balance
POST   /financial/cash-movements # [AUTH + CSRF]

GET    /financial/cash-flow
GET    /financial/dashboard
GET    /financial/reports/dre
```

### Dashboard
```
GET    /stats                    # KPIs gerais
GET    /reports/sales            # Com filtro de data
```

---

## 🔐 Autenticação & Segurança

### Fluxo de Auth
```
1. Usuário faz login (POST /auth/login)
2. Backend valida credenciais
3. Gera JWT + httpOnly cookie de sessão
4. GET /auth/csrf pega token CSRF
5. Frontend armazena CSRF no context
6. Cada POST/PUT/DELETE injeta CSRF header
7. Backend valida token antes de processar
```

### Proteção CSRF
```javascript
// Frontend (api.js)
const opts = api.injectCsrf({}, csrfToken)
await api.post('/products', data, opts)
// Adiciona header: X-CSRF-Token

// Backend (server.js)
app.post('/products', verifyCsrf, (req, res) => {
  // Valida token na sessão
})
```

### Variáveis de Ambiente (Opcional)
```env
# .env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 🧪 Testes E2E

### Roda todos os testes
```powershell
npx playwright test
```

### Modo interativo
```powershell
npx playwright test --ui
```

### Testes específicos
```powershell
npx playwright test financial-module.spec.js
npx playwright test --grep "Accounts Payable"
```

### Debug
```powershell
npx playwright test --debug
```

**Cobertura:**
- ✅ Login/Logout
- ✅ Criar/Editar/Deletar produtos
- ✅ Filtros e busca
- ✅ Paginação
- ✅ Proteção CSRF
- ✅ Módulo financeiro completo
- ✅ Menu e navegação

---

## 🛠️ Scripts NPM

```powershell
# Desenvolvimento
npm run dev                    # Vite dev server
npm run mock:express:watch    # Backend com auto-reload
npm run build                 # Build de produção
npm run preview               # Preview do build

# Testes
npx playwright test           # Testes headless
npx playwright test --ui      # Testes com UI
npx playwright install        # Instalar browsers

# Linting & Formatting
npm run lint                  # ESLint (se configurado)
npm run format                # Prettier (se configurado)
```

---

## 🎨 Stack Técnico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React | 18.2 |
| **Build** | Vite | 5.x |
| **Router** | React Router | 6.x |
| **UI Components** | Chakra UI | 2.8 |
| **Animações** | Framer Motion | 10.x |
| **Gráficos** | Recharts | 2.10 |
| **Forms** | React Hook Form + Zod | ^7.x |
| **Backend** | Express | 4.18 |
| **Auth** | jsonwebtoken | 9.x |
| **Sessions** | express-session | 1.17 |
| **CORS** | cors | 2.8 |
| **Testes** | Playwright | 1.40 |

---

## 📊 Banco de Dados

Usa `db.json` com estrutura normalizada:

```json
{
  "products": [],
  "categories": [],
  "brands": [],
  "suppliers": [],
  "stock_locations": [],
  "stock_movements": [],
  "stock_batches": [],
  "stock_alerts": [],
  "accounts_payable": [],
  "accounts_receivable": [],
  "cash_boxes": [],
  "cash_movements": [],
  "cash_flow_forecast": []
}
```

Para produção, recomenda-se migrar para PostgreSQL/MongoDB com backend em Node.js real.

---

## 🚀 Deploy

### Frontend (Vercel/Netlify)
```bash
npm run build
# Fazer upload da pasta `dist/`
```

### Backend (Render/Fly.io/AWS)
```bash
# mock/server.js escala para backend real em produção
```

### Variáveis de Ambiente (Produção)
```env
VITE_API_BASE_URL=https://api.varejix.com
PORT=3000
NODE_ENV=production
SESSION_SECRET=seu-secret-muito-seguro
MOCK_JWT_SECRET=seu-jwt-secret
```

---

## 📚 Documentação Completa

- **[Módulo Financeiro](./docs/MODULO_FINANCEIRO.md)** - Detalhes de endpoints e fluxos
- **[Testes E2E](./TESTING_FINANCIAL_MODULE.md)** - Guia completo de testes
- **[Unidades de Medida](./FEATURE_UNITS_SUMMARY.md)** - Feature nova de produtos

---

## 🐛 Troubleshooting

### "Cannot find module"
```powershell
npm install
```

### Backend não inicia
```powershell
# Verificar se porta 3000 está livre
netstat -ano | findstr :3000
# Matar processo se necessário
taskkill /PID <PID> /F
```

### CORS errors
- Verifique `vite.config.js` proxy
- Backend deve ter `cors` e `credentials: true`

### CSRF token not found
- Recarregue a página (F5)
- Verifique console para erros

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

## 👤 Autor

**Cristóvão Pereira**
- GitHub: [@cristovao-pereira](https://github.com/cristovao-pereira)
- Repositório: [varejix](https://github.com/cristovao-pereira/varejix)

---

## 🎯 Status & Roadmap

### ✅ Concluído
- [x] Autenticação com JWT + CSRF
- [x] CRUD de Produtos
- [x] Módulo Financeiro
- [x] Módulo de Estoque
- [x] Dashboard & Relatórios
- [x] Testes E2E
- [x] Unidades de Medida
- [x] UI responsiva

### 🔄 Em Desenvolvimento
- [ ] Integração com Stripe/PayPal
- [ ] Módulo de Vendas (POS)
- [ ] Relatórios avançados (BI)

### 📋 Planejado
- [ ] Autenticação OAuth (Google, GitHub)
- [ ] Mobile app (React Native)
- [ ] Real-time updates (WebSocket)
- [ ] Backup automático

---

**Última atualização:** 2025-12-05  
**Versão:** 2.0  
**Status:** 🟢 Production Ready

