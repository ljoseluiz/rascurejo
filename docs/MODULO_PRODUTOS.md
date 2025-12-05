# Módulo de Produtos - Documentação

## 📋 Visão Geral

O módulo de **Produtos** é responsável pelo cadastro, gerenciamento e controle do catálogo de produtos do sistema Varejix. Oferece funcionalidades completas de CRUD, múltiplos preços, variações, histórico de alterações e controle de estoque.

---

## 🏗️ Arquitetura

### Backend (Mock Express)

#### Endpoints Principais

**Produtos (Public/Auth-protected)**

```
GET  /products                    # Listar produtos (com filtros e paginação)
GET  /products/:id                # Obter detalhes de um produto específico
POST /products                    # Criar novo produto (AUTH + CSRF)
PUT  /products/:id                # Atualizar produto (AUTH + CSRF)
DELETE /products/:id              # Deletar produto (AUTH + CSRF)
GET  /products/search             # Busca avançada com múltiplos filtros
GET  /products/categories         # Listar categorias
GET  /products/brands             # Listar marcas dinâmicas
GET  /products/suppliers          # Listar fornecedores
```

#### Query Parameters para GET /products

```
q=termo           # Busca por nome, SKU, barcode ou marca
category=nome     # Filtrar por categoria (ex: "Roupas")
brand=nome        # Filtrar por marca (ex: "TechWear")
active=true|false # Filtrar por status (ativo/inativo)
page=1            # Número da página
limit=10          # Itens por página
```

#### Request/Response Examples

**POST /products** (Criar)
```javascript
// Request
{
  "name": "Camiseta básica",
  "sku": "CAM-001",
  "barcode": "7891234567890",
  "category": "Roupas",
  "subcategory": "Camisetas",
  "brand": "TechWear",
  "supplier": "Fornecedor A",
  "description": "Camiseta 100% algodão",
  "prices": {
    "sale": 29.90,
    "promotion": 24.90,
    "wholesale": 15.00
  },
  "unit": "un",
  "stock": 150,
  "active": true,
  "variations": [
    { "id": 1, "type": "Cor", "value": "Branco" },
    { "id": 2, "type": "Tamanho", "value": "P" }
  ]
}

// Response (201 Created)
{
  "id": 1,
  "name": "Camiseta básica",
  "sku": "CAM-001",
  "barcode": "7891234567890",
  "category": "Roupas",
  "subcategory": "Camisetas",
  "brand": "TechWear",
  "supplier": "Fornecedor A",
  "description": "Camiseta 100% algodão",
  "prices": { "sale": 29.90, "promotion": 24.90, "wholesale": 15.00 },
  "unit": "un",
  "images": [],
  "variations": [
    { "id": 1, "type": "Cor", "value": "Branco" },
    { "id": 2, "type": "Tamanho", "value": "P" }
  ],
  "active": true,
  "stock": 150,
  "createdAt": "2024-12-05T10:00:00Z",
  "updatedAt": "2024-12-05T10:00:00Z",
  "history": [
    {
      "id": 1702814400000,
      "type": "created",
      "field": null,
      "oldValue": null,
      "newValue": null,
      "changedBy": "admin",
      "changedAt": "2024-12-05T10:00:00Z"
    }
  ]
}
```

#### Histórico de Alterações

Cada produto mantém um registro completo de todas as alterações:

```javascript
{
  "id": 1702814400001,
  "type": "updated",          // "created" | "updated"
  "field": "price_sale",      // Campo alterado
  "oldValue": 29.90,          // Valor anterior
  "newValue": 34.90,          // Novo valor
  "changedBy": "admin",       // Usuário que fez a alteração
  "changedAt": "2024-12-05T14:30:00Z"
}
```

---

### Frontend (React + Chakra UI)

#### Estrutura de Componentes

```
src/components/
├── ProductForm.jsx              # Formulário completo de produtos
├── ProductVariations.jsx        # Gerenciador de variações
├── PriceSettings.jsx            # Configuração de múltiplos preços
└── ProductCard.jsx              # Card de exibição (grid view)

src/pages/
├── Products.jsx                 # Página simples (compatibilidade)
├── ProductsAdvanced.jsx         # Página avançada com filtros
└── ProductDetail.jsx            # Detalhes com abas (info, preços, histórico)

src/routes/
└── AppRoutes.jsx                # Rotas: /products-advanced, /products/:id
```

#### Componente: ProductForm

