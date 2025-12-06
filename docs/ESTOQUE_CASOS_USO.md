# Casos de Uso - Módulo de Estoque

## Caso de Uso 1: Gerenciar Compra de Fornecedor

### Cenário
Uma loja recebe 50 unidades de Camiseta básica do fornecedor A.

### Passos
1. Acesse `/stock/movements`
2. Clique em "Nova Movimentação"
3. Preencha:
   - Produto: "Camiseta básica"
   - Local: "Depósito Central"
   - Tipo: **Entrada**
   - Subtipo: **Compra**
   - Quantidade: **50**
   - Custo unitário: **12.00**
   - Lote: **LOTE-2024-001**
   - Data validade: (deixar em branco)
   - Documento: **NF-12345**
   - Observações: "Compra fornecedor A"
4. Clique em "Registrar Movimentação"

### Resultado
- ✅ Estoque atualizado: +50 unidades
- ✅ Nível recalculado automaticamente
- ✅ Alerta de "estoque alto" criado se acima do máximo
- ✅ Auditoria registra: quem, quando, qual documento
- ✅ Campo `product.stock` atualizado (total de todos locais)

### SQL Equivalente (referência)
```sql
INSERT INTO stock_movements (
  product_id, location_id, type, subtype, quantity, unit_cost,
  batch_number, reference_doc, created_by, created_at
) VALUES (1, 1, 'in', 'purchase', 50, 12.00, 'LOTE-2024-001', 'NF-12345', 'admin', NOW());

UPDATE stock_levels 
SET quantity = quantity + 50, last_updated = NOW()
WHERE product_id = 1 AND location_id = 1;
```

---

## Caso de Uso 2: Registrar Venda em Loja Física

### Cenário
Vendedor em loja física vende 3 unidades de Camiseta para cliente.

### Passos
1. Acesse `/stock/movements`
2. Clique em "Nova Movimentação"
3. Preencha:
   - Produto: "Camiseta básica"
   - Local: "Loja Física - Centro"
   - Tipo: **Saída**
   - Subtipo: **Venda**
   - Quantidade: **3**
   - Lote: LOTE-2024-001
   - Documento: VENDA-001
4. Clique em "Registrar Movimentação"

### Resultado
- ✅ Estoque validado (há 3 em Loja Física?)
- ✅ Se SIM: registra e desconta
- ✅ Se NÃO: erro "Estoque insuficiente"
- ✅ Nível recalculado
- ✅ Se cair abaixo do mínimo: alerta "Estoque Baixo"
- ✅ Auditoria completa

### Dashboard Atualizado
- Antes: Total saídas = 20, saldo = 80
- Depois: Total saídas = 23, saldo = 77

---

## Caso de Uso 3: Identificar Produtos Parados

### Cenário
Gerente quer limpar estoque de produtos sem movimento.

### Passos
1. Acesse `/stock/reports`
2. Clique em **"Produtos Parados"**
3. Selecione período: **30 dias**
4. Local: Todos (deixar em branco)
5. Clique em **"Filtrar"**

### Resultado
Tabela mostra:
| Produto | Local | Qtd | Valor Custo | Valor Venda | Dias Parado |
|---------|-------|-----|-------------|------------|------------|
| Produto X | Depósito | 20 | R$ 400 | R$ 600 | 120 dias |
| Produto Y | Loja | 5 | R$ 50 | R$ 100 | 95 dias |

### Ação Recomendada
- Liquidar com promoção (ex: -30% ou -50%)
- Libera capital de giro
- Evita perda por obsolescência

### Exportar para Excel
1. Clique em **"CSV"**
2. Arquivo baixado: `produtos_parados_2025-01-15.csv`
3. Compartilhe com gerência

---

## Caso de Uso 4: Ajustar Limites de Estoque

### Cenário
Após análise, decidem que Camiseta deve ter mínimo de 50 e máximo de 300 em Depósito.

### Passos
1. Acesse `/stock/levels`
2. Busque "Camiseta básica" | "Depósito Central"
3. Clique no ícone de edição (lápis)
4. Modal abre:
   - Estoque Mínimo: **50**
   - Estoque Máximo: **300**
5. Clique em **"Salvar"**

### Resultado
- ✅ Limites atualizados
- ✅ Sistema revalida alertas:
  - Se atual < 50: gera alerta "Estoque Baixo"
  - Se atual > 300: gera alerta "Estoque Alto"
  - Se ok: remove alerta

