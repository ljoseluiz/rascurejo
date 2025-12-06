# 🧪 Guia de Testes - Módulo Financeiro

## ⚡ Quick Start (5 minutos)

### Terminal 1: Backend
```powershell
cd c:\Apps\varejix
npm run mock:express:watch
# Espere: "Mock Express server listening on http://localhost:3000"
```

### Terminal 2: Frontend
```powershell
cd c:\Apps\varejix
npm run dev
# Espere: "VITE v5.x.x ready in x ms"
```

### Terminal 3: Browser
```
http://localhost:5173
Login: admin / password
```

---

## 📋 Teste Manual - Passo a Passo

### ✅ Teste 1: Contas a Pagar

**Objetivo:** Criar e marcar como pago

**Passos:**
1. Clique no menu "Financeiro" → "Contas a Pagar"
2. Verifique cards com resumo (Total, Pendente, Vencido, Pago)
3. Clique "+ Nova Conta"
4. Preencha:
   - Fornecedor: "Fornecedor A"
   - Número NF: "NF-TEST-001"
   - Valor: "1250.50"
   - Vencimento: Data futura
   - Método: "Transferência"
5. Clique "Salvar"
6. Verifique toast "Sucesso - Conta a pagar criada"
7. Verifique entrada na tabela com status "Pendente" (🟡)
8. Clique "Marcar Pago"
9. Confirme no modal
10. Verifique status muda para "Pago" (🟢)

**Esperado:**
- ✅ Nova conta aparece na tabela
- ✅ Status muda com sucesso
- ✅ KPI de "Pago" aumenta
- ✅ Toast de confirmação

---

### ✅ Teste 2: Contas a Receber

**Objetivo:** Criar e marcar como recebido

**Passos:**
1. Clique "Financeiro" → "Contas a Receber"
2. Clique "+ Nova Cobrança"
3. Preencha:
   - Cliente: "Empresa XYZ Ltda"
   - Valor: "8750.00"
   - Vencimento: Data futura
   - Parcelas: "2"
   - Método: "Cheque"
4. Clique "Salvar"
5. Verifique entrada com status "Pendente"
6. Clique "Marcar Recebido"
7. Confirme
8. Verifique status "Recebido" (🟢)

**Esperado:**
- ✅ KPI "Total" aumenta
- ✅ Status atualiza
- ✅ Toast de sucesso

---

### ✅ Teste 3: Caixa

**Objetivo:** Registrar entradas e saídas

**Passos:**
1. Clique "Financeiro" → "Caixa"
2. Veja 3 caixas com saldos
3. Clique "Registrar" na "Caixa Principal"
4. Preencha:
   - Tipo: "Entrada"
   - Categoria: "Vendas"
   - Valor: "500.00"
   - Descrição: "Venda no caixa"
5. Clique "Registrar"
6. Verifique saldo aumentou em 500.00
7. Registre uma "Saída" de 200.00
8. Verifique saldo final = anterior + 500 - 200

**Teste Histórico:**
9. Clique "Movimentações"
10. Veja tabela com todas as transações

**Esperado:**
- ✅ Saldo atualiza corretamente
- ✅ Histórico mostra todas as movimentações
- ✅ Tipos com cores corretas (🟢 entrada, 🔴 saída, 🔵 transfer)

---

### ✅ Teste 4: Fluxo de Caixa

**Objetivo:** Visualizar previsão D+0/D+30/D+60

**Passos:**
1. Clique "Financeiro" → "Fluxo de Caixa"
2. Verifique 4 KPI cards (Saldo, A Receber, A Pagar, Líquido)
3. Verifique tab "D+0 (Hoje)" - mostra hoje
4. Clique tab "D+30 (30 dias)"
5. Verifique:
   - Entradas Previstas
   - Saídas Previstas
   - Saldo Previsto
   - % de Cobertura
6. Clique tab "D+60 (60 dias)"
7. Verifique cenários (Otimista/Normal/Pessimista)

**Esperado:**
- ✅ Cards mostram números realistas
- ✅ % de cobertura entre 0-100% (ou mais)
- ✅ Cenários mostram 3 projeções diferentes
- ✅ Fluxo Líquido = A Receber - A Pagar

---

### ✅ Teste 5: Relatórios Financeiros

**Objetivo:** Visualizar DRE, Posição e Indicadores

**Passos - DRE Tab:**
1. Clique "Financeiro" → "Relatórios"
2. Verify "Demonstrativo de Resultados"
3. Verifique:
   - RECEITA BRUTA (contas recebidas)
   - CUSTOS E DESPESAS (contas pagas)
   - LUCRO LÍQUIDO = Receita - Custos
   - MARGEM % = (Lucro / Receita) * 100

**Passos - Posição Tab:**
4. Clique tab "Posição Financeira"
5. Verifique:
   - ATIVO: Caixa + Contas a Receber
   - PASSIVO: Contas a Pagar
   - PATRIMÔNIO LÍQUIDO = Ativo - Passivo

**Passos - Indicadores Tab:**
6. Clique tab "Indicadores"
7. Verifique 4 KPIs:
   - Índice de Liquidez
   - Índice de Endividamento
   - Margem de Lucro
   - ROA

**Esperado:**
- ✅ Números batem com somas
- ✅ Margens em %, outras em R$
- ✅ Indicadores são números positivos

