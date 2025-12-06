# Módulo de Estoque - Arquitetura e Fluxo

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            PÁGINAS PRINCIPAIS                        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  • StockMovements.jsx    (Movimentações)            │   │
│  │  • StockLevels.jsx       (Níveis)                   │   │
│  │  • StockReports.jsx      (Relatórios x6)            │   │
│  │  • Inventory.jsx         (Consolidado)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              COMPONENTES                             │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  • StockMovementForm    (Modal de entrada)          │   │
│  │  • StockMovementTable   (Tabela)                    │   │
│  │  • StockAlertBadge      (Status visual)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           API CLIENT (services/api.js)              │   │
│  │  • GET/POST/PUT/DELETE com CSRF                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        ROTAS DE ESTOQUE (/stock/*)                  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Movements:  POST, GET, GET by filters              │   │
│  │  Levels:     GET, PUT (min/max)                     │   │
│  │  Locations:  GET, POST, PUT, DELETE                 │   │
│  │  Alerts:     GET, PUT /resolve                      │   │
│  │  Batches:    GET                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        RELATÓRIOS (/stock/reports/*)                │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  • turnover       (giro de estoque)                 │   │
│  │  • top-sellers    (mais vendidos)                   │   │
│  │  • slow-movers    (produtos parados)                │   │
│  │  • profit-margin  (margem de lucro)                 │   │
│  │  • stockout       (ruptura de estoque)              │   │
│  │  • audit          (auditoria com resumo)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │       LÓGICA DE NEGÓCIO (helpers)                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  • recalculateStockLevel()                          │   │
│  │  • updateStockLevel()                               │   │
│  │  • checkStockAlerts()                               │   │
│  │  • validateMovement()                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              BANCO DE DADOS (JSON)                  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  db.json:                                           │   │
│  │  • stock_movements[]   (histórico completo)         │   │
│  │  • stock_levels[]      (atual por local)            │   │
│  │  • stock_locations[]   (depósitos/lojas)            │   │
│  │  • stock_batches[]     (lotes com validade)         │   │
│  │  • stock_alerts[]      (alertas ativos)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Movimentação

```
USUÁRIO REGISTRA MOVIMENTAÇÃO
         ↓
┌─────────────────────────────────┐
│   StockMovementForm             │
│  (modal com validação)          │
└──────────────┬──────────────────┘
               ↓
       POST /stock/movements
               ↓
┌─────────────────────────────────┐
│  Backend Recebe                 │
│  • Valida campos obrigatórios   │
│  • Valida produto/local existe  │
│  • Valida estoque (saída)       │
└──────────────┬──────────────────┘
               ↓
         Se válido:
         ┌─────────────────┐
         ↓                 ↓
    Insere em         Recalcula
    movements[]       stock_level
         ↓                 ↓
         └────────┬────────┘
                  ↓
          Checa alertas:
       quantity <= 0 ? RUPTURA
       quantity < min ? LOW
       quantity > max ? HIGH
                  ↓
          Cria/atualiza
          alerts[]
                  ↓
          Atualiza
          product.stock
          (soma todos locais)
                  ↓
          SUCESSO
          (toast notification)
                  ↓
          StockMovements.jsx
          recarrega tabela
```

---

## 📊 Fluxo de Relatório (Exemplo: Giro)

```
USUÁRIO CLICA EM "GIRO DE ESTOQUE"
            ↓
    StockReports.jsx
    Aba: Turnover
            ↓
    Seleciona período
    (start_date, end_date)
            ↓
    GET /stock/reports/turnover?...
            ↓
    Backend:
    1. Filtra movements onde type='out' e subtype='sale'
    2. Filtra por data (start_date, end_date)
    3. Agrupa por product_id
    4. Para cada produto:
       - total_sold = sum(quantity)
       - average_stock = sum(levels.quantity) / count(levels)
       - turnover_rate = total_sold / average_stock
    5. Sort by turnover_rate DESC
            ↓
    Retorna array de produtos
    com giro de cada um
            ↓
    Exibe em tabela
    com badges de cor
    (verde > 1, laranja < 1)
            ↓
    Usuário clica CSV
            ↓
    Exporta para arquivo
```

---

## 🎯 Estado da Aplicação

```
┌─────────────────────────────────┐
│  Contexto Global (AuthContext)  │
├─────────────────────────────────┤
│  • user (logged in)             │
│  • csrfToken (segurança)        │
│  • token (JWT)                  │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│  Estado Local (useState)        │
├─────────────────────────────────┤
│  StockMovements:                │
│  • movements[]                  │
│  • filters{}                    │
│  • pagination{}                 │
│  • stats{}                      │
│                                 │
│  StockLevels:                   │
│  • levels[]                     │
│  • editingLevel                 │
│  • thresholds{}                 │
│                                 │
│  StockReports:                  │
│  • turnoverData[]               │
│  • topSellersData[]             │
│  • slowMoversData[]             │
│  • profitMarginData[]           │
│  • stockoutData[]               │
│  • auditData[]                  │
└─────────────────────────────────┘
```

---

## 🔐 Fluxo de Segurança

```
USUÁRIO TENTA FAZER REQUISIÇÃO
            ↓
┌─────────────────────────────────┐
│  Frontend                       │
│  1. Recupera CSRF token         │
│  2. Injeta no header:           │
│     X-CSRF-Token: xxx           │
│  3. Envia com credentials       │
└─────────────────────────────────┘
            ↓
      HTTP POST
            ↓
┌─────────────────────────────────┐
│  Backend Middleware             │
│  1. Valida token CSRF           │
│  2. Verifica cookie de sessão   │
│  3. Valida token JWT            │
│  4. Autoriza acesso             │
└─────────────────────────────────┘
            ↓
      Se OK: processa
      Se ERRO: 403 Forbidden
```

---

## 📈 Evolução do Estoque

```
INICIAL (db.json)
products[1].stock = 150
stock_levels[1] = {product_id:1, location_id:1, quantity:?}

EVENTO 1: Compra de 100 unidades
POST /stock/movements
{type:'in', quantity:100}
         ↓
Cálculo: in - out = 100 - 0 = 100
stock_levels[1].quantity = 100
products[1].stock = 100

EVENTO 2: Venda de 20 unidades
POST /stock/movements
{type:'out', quantity:20}
         ↓
Cálculo: (100 + 100) - 20 = 180
stock_levels[1].quantity = 80
products[1].stock = 80

ESTADO FINAL:
Entrada total:  100 unidades
Saída total:    20 unidades
Saldo:          80 unidades
```

---

## 🎨 Estrutura de Pasta

```
src/
├── pages/
│   ├── StockMovements.jsx    ← Movimentações
│   ├── StockLevels.jsx       ← Níveis
│   ├── StockReports.jsx      ← Relatórios
│   └── Inventory.jsx         ← Consolidado
│
├── components/
│   ├── StockMovementForm.jsx     ← Modal
│   ├── StockMovementTable.jsx    ← Tabela
│   └── StockAlertBadge.jsx       ← Badge
│
├── routes/
│   └── AppRoutes.jsx         ← Inclui /stock/*
│
├── layouts/
│   └── Sidebar.jsx           ← Menu com "Estoque"
│
└── services/
    └── api.js                ← Cliente HTTP

mock/
└── server.js                 ← Todos endpoints

db.json                        ← Dados + schema

docs/
├── MODULO_ESTOQUE.md         ← Completo
└── ESTOQUE_GUIA_RAPIDO.md    ← Referência
```

---

## 📋 Checklist de Integração

- ✅ Schema em db.json (locations, movements, levels, batches, alerts)
- ✅ Endpoints backend no mock/server.js (20+ rotas)
- ✅ 4 páginas principais (Movements, Levels, Reports, Inventory)
- ✅ 3 componentes reutilizáveis (Form, Table, Badge)
- ✅ 6 relatórios com filtros e CSV export
- ✅ Sistema de alertas automáticos
- ✅ Validação de estoque em movimentações
- ✅ Menu lateral com submenu "Estoque"
- ✅ Rotas protegidas por autenticação
- ✅ CSRF protection em POST/PUT/DELETE
- ✅ Documentação completa
- ✅ Guia rápido de uso

---

## 🚀 Next Steps (Futuro)

- [ ] Integração com nota fiscal eletrônica (NFe)
- [ ] Previsão de demanda (ML)
- [ ] Otimização automática de limites
- [ ] Integração com múltiplos fornecedores
- [ ] Código de barras (scanner)
- [ ] Sincronização com e-commerce
- [ ] Relatório de FIFO/LIFO
- [ ] Cálculo de ABC (Curva)
- [ ] Indicadores em dashboard
- [ ] Alertas via email/SMS

---

## 📞 Arquitetura Resumida

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|-----------------|
| **Apresentação** | React + Chakra UI | UI, filtros, formulários |
| **Lógica** | React Hooks, useState | Gerenciamento de estado |
| **Integração** | api.js | HTTP com CSRF |
| **Backend** | Express.js | Rotas e validação |
| **Negócio** | Helpers JS | Cálculos (giro, margem, etc) |
| **Dados** | JSON (db.json) | Persistência in-memory |

---

**Diagrama atualizado:** Dezembro 2025  
**Status:** 🟢 Completo e Testado
