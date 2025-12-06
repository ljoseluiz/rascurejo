# Módulo de Gestão de Estoque - Documentação Completa

## 🎯 Visão Geral

O módulo de gestão de estoque fornece controle completo sobre movimentações, níveis, locais e relatórios de estoque com alertas automáticos e auditoria.

---

## 📊 Componentes Principais

### 1. **Movimentações de Estoque** (`/stock/movements`)
Registro e controle de todas as operações de entrada e saída de estoque.

#### Tipos de Movimentação:
**Entrada (IN):**
- `purchase` - Compra de fornecedor
- `return` - Devolução de cliente
- `transfer_in` - Transferência entre locais (entrada)
- `adjustment_positive` - Ajuste positivo (conferência)

**Saída (OUT):**
- `sale` - Venda ao cliente
- `loss` - Perda/dano
- `transfer_out` - Transferência entre locais (saída)
- `adjustment_negative` - Ajuste negativo (conferência)

#### Funcionalidades:
- ✅ Registro de movimentações com lote e validade
- ✅ Validação automática de estoque disponível
- ✅ Recálculo automático de níveis
- ✅ Filtros avançados (produto, local, tipo, período)
- ✅ Busca por documento de referência (NF, VENDA, etc.)
- ✅ Paginação (20 itens por página)
- ✅ Dashboard com estatísticas (total entrada, saída, saldo)