---

### ✅ Teste 6: Dashboard Financeiro

**Objetivo:** Visão geral em uma página

**Passos:**
1. Clique "Financeiro" → "Dashboard"
2. Verifique 4 KPIs do topo
3. Verifique card "Movimentação de Hoje"
4. Verifique 2 tabelas:
   - Contas a Pagar Vencidas
   - Contas a Receber Vencidas
5. Role para baixo
6. Verifique 3 health cards:
   - Razão Corrente
   - Pendências Total
   - Saldo Líquido

**Esperado:**
- ✅ Todos os dados visíveis
- ✅ Números coerentes
- ✅ Tabelas vazias ou com dados corretos

---

## 🤖 Teste E2E com Playwright

### Executar Todos os Testes

```powershell
# Interactive mode
npx playwright test e2e/financial-module.spec.js --ui

# Headless mode
npx playwright test e2e/financial-module.spec.js

# Modo debug
npx playwright test e2e/financial-module.spec.js --debug
```

### Testes Disponíveis

```
✅ Accounts Payable: Create and Mark as Paid
✅ Accounts Receivable: Create and Mark as Received
✅ Cash Box: Record Movement
✅ Cash Flow: View Forecast
✅ Financial Reports: View DRE
✅ Financial Dashboard: View Overview
✅ API: Verify CSRF Protection
✅ API: Create Payable via POST
✅ Menu: Financial submenu available
```

---

## 🐛 Troubleshooting

### Problema: "Cannot find module"
**Solução:** Verificar que os arquivos estão em `src/pages/`
```powershell
ls src/pages/Financial*.jsx
```

### Problema: "401 Unauthorized"
**Solução:** Fazer login primeiro
- Acesse http://localhost:5173/login
- Username: `admin`
- Password: `password`

### Problema: "CSRF Token not found"
**Solução:** Recarregar página (`F5`)
- Backend deve ter gerado token
- Frontend deve ter recebido

### Problema: Tabelas vazias
**Solução:** Criar dados de teste
- Clique "+ Nova Conta" / "+ Nova Cobrança" etc
- Preencha formulário
- Clique salvar

### Problema: "Saldo não atualiza"
**Solução:** Verificar console
```javascript
// No console do browser
fetch('http://localhost:3000/financial/cash-boxes')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## 📊 Verificação de Dados

### Backend Database

```bash
# Ver estrutura do banco
cat db.json | grep -A 20 "accounts_payable"

# Via API
curl http://localhost:3000/financial/accounts-payable

# Com CSRF (POST)
curl -X POST http://localhost:3000/financial/accounts-payable \
  -H "X-CSRF-Token: xxx" \
  -H "Content-Type: application/json" \
  -d '{"supplier_id":1,"amount":100,"due_date":"2025-12-31"}'
```

### Frontend DevTools

```javascript
// No console do browser

// Ver user
const auth = window.__AUTH__; // se exposto
console.log(auth)

// Ver CSRF token
console.log(localStorage.getItem('csrfToken'))

// Testar API call
fetch('/api/financial/accounts-payable', {
  credentials: 'include'
}).then(r => r.json()).then(d => console.log(d))
```

---

## ✅ Checklist Final

Antes de marcar como pronto:

- [ ] Login funciona (admin/password)
- [ ] Todos 6 endpoints (Payables, Receivables, CashBox, CashFlow, Reports, Dashboard) carregam sem erro
- [ ] Criar conta a pagar → aparece na tabela com status "pending"
- [ ] Marcar como pago → status muda para "paid" e data paid_at preenche
- [ ] Criar cobrança → aparece com status "pending"
- [ ] Marcar como recebido → status muda para "received"
- [ ] Registrar movimento de caixa → saldo atualiza
- [ ] Fluxo de caixa mostra 3 períodos (D+0, D+30, D+60)
- [ ] Relatórios mostram números corretos
- [ ] Dashboard mostra overview sem erros
- [ ] Menu Financeiro expandido mostra 6 items
- [ ] Não há erros no console (F12)
- [ ] Não há erros no terminal do backend

---

## 📈 Dados Esperados

### Contas a Pagar Inicial
```
supplier_id | invoice | amount   | due_date   | status
1           | NF-001  | 5000.00  | 2025-01-15 | pending
```

### Contas a Receber Inicial
```
customer | amount   | due_date   | status
Empresa  | 8500.00  | 2025-01-01 | pending
```

### Cash Boxes
```
name             | type   | balance
Caixa Principal  | cash   | 15000.00
Caixa Auxiliar   | cash   | 8000.00
Conta Bancária   | bank   | 50000.00
```

---

## 🚀 Performance

**Tempos Esperados:**
- Login: < 2 segundos
- Carregar página: < 1 segundo
- Criar conta: < 2 segundos
- Marcar pago: < 1 segundo
- Tabela com 100 items: < 2 segundos

Se mais lento, verificar:
- Aba de Network no DevTools
- Terminal do backend para logs
- Verificar conexão (Ctrl+Shift+J)

---

## 📝 Notas

- Dados salvos em `db.json` (arquivo)
- Persiste entre restarts
- Para resetar: delete as coleções em `db.json`
- CSRF token regenera a cada 2 horas
- Cookies são httpOnly (seguro)

---

**Última Atualização:** 2025-01-20  
**Versão:** 1.0
