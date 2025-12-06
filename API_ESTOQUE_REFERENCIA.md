# 🔌 MÓDULO DE ESTOQUE - REFERÊNCIA DE ENDPOINTS API

**Base URL:** `http://localhost:3000` (dev) → proxiado via `/api` no Vite

---

## 📦 MOVIMENTAÇÕES

### Listar Movimentações
```
GET /stock/movements
Query Parameters:
  - product_id (opcional): Filtrar por produto
  - location_id (opcional): Filtrar por local
  - type (opcional): "in" | "out"
  - subtype (opcional): "purchase", "sale", "loss", "transfer", etc
  - start_date (opcional): YYYY-MM-DD
  - end_date (opcional): YYYY-MM-DD
  - page (padrão: 1)
  - limit (padrão: 10)

Resposta:
{
  "items": [
    {
      "id": 1,
      "product_id": 2,
      "product_name": "Camiseta Premium",
      "location_id": 1,
      "location_name": "Depósito Central",
      "type": "in",
      "subtype": "purchase",
      "quantity": 50,
      "unit_cost": 15.50,
      "total_cost": 775.00,
      "batch_number": "BATCH-2024-001",
      "expiration_date": "2025-12-31",
      "reference_doc": "NF-12345",
      "notes": "Compra fornecedor A",
      "created_by": "admin",
      "created_at": "2024-12-20T10:30:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### Obter Movimentação Específica
```
GET /stock/movements/:id

Resposta: Objeto de movimentação completo
```

### Criar Nova Movimentação
```
POST /stock/movements
Headers: X-CSRF-Token: {token}
Body: {
  "product_id": 2 (obrigatório),
  "location_id": 1 (obrigatório),
  "type": "in" | "out" (obrigatório),
  "subtype": "purchase" | "sale" | "loss" | "transfer" | "adjustment_positive" | "adjustment_negative" (obrigatório),
  "quantity": 50 (obrigatório, > 0),
  "unit_cost": 15.50 (obrigatório para "in"),
  "batch_number": "BATCH-2024-001" (opcional),
  "expiration_date": "2025-12-31" (opcional),
  "reference_doc": "NF-12345" (opcional),
  "notes": "Comentários aqui" (opcional)
}

Resposta (201):
{
  "id": 6,
  "product_id": 2,
  "location_id": 1,
  "type": "in",
  "subtype": "purchase",
  "quantity": 50,
  "created_at": "2024-12-20T10:30:00Z"
}

Erros:
- 400: Campos obrigatórios faltando
- 400: Quantidade inválida (≤ 0)
- 400: Estoque insuficiente para saída
- 401: Não autenticado
- 403: CSRF inválido
- 404: Produto ou local não encontrado
```

---

## 📊 NÍVEIS DE ESTOQUE

### Listar Níveis
```
GET /stock/levels
Query Parameters:
  - product_id (opcional)
  - location_id (opcional)
  - alert_type (opcional): "low" | "out" | "high"
  - page (padrão: 1)
  - limit (padrão: 10)

Resposta:
{
  "items": [
    {
      "product_id": 1,
      "product_name": "Camiseta",
      "location_id": 1,
      "location_name": "Depósito Central",
      "quantity": 145,
      "min_stock": 20,
      "max_stock": 200,
      "alert_type": "ok" | "low_stock" | "out_of_stock" | "high_stock",
      "last_updated": "2024-12-20T10:30:00Z",
      "product_value": 4350.00
    }
  ],
  "total": 12,
  "page": 1
}
```

### Atualizar Níveis Mínimo/Máximo
```
PUT /stock/levels/:productId/:locationId
Headers: X-CSRF-Token: {token}
Body: {
  "min_stock": 15,
  "max_stock": 250
}

Resposta (200):
{
  "product_id": 1,
  "location_id": 1,
  "quantity": 145,
  "min_stock": 15,
  "max_stock": 250,
  "alert_type": "ok"
}
```

---

## 🏭 LOCAIS DE ESTOQUE

### Listar Locais
```
GET /stock/locations

