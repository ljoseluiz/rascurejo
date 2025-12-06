# Módulo Financeiro - Documentação Completa

## 1. Visão Geral

O Módulo Financeiro (Financial Module) é um sistema completo de gerenciamento financeiro integrado ao Varejix. Oferece controle de contas a pagar, contas a receber, caixa, fluxo de caixa e relatórios financeiros.

### Funcionalidades Principais
- ✅ **Contas a Pagar** - Gerenciamento de faturas de fornecedores
- ✅ **Contas a Receber** - Controle de cobranças de clientes
- ✅ **Caixa** - Registro de movimentações (entrada, saída, transferência)
- ✅ **Fluxo de Caixa** - Previsão D+0, D+30, D+60
- ✅ **Relatórios Financeiros** - DRE, Posição Financeira, Indicadores
- ✅ **Dashboard Financeiro** - Visão resumida com KPIs

---

## 2. Arquitetura

### Banco de Dados (db.json)

**6 Coleções Principais:**

```javascript
// suppliers - Fornecedores
{
  "id": 1,
  "name": "Fornecedor A",
  "cnpj": "12.345.678/0001-99",
  "email": "contato@fornecedor.com",
  "phone": "(11) 9999-9999",
  "address": "Rua Exemplo, 123",
  "city": "São Paulo",
  "state": "SP",
  "active": true,
  "created_at": "2024-01-01T00:00:00Z"
}

// accounts_payable - Contas a Pagar
{
  "id": 1,
  "supplier_id": 1,
  "supplier_name": "Fornecedor A",
  "invoice_number": "NF-001",
  "amount": 5000.00,
  "due_date": "2025-01-15",
  "status": "pending|paid|overdue",
  "payment_method": "boleto|transfer|check",
  "description": "Compra de mercadoria",
  "created_at": "2024-12-01T00:00:00Z",
  "paid_at": null,
  "notes": ""
}

// accounts_receivable - Contas a Receber
{
  "id": 1,
  "customer_id": null,
  "customer_name": "Empresa X",
  "sale_date": "2024-12-01",
  "amount": 8500.00,
  "due_date": "2025-01-01",
  "status": "pending|overdue|received",
  "installments": 1,
  "current_installment": 1,
  "payment_method": "check|transfer|cash",
  "description": "Venda de produtos",
  "created_at": "2024-12-01T00:00:00Z",
  "received_at": null,
  "notes": ""
}

// cash_boxes - Caixas (Física ou Bancária)
{
  "id": 1,
  "name": "Caixa Principal",
  "type": "cash|bank",
  "balance": 15000.00,
  "active": true,
  "created_at": "2024-01-01T00:00:00Z"
}

// cash_movements - Movimentações de Caixa
{
  "id": 1,
  "cash_box_id": 1,
  "type": "entry|exit|transfer",
  "category": "sales|supplies|salary|rent|utilities|transfer|other",
  "amount": 5000.00,
  "description": "Venda no caixa",
  "reference": "",
  "created_at": "2024-01-01T00:00:00Z",
  "created_by": "admin"
}

// cash_flow_forecast - Previsão de Fluxo
{
  "period": "D+0|D+30|D+60",
  "expected_inflow": 15000.00,
  "expected_outflow": 8000.00,
  "balance": 7000.00
}
```

---

## 3. Endpoints da API

### Base URL
- **Dev:** `http://localhost:3000` (proxied via `/api`)
- **Prod:** Via `VITE_API_BASE_URL` env

### Autenticação
Todos os endpoints de criação/edição requerem:
- **Auth:** Login com `admin`/`password`
- **CSRF:** Token injetado via `api.injectCsrf(opts, csrfToken)`

### Endpoints

#### Fornecedores
```
GET  /suppliers
     Response: { items: [...] }

POST /suppliers                (AUTH + CSRF)
     Body: { name, cnpj, email, phone, address, city, state }
     Response: { id, ... }
```

#### Contas a Pagar
```
GET  /financial/accounts-payable?status=pending&page=1&limit=10
     Response: { items: [...], total, page, limit }

POST /financial/accounts-payable                (AUTH + CSRF)
     Body: { supplier_id, invoice_number, amount, due_date, payment_method, description }
     Response: { id, ... }

PUT  /financial/accounts-payable/:id/pay        (AUTH + CSRF)
     Body: {}
     Response: { id, status: 'paid', paid_at, ... }
```

#### Contas a Receber
```
GET  /financial/accounts-receivable?status=pending&page=1&limit=10
     Response: { items: [...], total, page, limit }

POST /financial/accounts-receivable             (AUTH + CSRF)
     Body: { customer_name, amount, due_date, payment_method, description, installments }
     Response: { id, ... }

PUT  /financial/accounts-receivable/:id/receive (AUTH + CSRF)
     Body: {}
     Response: { id, status: 'received', received_at, ... }
```

#### Caixa
```
GET  /financial/cash-boxes
     Response: { items: [...] }

GET  /financial/cash-boxes/:id/balance
     Response: { box, movements: [...], balance }

POST /financial/cash-movements                  (AUTH + CSRF)
     Body: { cash_box_id, type, category, amount, description, reference }
     Response: { id, ..., updated box balance }
```