#### API Endpoints:
```
GET    /stock/movements          # Listar com filtros
POST   /stock/movements          # Criar nova movimentação
GET    /stock/movements?q=termo  # Buscar
GET    /stock/movements?type=in|out
GET    /stock/movements?product_id=1&location_id=1
GET    /stock/movements?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

#### Exemplo de Payload POST:
```json
{
  "product_id": 1,
  "location_id": 1,
  "type": "in",
  "subtype": "purchase",
  "quantity": 50,
  "unit_cost": 12.00,
  "batch_number": "LOTE-2024-001",
  "expiration_date": "2025-12-31",
  "reference_doc": "NF-12345",
  "notes": "Compra fornecedor A"
}
```

---

### 2. **Níveis de Estoque** (`/stock/levels`)
Visualização e configuração de estoque por produto e local com limites min/max automáticos.

#### Funcionalidades:
- ✅ Visualização de quantidade atual por local
- ✅ Limites mínimo e máximo configuráveis
- ✅ Alertas automáticos de ruptura e estoque baixo
- ✅ Cálculo de valor total em estoque
- ✅ Filtros por alert type (low/out/high)
- ✅ Edição inline de limites
- ✅ Status visual com badges de alerta

#### API Endpoints:
```
GET    /stock/levels                      # Listar todos
GET    /stock/levels?alert_type=low|out|high
GET    /stock/levels?product_id=1
GET    /stock/levels?location_id=1
PUT    /stock/levels/:product_id/:location_id  # Atualizar min/max
```

#### Exemplo de Payload PUT:
```json
{
  "min_stock": 20,
  "max_stock": 200
}
```

---

### 3. **Locais de Estoque** (`/stock/locations`)
Gerenciamento de depósitos, lojas físicas e outros pontos de estoque.

#### Funcionalidades:
- ✅ Criar locais (depósito, loja)
- ✅ Ativar/desativar locais
- ✅ Validação: não permite deletar local com estoque

#### API Endpoints:
```
GET    /stock/locations                # Listar
GET    /stock/locations?active=true    # Apenas ativos
POST   /stock/locations                # Criar
PUT    /stock/locations/:id            # Editar
DELETE /stock/locations/:id            # Deletar
```

#### Exemplo de Payload POST:
```json
{
  "name": "Depósito Central",
  "type": "warehouse|store",
  "address": "Rua Industrial, 100",
  "active": true
}
```

---

### 4. **Lotes e Validade** (`/stock/batches`)
Rastreamento de lotes com data de validade para produtos sensíveis.

#### Funcionalidades:
- ✅ Associar lote com produto e local
- ✅ Data de validade opcional
- ✅ Data de fabricação
- ✅ Custo unitário por lote
- ✅ Filtro de lotes expirados

#### API Endpoints:
```
GET    /stock/batches                    # Listar
GET    /stock/batches?expired=true       # Apenas expirados
GET    /stock/batches?product_id=1
GET    /stock/batches?location_id=1
```

---

### 5. **Alertas Automáticos** (`/stock/alerts`)
Sistema de alertas inteligente com três níveis de severidade.

#### Tipos de Alerta:
- 🔴 **Critical** - RUPTURA (quantidade ≤ 0)
- 🟠 **Warning** - Estoque baixo (quantidade < mínimo)
- 🔵 **Info** - Estoque alto (quantidade > máximo)

#### Funcionalidades:
- ✅ Gerados automaticamente na movimentação
- ✅ Resolver manualmente
- ✅ Filtros por tipo e severidade
- ✅ Enriquecido com dados de produto e local

#### API Endpoints:
```
GET    /stock/alerts                       # Listar ativos
GET    /stock/alerts?type=out_of_stock
GET    /stock/alerts?severity=critical
GET    /stock/alerts?product_id=1
PUT    /stock/alerts/:id/resolve           # Marcar como resolvido
```

---

## 📈 Relatórios Avançados

### 1. **Giro de Estoque** (`/stock/reports/turnover`)
Analisa a velocidade de rotação de produtos.

```
GET /stock/reports/turnover?start_date=2025-01-01&end_date=2025-12-31&location_id=1
```

**Resposta:**
```json
{
  "items": [
    {
      "product_id": 1,
      "product_name": "Camiseta básica",
      "product_sku": "CAM-001",
      "total_sold": 150,
      "average_stock": 50,
      "turnover_rate": "3.00",
      "days_in_period": 90
    }
  ]
}
```

**Interpretação:** Giro de 3x = produto rodou 3 vezes no período.

---

### 2. **Mais Vendidos** (`/stock/reports/top-sellers`)
Produtos com maior movimento de vendas no período.

```
GET /stock/reports/top-sellers?start_date=2025-01-01&end_date=2025-12-31&limit=10
```

**Resposta:**
```json
{
  "items": [
    {
      "product_id": 1,
      "product_name": "Camiseta básica",
      "quantity_sold": 150,
      "revenue": 4485.00,
      "profit": 2235.00
    }
  ]
}
```

---

### 3. **Produtos Parados** (`/stock/reports/slow-movers`)
Produtos sem movimento há X dias (estratégia de limpeza de estoque).

```
GET /stock/reports/slow-movers?days=30&location_id=1
```

**Resposta:**
```json
{
  "items": [
    {
      "product_id": 5,
      "product_name": "Produto X",
      "quantity": 20,
      "value_at_cost": 400.00,
      "value_at_sale": 600.00,
      "days_without_movement": 120
    }
  ]
}
```

---

### 4. **Margem de Lucro** (`/stock/reports/profit-margin`)
Análise de rentabilidade por produto.

```
GET /stock/reports/profit-margin
```

**Resposta:**
```json
{
  "items": [
    {
      "product_id": 1,
      "product_name": "Camiseta básica",
      "sale_price": 29.90,
      "cost_price": 12.00,
      "profit_per_unit": 17.90,
      "margin_percent": 59.87,
      "current_stock": 100,
      "potential_profit": 1790.00
    }
  ]
}
```

---

### 5. **Ruptura de Estoque** (`/stock/reports/stockout`)
Produtos críticos: em ruptura ou abaixo do mínimo.

```
GET /stock/reports/stockout?location_id=1
```

**Resposta:**
```json
{
  "items": [
    {
      "product_id": 2,
      "product_name": "Calça jeans premium",
      "current_quantity": 0,
      "min_stock": 15,
      "status": "out_of_stock",
      "reorder_quantity": 100
    }
  ]
}
```

---

### 6. **Auditoria** (`/stock/reports/audit`)
Trilha completa de movimentações com resumo e filtros.

```
GET /stock/reports/audit?start_date=2025-01-01&end_date=2025-12-31
```

**Resposta:**
```json
{
  "items": [
    {
      "id": 1,
      "product_name": "Camiseta básica",
      "location_name": "Depósito Central",
      "type": "in",
      "quantity": 100,
      "total_cost": 1200.00,
      "created_by": "admin",
      "created_at": "2025-01-10T09:00:00Z"
    }
  ],
  "summary": {
    "total_movements": 50,
    "total_in": 500,
    "total_out": 350,
    "total_value_in": 5000.00,
    "total_value_out": 3500.00
  }
}
```

---

## 🎨 Componentes Frontend

### StockMovementForm
Modal com formulário para registrar novas movimentações.
- Validação de estoque disponível
- Sugestão de local ativo
- Cálculo automático de custo total
- Toast feedback

### StockMovementTable
Tabela exibindo movimentações com:
- Data/hora
- Produto + SKU
- Local
- Tipo/Subtipo
- Quantidade
- Custo unitário e total
- Número do lote e validade
- Documento de referência
- Usuário

### StockAlertBadge
Badge visual com ícone para alertas de estoque:
- 🔴 RUPTURA (quantidade ≤ 0)
- 🟠 Estoque Baixo (quantidade < mínimo)
- 🔵 Estoque Alto (quantidade > máximo)
- ✅ OK (dentro dos limites)

---

## 📄 Páginas

### 1. **StockMovements** (`/stock/movements`)
- Dashboard com estatísticas (entrada, saída, saldo)
- Filtros avançados
- Tabela com paginação
- Botão para nova movimentação
- Modal de registro

### 2. **StockLevels** (`/stock/levels`)
- KPIs: total de itens, valor, baixo estoque, ruptura
- Filtros por alert type e local
- Tabela com possibilidade de editar min/max
- Modal para ajustar limites

### 3. **StockReports** (`/stock/reports`)
6 abas com relatórios distintos:
1. **Giro de Estoque** - Velocidade de rotação
2. **Mais Vendidos** - Top 10 produtos
3. **Produtos Parados** - Sem movimento há X dias
4. **Margem de Lucro** - Rentabilidade
5. **Ruptura** - Produtos críticos
6. **Auditoria** - Trilha completa com resumo

**Funcionalidades em todos:**
- Filtros por período e local
- Exportação para CSV
- Tabelas responsivas
- Badges de status

### 4. **Inventory** (`/inventory`)
Visão consolidada de estoque
- Sincroniza com `/stock/levels` (estoque real)
- 4 KPIs: total itens, valor, baixo estoque, ruptura
- Filtro por local
- Busca integrada
- Tabela com detalhes por local

---

## 🔐 Segurança

### CSRF Protection
Todos os endpoints de escrita (POST, PUT, DELETE) requerem token CSRF:

```javascript
const opts = api.injectCsrf({}, auth.csrfToken)
await api.post('/stock/movements', data, opts)
```

### Autenticação
Todos os endpoints estão protegidos com `ensureAuth` middleware.

### Validações
- Quantidade > 0
- Produto/Local deve existir
- Estoque suficiente para saídas
- Não permite deletar local com estoque

---

## 🔄 Fluxo de Dados

### Registrar Movimentação
1. Usuário clica "Nova Movimentação"
2. Modal abre com formulário
3. Valida campos obrigatórios
4. Envia POST `/stock/movements`
5. Backend calcula novo nível
6. Gera alerta se necessário
7. Atualiza `product.stock` (total de todos locais)
8. Retorna sucesso
9. Página atualiza tabela

### Alerta Automático
```
Movimentação registrada
  ↓