**Props:**
```javascript
{
  product: null,              // null = criar novo, objeto = editar
  onSubmit: () => {},         // Callback após salvar
  onCreated: () => {}         // Callback legado (compatibilidade)
}
```

**Funcionalidades:**
- Validação completa de campos obrigatórios
- Injeção automática de CSRF token
- Carregamento dinâmico de categorias, marcas, fornecedores
- Detecção de SKU duplicado (no servidor)
- Registro automático de alterações no histórico

**Exemplo de Uso:**
```jsx
<ProductForm
  product={null}  // criar novo
  onSubmit={(data) => {
    console.log('Produto salvo:', data)
    navigateTo('/products-advanced')
  }}
/>
```

#### Componente: ProductVariations

**Props:**
```javascript
{
  variations: [
    { id: 1, type: "Cor", value: "Branco" },
    { id: 2, type: "Tamanho", value: "P" }
  ],
  onChange: (newVariations) => {}
}
```

**Funcionalidades:**
- Adicionar/remover variações dinamicamente
- Suporta tipos customizáveis (Cor, Tamanho, Modelo, etc)
- Validação de campos não vazios

#### Componente: PriceSettings

**Props:**
```javascript
{
  prices: { sale: 29.90, promotion: 24.90, wholesale: 15.00 },
  onChange: (newPrices) => {}
}
```

**Funcionalidades:**
- 3 tipos de preço: venda, promoção, atacado
- Validação de valores numéricos
- Display em grid responsivo

---

## 🔄 Fluxos de Dados

### 1. Criar Produto

```
ProductForm (valida)
    ↓
api.post('/products', data, { CSRF token })
    ↓
Backend: validateProduct() → verificar SKU → salvar + criar history
    ↓
201 Created + novo produto com ID
    ↓
ProductsAdvanced: reload list
```

### 2. Editar Produto

```
ProductsAdvanced → clica edit
    ↓
Modal abre com ProductForm (product prop preenchido)
    ↓
api.put('/products/:id', data, { CSRF token })
    ↓
Backend: validar → registrar alterações no history
    ↓
200 OK + produto atualizado
    ↓
ProductDetail ou ProductsAdvanced recarrega
```

### 3. Filtrar Produtos

```
ProductsAdvanced: usuário altera filtros
    ↓
GET /products?q=termo&category=Roupas&brand=TechWear&active=true&page=1&limit=10
    ↓
Backend: aplicar filtros em memória
    ↓
{
  items: [...filtered products],
  total: 42,
  page: 1,
  limit: 10
}
```

### 4. Visualizar Histórico

```
ProductDetail → Aba "Histórico"
    ↓
Exibe product.history (array de alterações)
    ↓
Mostra: tipo de alteração, campo, valores antes/depois, quem alterou, quando
```

---

## 📊 Schema de Dados (db.json)

```javascript
{
  "products": [
    {
      "id": 1,
      "name": "Camiseta básica",
      "sku": "CAM-001",
      "barcode": "7891234567890",
      "category": "Roupas",
      "subcategory": "Camisetas",
      "brand": "TechWear",
      "supplier": "Fornecedor A",
      "description": "Camiseta 100% algodão...",
      "prices": {
        "sale": 29.90,           // preço de venda principal
        "promotion": 24.90,      // preço com desconto/promoção
        "wholesale": 15.00       // preço para atacado
      },
      "unit": "un",             // "un", "kg", "g", "l", "ml", "m", "pacote", "caixa"
      "images": [
        { "id": 1, "url": "https://...", "alt": "Camiseta view 1" }
      ],
      "variations": [
        { "id": 1, "type": "Cor", "value": "Branco" },
        { "id": 2, "type": "Tamanho", "value": "P" }
      ],
      "active": true,           // produto ativo ou inativo
      "stock": 150,             // quantidade em estoque
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "history": [
        {
          "id": 1702814400000,
          "type": "created",
          "field": null,
          "oldValue": null,
          "newValue": null,
          "changedBy": "admin",
          "changedAt": "2024-01-15T10:00:00Z"
        },
        {
          "id": 1702814400001,
          "type": "updated",
          "field": "price_sale",
          "oldValue": 25.00,
          "newValue": 29.90,
          "changedBy": "admin",
          "changedAt": "2024-01-16T14:30:00Z"
        }
      ]
    }
  ],
  "categories": [...],
  "brands": [...],
  "suppliers": [...]
}
```

---

## 🎯 Padrões e Convenções