#### Fluxo de Caixa
```
GET  /financial/cash-flow
     Response: { 
       cash_flow: [{period, expected_inflow, expected_outflow, balance}, ...],
       total_balance, 
       pending_payables, 
       pending_receivables, 
       net_flow 
     }
```

#### Dashboard Financeiro
```
GET  /financial/dashboard
     Response: { 
       summary: { 
         total_payable, total_receivable, overdue_payables, 
         overdue_receivables, total_balance, daily_entries, daily_exits 
       },
       pending_payables: [...],
       pending_receivables: [...]
     }
```

#### Relatórios
```
GET  /financial/reports/dre
     Response: { revenue, costs, profit, margin, type }

GET  /financial/reports/balance  (planned)
GET  /financial/reports/profitability  (planned)
```

---

## 4. Pages & Routes

### Rotas Disponíveis

| Route | Componente | Descrição |
|-------|-----------|-----------|
| `/financial` | FinancialDashboard.jsx | Dashboard financeiro com KPIs |
| `/financial/accounts-payable` | AccountsPayable.jsx | Gerenciar contas a pagar |
| `/financial/accounts-receivable` | AccountsReceivable.jsx | Gerenciar contas a receber |
| `/financial/cash-box` | CashBox.jsx | Registrar movimentações de caixa |
| `/financial/cash-flow` | CashFlow.jsx | Previsão de fluxo D+0, D+30, D+60 |
| `/financial/reports` | FinancialReports.jsx | Relatórios (DRE, Posição, Indicadores) |

Todas as rotas estão protegidas com `<RequireAuth>`.

### Menu Sidebar
O menu principal foi atualizado com novo submenu "Financeiro":

```
Financeiro
├── Dashboard
├── Contas a Pagar
├── Contas a Receber
├── Caixa
├── Fluxo de Caixa
└── Relatórios
```

---

## 5. Componentes Reutilizáveis

### Não há componentes separados (inline)
Todos os componentes foram implementados inline nas páginas por simplicidade. Quando escalar, extrair:

- `PayableForm` - Formulário de criação/edição de contas a pagar
- `PayableTable` - Tabela com listagem de contas a pagar
- `ReceivableForm` - Formulário de criação/edição de contas a receber
- `ReceivableTable` - Tabela com listagem de contas a receber
- `CashMovementForm` - Formulário de movimentação de caixa
- `StatusBadge` - Componente de status com cores (pending/overdue/paid/received)
- `CashFlowChart` - Gráfico de previsão de fluxo (futuro)

---

## 6. Fluxos de Uso

### Fluxo 1: Registrar Conta a Pagar

```
1. Acessar: /financial/accounts-payable
2. Clicar "+ Nova Conta"
3. Modal abre com formulário:
   - Selecionar fornecedor
   - Número NF
   - Valor
   - Vencimento
   - Método de pagamento
4. Clicar "Salvar"
5. Conta registrada com status "pending"
6. Após pagamento: Clicar "Marcar Pago" → Status muda para "paid"
```

### Fluxo 2: Registrar Recebimento de Cliente

```
1. Acessar: /financial/accounts-receivable
2. Clicar "+ Nova Cobrança"
3. Modal abre com formulário:
   - Nome do cliente
   - Valor
   - Vencimento
   - Parcelas
   - Método de pagamento
4. Clicar "Salvar"
5. Cobrança registrada com status "pending"
6. Após recebimento: Clicar "Marcar Recebido" → Status muda para "received"
```

### Fluxo 3: Registrar Movimentação de Caixa

```
1. Acessar: /financial/cash-box
2. Ver card da caixa desejada
3. Clicar "Registrar" no card
4. Modal abre com formulário:
   - Tipo: Entrada, Saída, Transferência
   - Categoria: Vendas, Compras, Salários, etc
   - Valor
   - Descrição
5. Clicar "Registrar"
6. Saldo do caixa é atualizado automaticamente
7. Clicar "Movimentações" para ver histórico
```

### Fluxo 4: Consultar Fluxo de Caixa

```
1. Acessar: /financial/cash-flow
2. Ver cards com saldo total, contas a receber, a pagar, fluxo líquido
3. Abrir tabs: D+0, D+30, D+60
4. Cada tab mostra:
   - Entradas previstas
   - Saídas previstas
   - Saldo previsto
   - % de cobertura de despesas
   - Cenários (Otimista/Normal/Pessimista)
```

### Fluxo 5: Consultar Relatórios

```
1. Acessar: /financial/reports
2. Abrir tabs: DRE, Posição Financeira, Análise de Fluxo, Indicadores
3. DRE: Ver Receita Bruta, Custos, Lucro, Margem
4. Posição: Ver Ativo, Passivo, Patrimônio Líquido
5. Indicadores: Ver Liquidez, Endividamento, ROA
```

---

## 7. Statuses & Cores

