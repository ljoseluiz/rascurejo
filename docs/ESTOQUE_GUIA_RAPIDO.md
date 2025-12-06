# Estoque - Guia Rápido

## 🎯 Acesso Rápido

| Página | URL | Função |
|--------|-----|--------|
| Movimentações | `/stock/movements` | Registrar entrada/saída |
| Níveis | `/stock/levels` | Editar min/max, visualizar |
| Relatórios | `/stock/reports` | 6 relatórios + CSV export |
| Inventário | `/inventory` | Visão consolidada |

---

## 📍 Menu Lateral

```
Estoque (submenu)
├── Movimentações 📦
├── Níveis de Estoque 📈
└── Relatórios 📄
```

---

## 🚀 Fluxos Rápidos

### Registrar Compra
1. Clique em `Nova Movimentação`
2. Produto: (selecione)
3. Local: (selecione)
4. Tipo: **Entrada**
5. Subtipo: **Compra**
6. Quantidade: (valor)
7. Custo: (valor)
8. Documento: NF-xxxxx
9. Clique em **Registrar**

### Registrar Venda
1. Clique em `Nova Movimentação`
2. Produto: (selecione)
3. Local: (selecione)
4. Tipo: **Saída**
5. Subtipo: **Venda**
6. Quantidade: (valor)
7. Clique em **Registrar**

### Editar Limites Min/Max
1. Vá para `/stock/levels`
2. Clique no ícone de edição (lápis)
3. Defina: Mínimo e Máximo
4. Clique em **Salvar**

### Encontrar Produtos Parados
1. Vá para `/stock/reports`
2. Clique em **Produtos Parados**
3. Selecione período (ex: 30 dias)
4. Clique em **Filtrar**
5. Clique em **CSV** para exportar

---

## 🔢 Endpoints Principais

```bash
# Movimentações
GET    /stock/movements
POST   /stock/movements

# Níveis
GET    /stock/levels
PUT    /stock/levels/:product_id/:location_id

# Locais
GET    /stock/locations
POST   /stock/locations
DELETE /stock/locations/:id

# Relatórios
GET    /stock/reports/turnover
GET    /stock/reports/top-sellers
GET    /stock/reports/slow-movers
GET    /stock/reports/profit-margin
GET    /stock/reports/stockout
GET    /stock/reports/audit

# Alertas
GET    /stock/alerts
PUT    /stock/alerts/:id/resolve
```

---

## ⚠️ Alertas e Meanings

| Badge | Cor | Significado | Ação |
|-------|-----|-------------|------|
| RUPTURA | 🔴 Vermelho | Quantidade ≤ 0 | Reposição urgente |
| Estoque Baixo | 🟠 Laranja | Qtd < mínimo | Reposição em breve |
| Estoque Alto | 🔵 Azul | Qtd > máximo | Considere promoção |
| OK | 🟢 Verde | Dentro dos limites | Sem ação |

---

## 📊 Interpretar Relatórios

### Giro de Estoque
- **> 3x**: Produto rápido, pode aumentar estoque
- **1-3x**: Produto normal
- **< 1x**: Produto lento, reduzir quantidade

### Mais Vendidos
- Ranking por quantidade vendida
- Use para definir estoque mínimo/máximo
- Revise a cada mês

### Produtos Parados
- Sem movimento há 30/60/90 dias
- Considere liquidar com promoção
- Libera capital de giro

### Margem de Lucro
- % = (Preço Venda - Preço Custo) / Preço Venda
- Idealmente > 30%
- Produtos < 15% reconsidere

### Ruptura
- Produtos críticos em falta
- Reposição imediata
- Verificar previsão de vendas

### Auditoria
- Trilha completa de movimentações
- Filtrar por período ou usuário
- Resumo com valores

---

## 💡 Dicas

1. **Configurar Min/Max:** Use o giro histórico como referência
2. **Lotes:** Obrigatório apenas para alimentos/medicamentos
3. **Exportar:** Todos os relatórios têm botão CSV
4. **Transferências:** Use subtipo "transfer_in" e "transfer_out"
5. **Ajustes:** Use "adjustment_positive/negative" para conferência
6. **Busca:** Funciona por produto, SKU, local ou documento

---

## 🔗 Relacionados

- **Products**: `/products-advanced`
- **Inventory**: `/inventory`
- **Sales**: `/sales`
- **General Reports**: `/reports`

---

## 🎨 Filtros Disponíveis

### Movimentações
- Tipo (Entrada/Saída)
- Produto
- Local
- Data (de/até)
- Busca por termo

### Níveis
- Alert Type (Ruptura/Baixo/Alto)
- Local

### Relatórios
- Período
- Local
- Limite (top sellers)
- Dias (products parados)

---

## 🚨 Erros Comuns

**Erro:** "Estoque insuficiente"
→ Verifique quantidade disponível antes de criar saída

**Erro:** "Não é possível deletar local com estoque"
→ Transfira estoque para outro local primeiro

**Erro:** "Campo obrigatório: produto"
→ Selecione um produto válido

**Erro:** "Quantidade deve ser > 0"
→ Digite um valor positivo

---

## 📱 Mobile

Todas as páginas são responsivas:
- Tabelas rolam horizontalmente em mobile
- Modais adaptados para tela pequena
- Filtros em coluna única em mobile

---

## 🔐 Permissões

Todas as operações requerem autenticação.
Admin (padrão: admin/password) tem acesso completo.

---

## 📞 Support

Dúvidas? Consulte:
- Docs completo: `MODULO_ESTOQUE.md`
- Código: `src/pages/Stock*.jsx`
- Backend: `mock/server.js`