### Aplicação Futura
Próximas movimentações respeitarão novos limites.

---

## Caso de Uso 5: Analisar Rentabilidade

### Cenário
Gerente quer saber quais produtos mais lucram.

### Passos
1. Acesse `/stock/reports`
2. Clique em **"Margem de Lucro"**
3. Clique em **"Filtrar"** (sem filtros = todos)

### Resultado
Tabela ordenada por margem % DESC:

| Produto | Venda | Custo | Lucro Unit | Margem % | Estoque | Lucro Potencial |
|---------|-------|-------|-----------|----------|---------|-----------------|
| Camiseta | R$29.90 | R$12 | R$17.90 | **59.87%** | 100 | R$ 1.790 |
| Calça | R$129 | R$65 | R$64 | **49.6%** | 50 | R$ 3.200 |
| Tênis | R$199.90 | R$95 | R$104.90 | **52.5%** | 30 | R$ 3.147 |

### Insights
- Camiseta: menor margem mas volume compensa
- Calça: melhor relação quantidade/lucro
- Tênis: melhor lucro potencial

### Decisão
- Aumentar estoque de Calça (melhor retorno)
- Revisar preço de Camiseta (baixa margem)
- Manter Tênis estratégico (premium)

---

## Caso de Uso 6: Auditoria e Conformidade

### Cenário
Contador precisa validar movimentações de estoque para nota fiscal.

### Passos
1. Acesse `/stock/reports`
2. Clique em **"Auditoria"**
3. Preencha:
   - Data inicial: **01/01/2025**
   - Data final: **31/01/2025**
   - Local: **Depósito Central**
4. Clique em **"Filtrar"**

### Resultado
Tabela com:
- Cada movimento (entrada/saída)
- Quem: criado por qual usuário
- Data e hora exata
- Documento de referência
- Valor total

**Resumo no topo:**
```
Total Movimentações:  50
Entradas:            +300 unidades / R$ 3.600
Saídas:              -250 unidades / R$ 5.000
Saldo:               +50 unidades
```

### Uso
- Validar com nota fiscal
- Identificar divergências
- Gerar relatório de conformidade
- Exportar para auditor: **CSV**

---

## Caso de Uso 7: Encontrar Produtos em Ruptura

### Cenário
Gerente quer ver quais produtos estão com FALTA urgente.

### Passos
1. Acesse `/stock/reports`
2. Clique em **"Ruptura"**
3. Local: (deixar em branco = todos)
4. Clique em **"Filtrar"**

### Resultado
Tabela priorizada:
1. Quantidade ≤ 0 (RUPTURA) - topo
2. Quantidade < mínimo - depois

| Status | Produto | Local | Qtd | Mín | Reposição |
|--------|---------|-------|-----|-----|-----------|
| 🔴 RUPTURA | Calça | Loja | 0 | 15 | 100 |
| 🟠 Baixo | Camiseta | Loja | 5 | 20 | 75 |

### Ação Imediata
1. Transferir estoque do Depósito para Loja
2. Ou fazer compra urgente
3. Informar vendedor: não há para vender

---

## Caso de Uso 8: Comparar Desempenho entre Locais

### Cenário
Analisar qual local (Depósito vs Loja) tem melhor giro.

### Passos
1. Acesse `/stock/reports`
2. Clique em **"Giro de Estoque"**
3. Período: **Últimos 90 dias**
4. Local: **Depósito Central**
5. Clique em **"Filtrar"**
6. Anote o giro médio
7. Repita para **Loja Física - Centro**

### Resultado
- **Depósito Central**: Giro 1.5x (estoque de segurança)
- **Loja Física**: Giro 4.2x (muito dinâmico)

### Insights
- Loja: estoque roda 4 vezes em 90 dias
- Depósito: é buffer
- Rebalancear estoques conforme demanda

---

## Caso de Uso 9: Transferência entre Locais

### Cenário
Transferir 20 unidades de Camiseta do Depósito para Loja.

### Passos A - Saída do Depósito
1. Acesse `/stock/movements`
2. "Nova Movimentação":
   - Produto: Camiseta
   - Local: **Depósito Central** (origem)
   - Tipo: **Saída**
   - Subtipo: **Transferência (saída)**
   - Quantidade: 20
   - Documento: TR-001
   - Clique em **"Registrar"**

