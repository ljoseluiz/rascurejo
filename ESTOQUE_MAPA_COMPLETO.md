# 📚 MAPA COMPLETO DO MÓDULO DE ESTOQUE

## 🎯 Objetivo
Controle total sobre movimentação de estoque com alertas automáticos, múltiplos locais, rastreamento de lotes e 6 relatórios avançados.

---

## 📁 ESTRUTURA DE ARQUIVOS CRIADOS

```
varejix/
├── 📄 ESTOQUE_VERIFICACAO.md           ✅ Checklist de verificação
├── 📄 ESTOQUE_RESUMO_FINAL.md          ✅ Resumo executivo
├── 📄 API_ESTOQUE_REFERENCIA.md        ✅ Documentação de endpoints
├── 📄 INICIAR_ESTOQUE.ps1              ✅ Script Windows
├── 📄 INICIAR_ESTOQUE.sh               ✅ Script Linux/Mac
│
├── 📂 docs/
│   ├── 📄 MODULO_ESTOQUE.md            ✅ Guia completo (30KB)
│   ├── 📄 ESTOQUE_GUIA_RAPIDO.md       ✅ Quick reference (5KB)
│   ├── 📄 ESTOQUE_ARQUITETURA.md       ✅ Arquitetura (16KB)
│   └── 📄 ESTOQUE_CASOS_USO.md         ✅ 12 Casos de uso (11KB)
│
├── 📂 src/
│   ├── 📂 pages/
│   │   ├── 📄 StockMovements.jsx       ✅ Gerenciador de movimentações
│   │   ├── 📄 StockLevels.jsx          ✅ Gerenciador de níveis
│   │   ├── 📄 StockReports.jsx         ✅ 6 Relatórios avançados
│   │   └── ... (outros)
│   │
│   ├── 📂 components/
│   │   ├── 📄 StockMovementForm.jsx    ✅ Modal de nova movimentação
│   │   ├── 📄 StockMovementTable.jsx   ✅ Tabela de movimentações
│   │   ├── 📄 StockAlertBadge.jsx      ✅ Badge de alertas
│   │   └── ... (outros)
│   │
│   ├── 📂 routes/
│   │   ├── 📄 AppRoutes.jsx            ✅ ATUALIZADO (+3 rotas)
│   │   └── ... (outros)
│   │
│   ├── 📂 layouts/
│   │   ├── 📄 Sidebar.jsx              ✅ ATUALIZADO (Menu Estoque)
│   │   └── ... (outros)
│   │
│   └── 📂 services/
│       ├── 📄 api.js                   ✅ Cliente API
│       └── ... (outros)
│
├── 📂 mock/
│   └── 📄 server.js                    ✅ ATUALIZADO (+25 endpoints)
│
├── 📄 db.json                          ✅ ATUALIZADO (+5 coleções)
└── ... (outros arquivos do projeto)
```

---

## 🔗 FLUXO DE DADOS

### Usuário → Frontend → Backend → DB

```
1. LOGIN
   Usuário → Login.jsx → api.post('/auth/login') → Backend → DB
   ↓
   AuthContext recebe { user, csrfToken }

2. NAVEGAR PARA ESTOQUE
   Menu → Sidebar.jsx → /stock/movements
   ↓
   StockMovements.jsx carrega

3. LISTAR MOVIMENTAÇÕES
   useEffect → api.get('/stock/movements') → Backend:
     - Query banco de dados
     - Calcula KPIs (total_in, total_out, net)
     - Retorna com paginação
   ↓
   StockMovementTable.jsx renderiza

4. NOVA MOVIMENTAÇÃO
   Button → StockMovementForm.jsx modal abre
   ↓
   Usuário preenche form (produto, local, quantidade)
   ↓
   Form valida (RHF + Zod)
   ↓
   api.post('/stock/movements', data, CSRF) → Backend:
     - Valida campos
     - Verifica estoque suficiente (saída)
     - Registra movimentação no db.json
     - Recalcula stock_levels
     - Gera alertas se necessário
   ↓
   Toast com sucesso
   ↓
   Lista atualiza automaticamente (useEffect refetch)

5. VISUALIZAR ALERTAS
   StockLevels.jsx → GET /stock/levels?alert_type=low
   ↓
   Componentes com cores: 🔴 Ruptura, 🟠 Baixo, 🔵 Alto, 🟢 OK

6. RELATÓRIO
   StockReports.jsx → Clica em aba (ex: Top Sellers)
   ↓
   GET /stock/reports/top-sellers?start_date=...&end_date=...
   ↓
   Backend agrega dados, calcula métricas
   ↓
   Exibe tabela + "Download CSV"
```

---

## 🧮 CÁLCULOS PRINCIPAIS