### Contas a Pagar
- **pending** (🟡 Amarelo) - Aguardando pagamento
- **overdue** (🔴 Vermelho) - Vencida, não paga
- **paid** (🟢 Verde) - Pagamento realizado

### Contas a Receber
- **pending** (🟡 Amarelo) - Aguardando recebimento
- **overdue** (🔴 Vermelho) - Vencida, não recebida
- **received** (🟢 Verde) - Recebimento realizado

### Movimentações de Caixa
- **entry** (🟢 Verde) - Entrada de dinheiro
- **exit** (🔴 Vermelho) - Saída de dinheiro
- **transfer** (🔵 Azul) - Transferência entre caixas

---

## 8. Padrões de Código

### Pattern: Carregar Dados com Auth

```jsx
const loadData = async () => {
  setLoading(true)
  try {
    const opts = api.injectCsrf({}, auth.csrfToken)
    const data = await api.get('/financial/endpoint', opts)
    setData(data)
  } catch (error) {
    toast({ title: 'Erro', description: error.message, status: 'error' })
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  loadData()
}, [auth.csrfToken])
```

### Pattern: Criar/Atualizar com CSRF

```jsx
const handleSave = async (payload) => {
  try {
    const opts = api.injectCsrf({}, auth.csrfToken)
    await api.post('/financial/endpoint', payload, opts)
    toast({ title: 'Sucesso', description: 'Salvo com sucesso', status: 'success' })
    loadData() // Recarregar lista
  } catch (error) {
    toast({ title: 'Erro', description: error.message, status: 'error' })
  }
}
```

### Pattern: Status Badge

```jsx
const statusColors = {
  pending: 'yellow',
  overdue: 'red',
  paid: 'green',
}

<Badge colorScheme={statusColors[item.status]}>
  {statusLabels[item.status]}
</Badge>
```

---

## 9. Cálculos & Lógica

### Auto-Status Update
- Contas com `due_date < hoje` e `status !== 'paid'` → status = 'overdue'
- Implementado no backend ao listar/filtrar

### Balance Calculation
- Entrada (+): `box.balance += amount`
- Saída (-): `box.balance -= amount`
- Transferência (-): `box.balance -= amount` (para box A)

### Cash Flow Forecast
- D+0: Contas vencidas até hoje + movimentações de hoje
- D+30: Todas as contas até 30 dias
- D+60: Todas as contas até 60 dias

### DRE (Lucro)
```
Receita Bruta = Sum(accounts_receivable.status == 'received')
Custos = Sum(accounts_payable.status == 'paid')
Lucro = Receita - Custos
Margem = (Lucro / Receita) * 100
```

### Indicadores
```
Liquidez = Total Caixa / Total Contas a Pagar
Endividamento = (Total A Pagar / Total Ativo) * 100
ROA = (Lucro / Total Ativo) * 100
```

---

## 10. Troubleshooting

### Problema: "CSRF Token não encontrado"
**Solução:** Verificar se `api.injectCsrf()` foi chamado

### Problema: Saldo não atualiza em Caixa
**Solução:** Verificar se o movimento foi registrado com tipo correto (entry/exit)

### Problema: Status overdue não aparece
**Solução:** Backend atualiza status ao listar, frontend recebe correto

### Problema: Modal não fecha
**Solução:** Usar `onClose()` e resetar form

---

## 11. Próximas Melhorias (Planned)

- [ ] Gráficos de fluxo (Chart.js / Recharts)
- [ ] Exportação de relatórios em PDF
- [ ] Importação de extratos bancários
- [ ] Reconciliação automática de caixa
- [ ] Alertas para contas vencidas
- [ ] Histórico de alterações com audit trail
- [ ] Integração com módulo de Vendas (criar contas a receber automaticamente)
- [ ] Integração com módulo de Estoque (criar contas a pagar automaticamente)
- [ ] Múltiplas moedas
- [ ] Previsão com ML

---

## 12. Deploy & Checklist

### Antes de Production

- [ ] Testar todos os endpoints com dados reais
- [ ] Validar CSRF em todas as ações de escrita
- [ ] Testar scenarios de erro (sem auth, sem CSRF)
- [ ] Realizar testes de performance com grande volume de dados
- [ ] Documentar SLAs de resposta de API
- [ ] Backup do db.json antes de deploy
- [ ] Testes E2E com Playwright
- [ ] Validar responsividade mobile
- [ ] Revisar permissões de acesso por role (futuro)

### Testes E2E Sugeridos

```javascript
test('Financial workflow: Create payable -> Mark paid', async ({ page }) => {
  // Login
  // Acessar /financial/accounts-payable
  // Clicar "+ Nova Conta"
  // Preencher formulário
  // Clicar "Marcar Pago"
  // Verificar status = 'paid'
})
```

---

## 13. Contato & Suporte

Para dúvidas sobre o módulo:
1. Verificar esta documentação
2. Revisar código das páginas em `src/pages/Financial*.jsx`
3. Revisar endpoints em `mock/server.js` (linha 1000+)
4. Revisar schema em `db.json`

---

**Última Atualização:** 2025-01-20
**Versão:** 1.0 (Production Ready)
**Status:** ✅ Completo