Resposta:
{
  "items": [
    {
      "id": 1,
      "name": "Depósito Central",
      "type": "warehouse",
      "address": "Rua Principal, 123",
      "active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Criar Local
```
POST /stock/locations
Headers: X-CSRF-Token: {token}
Body: {
  "name": "Loja Shopping" (obrigatório),
  "type": "warehouse" | "store" (obrigatório),
  "address": "Rua Principal, 123" (opcional),
  "active": true
}

Resposta (201):
{
  "id": 5,
  "name": "Loja Shopping",
  "type": "store",
  "address": "Rua Principal, 123",
  "active": true
}
```

### Atualizar Local
```
PUT /stock/locations/:id
Headers: X-CSRF-Token: {token}
Body: {
  "name": "Novo Nome",
  "address": "Novo endereço"
}
```

### Deletar Local
```
DELETE /stock/locations/:id
Headers: X-CSRF-Token: {token}

Resposta (204): No content
```

---

## 📦 LOTES (BATCHES)

### Listar Lotes
```
GET /stock/batches
Query Parameters:
  - product_id (opcional)
  - location_id (opcional)
  - expired (opcional): true = apenas expirados

Resposta:
{
  "items": [
    {
      "id": 1,
      "product_id": 2,
      "location_id": 1,
      "batch_number": "BATCH-2024-001",
      "quantity": 50,
      "expiration_date": "2025-12-31",
      "manufacture_date": "2024-01-15",
      "supplier_id": "SUP-001",
      "unit_cost": 15.50,
      "is_expired": false,
      "created_at": "2024-01-15T00:00:00Z"
    }
  ]
}
```

### Obter Lotes Expirados
```
GET /stock/batches?expired=true

Resposta: Array de lotes com expiration_date < hoje
```

---

## ⚠️ ALERTAS

### Listar Alertas Ativos
```
GET /stock/alerts
Query Parameters:
  - type (opcional): "out_of_stock" | "low_stock" | "high_stock"
  - severity (opcional): "critical" | "warning" | "info"
  - product_id (opcional)

Resposta:
{
  "items": [
    {
      "id": 1,
      "type": "out_of_stock",
      "severity": "critical",
      "product_id": 5,
      "product_name": "Widget",
      "location_id": 2,
      "location_name": "Loja Centro",
      "message": "Produto sem estoque no local",
      "current_quantity": 0,
      "threshold": 20,
      "created_at": "2024-12-20T10:30:00Z",
      "resolved": false
    }
  ]
}
```

### Resolver Alerta
```
PUT /stock/alerts/:id/resolve
Headers: X-CSRF-Token: {token}
Body: {
  "notes": "Pedido colocado" (opcional)
}

Resposta (200):
{
  "id": 1,
  "resolved": true,
  "resolved_at": "2024-12-20T11:00:00Z",
  "resolved_by": "admin"
}
```

---

## 📈 RELATÓRIOS

### Giro de Estoque (Turnover)
```
GET /stock/reports/turnover
Query Parameters:
  - start_date (opcional): YYYY-MM-DD
  - end_date (opcional): YYYY-MM-DD
  - location_id (opcional)

Resposta:
{
  "report_type": "turnover",
  "period": {
    "start_date": "2024-11-20",
    "end_date": "2024-12-20"
  },
  "items": [
    {
      "product_id": 1,
      "product_name": "Camiseta",
      "total_sold": 150,
      "average_stock": 75,
      "turnover_rate": 2.0,
      "times_per_month": 2.0,
      "trend": "stable" | "increasing" | "decreasing"
    }
  ],
  "summary": {
    "top_product": "Camiseta",
    "avg_turnover": 1.8
  }
}
```

### Produtos Mais Vendidos
```
GET /stock/reports/top-sellers
Query Parameters:
  - start_date (opcional)
  - end_date (opcional)
  - location_id (opcional)
  - limit (padrão: 10)

Resposta:
{
  "report_type": "top_sellers",
  "period": {...},
  "items": [
    {
      "product_id": 2,
      "product_name": "Camiseta Premium",
      "quantity_sold": 350,
      "revenue": 10500.00,
      "average_price": 30.00,
      "profit": 4550.00,
      "profit_margin": 43.3
    }
  ],
  "summary": {
    "total_quantity": 1250,
    "total_revenue": 37500.00
  }
}
```

### Produtos Parados (Slow Movers)
```
GET /stock/reports/slow-movers
Query Parameters:
  - days (padrão: 30): Sem movimentação há X dias
  - location_id (opcional)

Resposta:
{
  "report_type": "slow_movers",
  "days_threshold": 30,
  "items": [
    {
      "product_id": 7,
      "product_name": "Produto X",
      "quantity": 45,
      "unit_value": 50.00,
      "total_value": 2250.00,
      "last_movement": "2024-10-15T00:00:00Z",
      "days_idle": 66,
      "recommendation": "Promocionar ou liquidar"
    }
  ],
  "summary": {
    "total_products": 8,
    "total_value_idle": 18750.00
  }
}
```

### Margem de Lucro
```
GET /stock/reports/profit-margin
Query Parameters:
  - start_date (opcional)
  - end_date (opcional)
  - location_id (opcional)

Resposta:
{
  "report_type": "profit_margin",
  "period": {...},
  "items": [
    {
      "product_id": 1,
      "product_name": "Camiseta",
      "total_cost": 2000.00,
      "total_revenue": 3000.00,
      "profit": 1000.00,
      "margin_percentage": 33.3,
      "quantity_sold": 100,
      "avg_margin_per_unit": 10.00
    }
  ],
  "summary": {
    "total_cost": 15000.00,
    "total_revenue": 37500.00,
    "overall_margin": 60.0
  }
}
```

### Produtos em Ruptura/Crítico
```
GET /stock/reports/stockout
Query Parameters:
  - location_id (opcional)
  - include_low (opcional): true = incluir baixo estoque

Resposta:
{
  "report_type": "stockout",
  "items": [
    {
      "product_id": 5,
      "product_name": "Widget",
      "current_quantity": 0,
      "min_stock": 20,
      "deficit": 20,
      "location_id": 1,
      "location_name": "Depósito Central",
      "last_movement": "2024-12-10T00:00:00Z",
      "alert_severity": "critical"
    }
  ],
  "summary": {
    "total_products_out": 3,
    "products_low_stock": 8
  }
}
```

### Auditoria Completa
```
GET /stock/reports/audit
Query Parameters:
  - start_date (opcional)
  - end_date (opcional)
  - user (opcional): Filtrar por usuário
  - product_id (opcional)

Resposta:
{
  "report_type": "audit",
  "period": {...},
  "movements": [
    {
      "id": 1,
      "product_id": 2,
      "product_name": "Camiseta",
      "type": "in",
      "quantity": 50,
      "created_by": "admin",
      "created_at": "2024-12-20T10:30:00Z",
      "reference": "NF-12345"
    }
  ],
  "summary": {
    "total_in": 250,
    "total_out": 120,
    "net_change": 130,
    "total_value_in": 3875.00,
    "total_value_out": 3600.00,
    "users_active": ["admin", "vendedor1"]
  }
}
```

---

## 🛠️ ERROS COMUNS

### 400 Bad Request
```json
{
  "error": "Campos obrigatórios faltando",
  "details": ["quantity", "location_id"]
}
```

### 401 Unauthorized
```json
{
  "error": "Não autenticado",
  "message": "Faça login para acessar este recurso"
}
```

### 403 Forbidden
```json
{
  "error": "CSRF token inválido",
  "message": "Tente novamente"
}
```

### 404 Not Found
```json
{
  "error": "Produto não encontrado",
  "id": 999
}
```

### 500 Server Error
```json
{
  "error": "Erro interno do servidor",
  "message": "Tente novamente mais tarde"
}
```

---

## 📋 TIPOS E VALORES

### Movement Types
- `in` - Entrada de estoque
- `out` - Saída de estoque

### Movement Subtypes
| Tipo | Subtipo | Descrição |
|------|---------|-----------|
| in | purchase | Compra de fornecedor |
| in | devolução | Devolução de cliente |
| in | adjustment_positive | Ajuste positivo |
| in | transfer | Transferência entre locais |
| out | sale | Venda para cliente |
| out | loss | Perda/danificação |
| out | discount | Desconto/amostra |
| out | adjustment_negative | Ajuste negativo |
| out | transfer | Transferência entre locais |

### Alert Types
- `out_of_stock` - Sem estoque (qty ≤ 0)
- `low_stock` - Estoque baixo (qty < min)
- `high_stock` - Estoque alto (qty > max)

### Alert Severity
- `critical` - Ruptura
- `warning` - Atenção
- `info` - Informação

### Location Types
- `warehouse` - Depósito
- `store` - Loja

---

## 🔐 HEADERS OBRIGATÓRIOS

### POST, PUT, DELETE
```
X-CSRF-Token: {token_obtido_em_GET /auth/csrf}
Content-Type: application/json
```

### Exemplo com curl
```bash
curl -X POST http://localhost:3000/stock/movements \
  -H "X-CSRF-Token: abc123def456" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 50, ...}'
```

---

## 💡 EXEMPLOS DE USO

### Registrar Compra de 50 Camisetas
```bash
POST /stock/movements
{
  "product_id": 1,
  "location_id": 1,
  "type": "in",
  "subtype": "purchase",
  "quantity": 50,
  "unit_cost": 15.50,
  "batch_number": "BATCH-2024-001",
  "expiration_date": "2025-12-31",
  "reference_doc": "NF-98765"
}
```

### Registrar Venda de 10 Widgets
```bash
POST /stock/movements
{
  "product_id": 5,
  "location_id": 2,
  "type": "out",
  "subtype": "sale",
  "quantity": 10,
  "reference_doc": "PED-54321"
}
```

### Filtrar Movimentações de Dezembro
```bash
GET /stock/movements?start_date=2024-12-01&end_date=2024-12-31
```

### Listar Produtos em Baixo Estoque
```bash
GET /stock/levels?alert_type=low
```

### Gerar Relatório de Giro
```bash
GET /stock/reports/turnover?start_date=2024-11-20&end_date=2024-12-20
```

---

**Versão:** 1.0.0  
**Última atualização:** 2024-12-20  
**Compatibilidade:** Varejix 1.0+