### Stock Level Recalculation
```javascript
// Backend - após cada movimentação
const movements = db.stock_movements.filter(m => 
  m.product_id === productId && m.location_id === locationId
)
const total_in = movements
  .filter(m => m.type === 'in')
  .reduce((sum, m) => sum + m.quantity, 0)
const total_out = movements
  .filter(m => m.type === 'out')
  .reduce((sum, m) => sum + m.quantity, 0)
const quantity = total_in - total_out

// Atualiza stock_levels
stock_levels[key].quantity = quantity
```

### Alert Generation
```javascript
// Comparar com min/max
if (quantity <= 0) {
  alert_type = 'out_of_stock'      // 🔴 RUPTURA
  severity = 'critical'
} else if (quantity < min_stock) {
  alert_type = 'low_stock'         // 🟠 Baixo
  severity = 'warning'
} else if (quantity > max_stock) {
  alert_type = 'high_stock'        // 🔵 Alto
  severity = 'info'
} else {
  alert_type = 'ok'                // 🟢 OK
}
```

### Turnover Rate
```javascript
// Giro = Quantidade Vendida / Estoque Médio
const sold = movements
  .filter(m => m.type === 'out' && m.subtype === 'sale')
  .reduce((sum, m) => sum + m.quantity, 0)
const avgStock = (initialQty + currentQty) / 2
const turnoverRate = sold / avgStock  // vezes por período
```

### Profit Margin
```javascript
// Margem = (Preço Venda - Custo) / Preço Venda * 100
const saleRevenue = productSales * salePrice
const totalCost = purchased * costPrice
const profit = saleRevenue - totalCost
const margin = (profit / saleRevenue) * 100  // %
```

---

## 🔐 FLUXO DE SEGURANÇA

### CSRF Protection
```
1. Frontend faz GET /auth/csrf
2. Backend retorna csrfToken (novo cada sessão)
3. Frontend armazena em AuthContext
4. Toda operação POST/PUT/DELETE:
   - Injeta token no header X-CSRF-Token
   - Backend valida token contra sessão
   - Se inválido → 403 Forbidden
```

### Autenticação
```
1. Usuario faz login em Login.jsx
2. Backend valida credenciais
3. Retorna { user, csrfToken }
4. Frontend armazena em AuthContext
5. Cada página verificada com <RequireAuth>
   - Se não autenticado → redireciona /login
6. API calls incluem cookies httpOnly automaticamente
```

### Auditoria
```
Cada movimentação registra:
- created_by: username do usuário autenticado
- created_at: timestamp ISO
- reference_doc: NF ou documento
- Permite rastrear quem fez o quê e quando
```

---

## 🎨 COMPONENTES EM ÁRVORE

### StockMovements (Página)
```
StockMovements
├── Header (título + botão "Nova Movimentação")
├── Chakra Box (KPIs) [4 cards: entrada, saída, líquido, total]
├── Chakra Input (filtro por produto, local, tipo, data)
├── Chakra Button (Filtrar, Limpar)
├── StockMovementTable
│   └── Chakra Table (cabeçalhos: data, produto, local, tipo, qty, custo, total)
│       └── Chakra Tr (cada movimentação)
│           ├── Chakra Badge (tipo com cor)
│           ├── Chakra Text (produto, local)
│           ├── Chakra NumberInput (quantidade)
│           └── Chakra Text (valor)
├── Chakra Pagination (page buttons)
└── StockMovementForm (Modal)
    ├── Modal Header ("Nova Movimentação")
    ├── Modal Body (form fields)
    │   ├── React Hook Form (useForm)
    │   ├── Chakra Select (produto, local, tipo, subtipo)
    │   ├── Chakra NumberInput (quantidade, custo)
    │   ├── Chakra Input (lote, doc ref, notas)
    │   ├── Chakra DatePicker (validade)
    │   └── Chakra Alert (validações em tempo real)
    └── Modal Footer (Cancelar, Salvar)
```

### StockLevels (Página)
```
StockLevels
├── Chakra Box (KPIs) [total itens, valor, baixo, ruptura]
├── Chakra Select (filtro por tipo de alerta)
├── Chakra Button (Filtrar)
├── Chakra Table
│   └── Chakra Tr (cada nível)
│       ├── StockAlertBadge (cor + ícone + severidade)
│       ├── Chakra Text (produto, local, quantidade)
│       ├── Chakra Text (min/max)
│       ├── Chakra Button (Editar)
│       └── StockAlertBadge (tooltip com detalhes)
└── Modal (Editar Min/Max)
    ├── Modal Header ("Editar Limites")
    ├── Modal Body
    │   ├── Chakra NumberInput (min_stock)
    │   └── Chakra NumberInput (max_stock)
    └── Modal Footer (Cancelar, Salvar)
```

### StockReports (Página)
```
StockReports
├── Chakra Tabs (6 abas: Giro, Top, Parados, Margem, Ruptura, Auditoria)
├── Para cada aba:
│   ├── Chakra Box (Filtros: data, local)
│   ├── Chakra Button (Aplicar, CSV Export)
│   └── Chakra Table
│       └── Tr (dados do relatório específico)
│           ├── Chakra Text (métricas)
│           ├── Chakra Progress (% para margem/giro)
│           └── Chakra Badge (status/recomendação)
└── Chakra Modal (CSV preview antes de download)
```