### Passos B - Entrada na Loja
1. "Nova Movimentação":
   - Produto: Camiseta
   - Local: **Loja Física - Centro** (destino)
   - Tipo: **Entrada**
   - Subtipo: **Transferência (entrada)**
   - Quantidade: 20
   - Documento: TR-001 (mesmo número)
   - Clique em **"Registrar"**

### Resultado
- ✅ Depósito: -20 unidades
- ✅ Loja: +20 unidades
- ✅ Product.stock: sem mudança (apenas mudou de local)
- ✅ Auditoria rastreável com documento TR-001

---

## Caso de Uso 10: Conferência Física (Inventário)

### Cenário
Fazem conferência física e encontram 5 unidades perdidas de Camiseta.

### Passos
1. Acesse `/stock/movements`
2. "Nova Movimentação":
   - Produto: Camiseta
   - Local: Depósito Central
   - Tipo: **Saída**
   - Subtipo: **Ajuste negativo**
   - Quantidade: 5
   - Documento: CONF-2025-001
   - Observações: "Conferência física - 5 unidades danificadas"
3. Clique em **"Registrar"**

### Resultado
- ✅ Estoque reduzido: -5
- ✅ Registrado como ajuste (não venda)
- ✅ Auditoria mostra motivo
- ✅ Pode gerar relatório de perdas

---

## Caso de Uso 11: Monitorar Alertas em Dashboard

### Cenário
Gerente abre o sistema e quer ver alertas pendentes.

### Passos
1. Acesse `/stock/levels`
2. Filtro: "Tipo de alerta" = **RUPTURA**
3. Visualiza lista de produtos críticos

### Resultado
Prioridades visuais:
- 🔴 RUPTURA: 2 produtos
- 🟠 Estoque Baixo: 5 produtos
- 🔵 Estoque Alto: 1 produto

### Ação
- Reposição urgente
- Informar vendedor
- Atualizar planejamento

---

## Caso de Uso 12: Relatório de Giro para Diretoria

### Cenário
Diretor quer apresentar performance do estoque.

### Passos
1. Acesse `/stock/reports`
2. Clique em **"Giro de Estoque"**
3. Período: **Últimos 6 meses**
4. Clique em **"Filtrar"**
5. Clique em **"CSV"**
6. Arquivo: `giro_estoque_2025-01-15.csv`

### Arquivo CSV
```csv
product_name,product_sku,total_sold,average_stock,turnover_rate,days_in_period
Camiseta básica,CAM-001,500,100,5.00,180
Calça jeans,CAL-002,150,50,3.00,180
Tênis esporte,TEN-003,50,30,1.67,180
```

### Apresentação
- Giro médio: 3.22x em 6 meses
- Produtos acelerados: Camiseta
- Produtos lentos: Tênis
- Recomendação: aumentar Camiseta, revisar preço Tênis

---

## Fluxo de Semana Típica

### Segunda-feira
- Fazer recebimento de fornecedor (Caso 1)
- Registrar entradas no sistema
- Gerar alerta de falta de produtos

### Quarta-feira
- Visita a Loja Física
- Registrar vendas do mês anterior (Caso 2)
- Transferir estoque conforme necessário (Caso 9)

### Sexta-feira
- Revisar alertas de ruptura (Caso 11)
- Fazer conferência física (Caso 10)
- Gerar relatório semanal de giro (Caso 12)

### Mensalmente
- Análise de margem (Caso 5)
- Identificar produtos parados (Caso 3)
- Ajustar limites conforme vendas (Caso 4)
- Auditoria de conformidade (Caso 6)

---

## Métricas Chave Monitorar

| Métrica | Target | Ferramenta |
|---------|--------|-----------|
| Giro médio | > 3x | `/stock/reports/turnover` |
| Margem média | > 35% | `/stock/reports/profit-margin` |
| Ruptura | < 5% | `/stock/reports/stockout` |
| Produtos parados | < 10% | `/stock/reports/slow-movers` |
| Acurácia física | > 98% | `/stock/reports/audit` |

---

## 🎯 Conclusão

O módulo de estoque fornece **visibilidade total** e **automação inteligente** para:
- ✅ Evitar rupturas
- ✅ Otimizar capital de giro
- ✅ Aumentar rentabilidade
- ✅ Rastrear conformidade
- ✅ Tomar decisões data-driven

**Tempo de aprendizado:** ~2 horas  
**Impacto esperado:** -30% custos, +20% satisfação cliente