recalculateStockLevel(productId, locationId)
  ↓
checkStockAlerts(productId, locationId)
  ↓
Comparar quantity com min/max
  ↓
Criar/deletar alerta conforme necessário
```

---

## 📊 Schema de Dados

### stock_movements
```javascript
{
  id,
  product_id,
  location_id,
  type: 'in' | 'out',
  subtype,
  quantity,
  unit_cost,
  total_cost,
  batch_number,
  expiration_date,
  reference_doc,
  notes,
  created_by,
  created_at
}
```

### stock_levels
```javascript
{
  product_id,
  location_id,
  quantity,
  min_stock,
  max_stock,
  last_updated
}
```

### stock_locations
```javascript
{
  id,
  name,
  type: 'warehouse' | 'store',
  address,
  active
}
```

### stock_batches
```javascript
{
  id,
  product_id,
  location_id,
  batch_number,
  quantity,
  expiration_date,
  manufacture_date,
  supplier_id,
  unit_cost,
  created_at
}
```

### stock_alerts
```javascript
{
  id,
  type: 'out_of_stock' | 'low_stock' | 'high_stock',
  severity: 'critical' | 'warning' | 'info',
  product_id,
  location_id,
  message,
  current_quantity,
  threshold,
  created_at,
  resolved,
  resolved_at,
  resolved_by
}
```

---

## 🚀 Como Usar

### 1. Criar Movimentação
```javascript
// Frontend
const opts = api.injectCsrf({}, auth.csrfToken)
await api.post('/stock/movements', {
  product_id: 1,
  location_id: 1,
  type: 'in',
  subtype: 'purchase',
  quantity: 50,
  unit_cost: 12.00,
  reference_doc: 'NF-12345'
}, opts)
```

### 2. Visualizar Níveis
```javascript
const data = await api.get('/stock/levels?location_id=1', opts)
// data.items contém array de níveis com alertas
```

### 3. Gerar Relatório
```javascript
const report = await api.get(
  '/stock/reports/top-sellers?start_date=2025-01-01&end_date=2025-12-31',
  opts
)
// Exportar para CSV
const csv = convertArrayToCSV(report.items)
```

### 4. Configurar Limites
```javascript
await api.put(
  '/stock/levels/1/1',  // product_id/location_id
  { min_stock: 20, max_stock: 200 },
  opts
)
```

---

## 🧪 Testes E2E

Exemplo com Playwright:
```javascript
test('criar movimentação de estoque', async ({ page }) => {
  await page.goto('http://localhost:5173/stock/movements')
  await page.click('button:has-text("Nova Movimentação")')
  await page.selectOption('select:first', '1')  // Produto
  await page.selectOption('select:nth(1)', '1') // Local
  await page.selectOption('select:nth(2)', 'in') // Tipo
  await page.fill('input[placeholder*="Quantidade"]', '50')
  await page.click('button:has-text("Registrar")')
  await page.waitForText('Movimentação registrada')
})
```

---

## 📝 Notas Importantes

1. **Sincronização**: O campo `product.stock` é recalculado automaticamente (soma de todos os locais)
2. **Alertas**: Criados/atualizados automaticamente a cada movimentação
3. **Histórico**: Auditoria disponível em `/stock/reports/audit`
4. **CSV Export**: Todos os relatórios podem ser exportados
5. **Validação**: Backend valida estoque antes de saídas
6. **Lotes**: Opcionais, mas recomendados para rastreabilidade

---

## 🐛 Troubleshooting

**Problema:** Estoque atualiza mas alerta não aparece
- **Solução:** Recarregue a página. Alertas são criados em background.

**Problema:** Não consigo deletar um local
- **Solução:** Verifique se há estoque neste local. Mova o estoque primeiro.

**Problema:** Movimento de saída retorna erro de estoque insuficiente
- **Solução:** Verifique a quantidade disponível no local. Crie uma entrada primeiro.

**Problema:** Relatório de giro mostra resultado estranho
- **Solução:** Verifique se há movimentações de venda no período selecionado.

---

## 🔗 Relacionamentos

```
Product
  ├── stock_levels (múltiplas: 1 produto em N locais)
  ├── stock_movements (entrada/saída)
  └── stock_batches (lotes)

Location
  ├── stock_levels (1 local tem múltiplos produtos)
  └── stock_movements (movimentos registrados)

Supplier
  └── stock_batches (fornecedor do lote)

Alert
  ├── product
  └── location
```

---

## 📊 KPIs Disponíveis

- Total de Itens em Estoque
- Valor Total Estocado (R$)
- Itens em Ruptura
- Itens com Estoque Baixo
- Giro Médio de Estoque
- Margem de Lucro Média
- Dias de Cobertura (potencial)
- Produtos Parados (>90 dias)

---

**Última atualização:** dezembro 2025
**Versão:** 1.0
**Status:** Produção ✅