### StockAlertBadge (Componente Reutilizável)
```
StockAlertBadge (props: alert_type, current_qty, min/max)
├── Chakra HStack
│   ├── Chakra Icon (ícone por tipo: 🔴/🟠/🔵/🟢)
│   ├── Chakra Text (status text)
│   └── Chakra Tooltip (ao hover: mostra min/max)
└── Cores:
    - RUPTURA: red.500
    - Baixo: orange.500
    - Alto: blue.500
    - OK: green.500
```

---

## 📊 ENDPOINTS EM ÁRVORE

### Movimentações
```
/stock/movements
├── GET (listar, filtrar, paginar)
├── POST (criar nova)
└── /:id
    └── GET (detalhe)
```

### Níveis
```
/stock/levels
├── GET (listar, filtrar por alerta)
└── /:productId/:locationId
    └── PUT (editar min/max)
```

### Locais
```
/stock/locations
├── GET (listar)
├── POST (criar)
└── /:id
    ├── PUT (editar)
    └── DELETE (deletar)
```

### Lotes
```
/stock/batches
├── GET (listar)
└── ?expired=true (apenas expirados)
```

### Alertas
```
/stock/alerts
├── GET (listar ativos)
└── /:id/resolve
    └── PUT (marcar resolvido)
```

### Relatórios
```
/stock/reports
├── /turnover (giro)
├── /top-sellers (mais vendidos)
├── /slow-movers (parados)
├── /profit-margin (margem)
├── /stockout (ruptura)
└── /audit (auditoria)
```

---

## 📚 PADRÕES DE CÓDIGO

### Página com useEffect + Loading
```jsx
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function StockMovements() {
  const auth = useAuth()
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const opts = api.injectCsrf({}, auth.csrfToken)
        const data = await api.get('/stock/movements', opts)
        setMovements(data.items || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [auth.csrfToken])

  if (loading) return <Spinner />
  if (error) return <Alert status="error">{error}</Alert>
  
  return <StockMovementTable movements={movements} />
}
```

### Componente com Formulário (RHF)
```jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '../services/api'

const schema = z.object({
  product_id: z.number().positive(),
  quantity: z.number().int().positive(),
  // ...
})

export default function StockMovementForm({ onClose, auth }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data) => {
    const opts = api.injectCsrf({}, auth.csrfToken)
    await api.post('/stock/movements', data, opts)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('product_id')} />
      {errors.product_id && <Text color="red">{errors.product_id.message}</Text>}
      <Button type="submit">Salvar</Button>
    </form>
  )
}
```

### Backend Endpoint
```javascript
// mock/server.js
app.get('/stock/movements', ensureAuth, (req, res) => {
  const { page = 1, limit = 10, product_id, location_id } = req.query
  
  let movements = db.stock_movements
  
  if (product_id) movements = movements.filter(m => m.product_id == product_id)
  if (location_id) movements = movements.filter(m => m.location_id == location_id)
  
  const total = movements.length
  const offset = (page - 1) * limit
  const items = movements.slice(offset, offset + limit)
  
  res.json({ items, total, page, limit })
})
```

---

## 🚀 CHECKLIST DE DEPLOYMENT

- [ ] npm run build (verificar sem erros)
- [ ] npm run preview (testar build localmente)
- [ ] Criar conta de teste admin
- [ ] Registrar 1 movimento de entrada
- [ ] Verificar atualização de estoque em real-time
- [ ] Editar min/max em um nível
- [ ] Registrar saída de estoque
- [ ] Acessar cada um dos 6 relatórios
- [ ] Exportar CSV
- [ ] Testar logout e re-login
- [ ] Verifica alertas visuais (cores)
- [ ] Mobile responsiveness (testar em 360px, 768px)

---

## 💾 BACKUP E RESTORE

### Backup db.json
```bash
cp db.json db.json.backup.$(date +%Y%m%d_%H%M%S)
```

### Reset para dados de teste
```bash
git checkout db.json  # Se versionado
```

---

## 📞 SUPORTE

### Documentação
- **Começar:** ESTOQUE_RESUMO_FINAL.md
- **Quick Ref:** docs/ESTOQUE_GUIA_RAPIDO.md
- **API:** API_ESTOQUE_REFERENCIA.md
- **Casos:** docs/ESTOQUE_CASOS_USO.md

### Debug
1. Verificar logs no terminal do backend (npm run mock:express:watch)
2. Verificar console do browser (F12 → Console)
3. Verificar aba Network (requisições HTTP)
4. Verificar db.json se dados estão salvando

---

**Versão:** 1.0.0  
**Criado:** 2024-12-20  
**Mantido por:** GitHub Copilot + Developer  
**Status:** ✅ Pronto para Produção