### 1. Validação de Produto

**Campo Obrigatório:**
- `name` (não vazio)
- `sku` (não vazio, único no sistema)
- `category` (deve existir)
- `brand` (não vazio)
- `prices.sale` (número > 0)

**Validação no Backend:**
```javascript
function validateProduct(body) {
  const errors = []
  if (!body.name?.trim()) errors.push('Nome do produto é obrigatório')
  if (!body.sku?.trim()) errors.push('SKU é obrigatório')
  // ... mais validações
  return { valid: errors.length === 0, errors }
}
```

### 2. Injeção de CSRF Token

**SEMPRE** ao fazer POST/PUT/DELETE:

```jsx
const opts = api.injectCsrf({}, auth.csrfToken)
await api.post('/products', data, opts)
```

### 3. Histórico de Alterações

**Automático** ao atualizar produto:
- Compare campo anterior com novo
- Se diferente, crie entry em `product.history`
- Registre: tipo, campo, valores antes/depois, usuário, timestamp

---

## 🚀 Guia: Adicionar Nova Funcionalidade

### Exemplo: Adicionar campo "Peso"

**1. Backend (mock/server.js)**
```javascript
// Adicionar ao schema de validação
if (body.weight !== undefined && isNaN(parseFloat(body.weight))) {
  errors.push('Peso deve ser um número')
}

// Adicionar ao create
const newProduct = {
  // ...
  weight: parseFloat(body.weight) || 0,
  weightUnit: body.weightUnit || 'kg'
}

// Adicionar ao update com histórico
if (body.weight !== undefined && body.weight !== product.weight) {
  historyEntries.push(createHistoryEntry('updated', 'weight', product.weight, body.weight, req.user?.username))
  product.weight = parseFloat(body.weight)
}
```

**2. Frontend - ProductForm.jsx**
```jsx
// Adicionar input no formulário
<Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} w="full">
  <FormControl>
    <FormLabel>Peso</FormLabel>
    <Input
      name="weight"
      type="number"
      value={formData.weight}
      onChange={handleInputChange}
      bg="white"
    />
  </FormControl>
  
  <FormControl>
    <FormLabel>Unidade</FormLabel>
    <Select name="weightUnit" value={formData.weightUnit} onChange={handleInputChange} bg="white">
      <option value="kg">Kg</option>
      <option value="g">Gramas</option>
    </Select>
  </FormControl>
</Grid>
```

**3. Atualizar formData state**
```jsx
const [formData, setFormData] = useState({
  // ...
  weight: 0,
  weightUnit: 'kg'
})

// ao preencher de produto existente:
if (product) {
  setFormData({
    // ...
    weight: product.weight || 0,
    weightUnit: product.weightUnit || 'kg'
  })
}
```

---

## 🐛 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|--------|
| "SKU já existe" | Tentando criar com SKU duplicado | Verificar se SKU é único antes de enviar |
| "CSRF token missing" | Token não foi injetado | Sempre usar `api.injectCsrf()` em POST/PUT/DELETE |
| Alterações não aparecem no histórico | Campo não foi registrado no update | Adicionar `historyEntries.push()` no backend PUT |
| Filtros não funcionam | Query params incorretos | Verificar nomes exatos: `category`, `brand`, `active` |
| Categoria/Marca não carregam | Endpoint retorna erro | Verificar se endpoints `/products/categories` etc existem |

---

## 📝 Checklist para Novos Desenvolvedores

- [ ] Entender estrutura de `db.json` (schema de produtos)
- [ ] Testar endpoints com Postman ou similar
- [ ] Rodar `npm run mock:express:watch` para backend
- [ ] Rodar `npm run dev` para frontend
- [ ] Testar fluxo: criar → editar → deletar produto
- [ ] Verificar histórico após alterações
- [ ] Testar filtros (categoria, marca, status)
- [ ] Verificar paginação
- [ ] Confirmar CSRF token é injetado automaticamente
- [ ] Testar com 2 tabs abertos (simular concorrência)

---

## 🔗 Arquivos Relacionados

- `db.json` - Dados iniciais e schema
- `mock/server.js` - Endpoints de produtos (linhas ~150-400)
- `src/components/ProductForm.jsx` - Formulário principal
- `src/pages/ProductsAdvanced.jsx` - Listagem com filtros
- `src/pages/ProductDetail.jsx` - Detalhes e edição com abas
- `.github/copilot-instructions.md` - Instruções globais para IA

