# Backend - Varejix Retail Management System

Backend profissional para o sistema Varejix, construído com Node.js, Express e Prisma.

## 📋 Tecnologias

- **Node.js** (v18+)
- **Express** v5.2.1 - Framework web
- **Prisma** v5.15.1 - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **ES Modules** - Sintaxe moderna de módulos
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Pino** - Logging estruturado
- **Cookie Parser** - Gerenciamento de cookies
- **Zod** - Validação de schemas

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL (local ou Supabase)
- npm ou yarn

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/ljoseluiz/rascurejo.git
cd rascurejo/backend

# 2. Instale as dependências
npm install

# 3. Configure o arquivo .env
cp .env.example .env
# Edite o .env com suas credenciais de banco de dados

# 4. Gere o Prisma Client
npm run prisma:generate

# 5. Execute as migrations
npm run prisma:migrate

# 6. Popule o banco com dados iniciais (opcional)
npm run db:seed

# 7. Inicie o servidor
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

## 🔧 Configuração

### Arquivo .env

Crie um arquivo `.env` na pasta `backend/` com as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/varejix?schema=public"

# Ambiente
NODE_ENV=development

# Logging
LOG_LEVEL=info

# API
API_PREFIX=/api

# CORS - Origens permitidas (separadas por vírgula)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Seed (opcional - para customizar usuário admin)
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=admin123
```

### Configuração com Supabase

Se você estiver usando Supabase:

```env
DATABASE_URL="postgresql://postgres:[SUA_SENHA]@db.[SEU_PROJETO].supabase.co:5432/postgres?schema=public"
```

Encontre sua senha em: Supabase Dashboard → Settings → Database → Database password

## 📁 Estrutura do Projeto

```
backend/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seeds.js           # Script de seed
├── src/
│   ├── lib/
│   │   ├── auth.js        # Autenticação e sessões
│   │   └── prisma.js      # Cliente Prisma
│   ├── middlewares/
│   │   ├── csrf.js        # Proteção CSRF
│   │   └── error.js       # Manipulação de erros
│   ├── routes/
│   │   ├── auth.js        # Rotas de autenticação
│   │   ├── products.js    # Rotas de produtos
│   │   ├── sales.js       # Rotas de vendas
│   │   ├── stats.js       # Rotas de estatísticas
│   │   └── reports.js     # Rotas de relatórios
│   ├── app.js             # Configuração do Express
│   └── server.js          # Ponto de entrada
├── package.json
└── .env
```

## 🛣️ Rotas da API

### Autenticação

- `POST /auth/login` - Fazer login
- `GET /auth/csrf` - Obter token CSRF
- `GET /auth/me` - Obter usuário atual
- `POST /auth/logout` - Fazer logout

### Produtos

- `GET /products` - Listar produtos (paginado)
- `GET /products/categories` - Listar categorias
- `GET /products/brands` - Listar marcas
- `GET /products/suppliers` - Listar fornecedores
- `GET /products/units` - Listar unidades
- `POST /products` - Criar produto
- `PUT /products/:id` - Atualizar produto
- `DELETE /products/:id` - Deletar produto

### Estatísticas

- `GET /stats` - Estatísticas gerais
- `GET /sales/stats` - Estatísticas de vendas

### Relatórios

- `GET /reports/products.csv` - Exportar produtos em CSV

**Nota:** Todas as rotas estão disponíveis com prefixo `/api` (ex: `/api/products`) e sem prefixo (ex: `/products`) para compatibilidade com o proxy do Vite.

## 🔐 Autenticação e Segurança

### Sessões

O sistema utiliza **sessões em memória** (desenvolvimento) com cookies httpOnly:
- Duração: 12 horas
- Limpeza automática: a cada 30 minutos
- Cookie: `session`

**Produção:** Substituir por Redis ou store de sessão baseado em banco de dados.

### CSRF Protection

Proteção CSRF ativa para métodos `POST`, `PUT`, `PATCH`, `DELETE`:
- Token obtido via `GET /auth/csrf` ou no login
- Enviar token no header `X-CSRF-Token`
- GET requests não requerem token

### CORS

Configurado para aceitar requisições de:
- `http://localhost:5173` (frontend dev)
- `http://127.0.0.1:5173` (frontend dev alternativo)

Credentials habilitado para suporte a cookies.

## 📊 Banco de Dados

### Schema Principal

- **users** - Usuários do sistema
- **products** - Produtos
- **product_categories** - Categorias de produtos
- **product_brands** - Marcas
- **product_units** - Unidades de medida
- **suppliers** - Fornecedores

### Comandos Prisma

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar nova migration
npm run prisma:migrate

# Abrir Prisma Studio (GUI)
npx prisma studio

# Seed do banco
npm run db:seed
```

## 🧪 Usuário Padrão

Após rodar `npm run db:seed`, um usuário admin é criado:

```
Username: admin
Senha: admin123
```

Para customizar:
```bash
# Windows PowerShell
$env:SEED_ADMIN_USERNAME="seu_usuario"
$env:SEED_ADMIN_PASSWORD="sua_senha"
npm run db:seed

# Linux/Mac
SEED_ADMIN_USERNAME=seu_usuario SEED_ADMIN_PASSWORD=sua_senha npm run db:seed
```

## 🔄 Scripts NPM

```bash
npm run dev              # Inicia servidor de desenvolvimento
npm start                # Inicia servidor de produção
npm run prisma:generate  # Gera Prisma Client
npm run prisma:migrate   # Executa migrations
npm run db:seed          # Popula banco com dados iniciais
npm test                 # Executa testes (placeholder)
```

## 🐛 Troubleshooting

### Erro: "Cannot find package 'dotenv'"

```bash
npm install
```

### Erro: "Environment variable not found: DATABASE_URL"

Certifique-se de que o arquivo `.env` existe em `backend/` e contém `DATABASE_URL`.

### Erro: "Can't reach database server"

- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Para Supabase, verifique a senha e URL

### Erro 404 em rotas

O backend monta rotas em dois padrões:
- Com prefixo: `/api/products`
- Sem prefixo: `/products`

Verifique qual o frontend está usando.

## 📝 Desenvolvimento

### Adicionando Nova Rota

1. Crie o arquivo em `src/routes/`
2. Importe em `src/app.js`
3. Monte o router com dual-path:

```javascript
import novaRouter from "./routes/nova.js";

// Em app.js
const routes = [
  // ...
  { path: "/nova", router: novaRouter },
];
```

### Adicionando Middleware

Middlewares globais vão em `src/app.js`.
Middlewares específicos de rota vão no arquivo da rota.

### Logging

Use o logger Pino para logs estruturados:

```javascript
import { logger } from "./lib/logger.js";

logger.info({ userId: 123 }, "User logged in");
logger.error({ err }, "Database error");
```

## 🚀 Deploy em Produção

### Checklist

- [ ] Substituir sessões em memória por Redis/DB
- [ ] Configurar variáveis de ambiente de produção
- [ ] Usar bcrypt para hash de senhas (substituir SHA-256)
- [ ] Configurar CORS para domínios específicos
- [ ] Ativar HTTPS (secure cookies)
- [ ] Configurar rate limiting
- [ ] Configurar monitoramento e alertas
- [ ] Backup do banco de dados

### Variáveis de Ambiente (Produção)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
API_PREFIX=/api
CORS_ALLOWED_ORIGINS=https://seuapp.com
LOG_LEVEL=warn
```

## 📚 Documentação Adicional

- [BACKEND_FIX_SUMMARY.md](./BACKEND_FIX_SUMMARY.md) - Resumo das correções de compatibilidade
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Documentation](https://expressjs.com/)

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Ver arquivo LICENSE no repositório principal.

## 👥 Autores

- [@ljoseluiz](https://github.com/ljoseluiz) - Desenvolvimento e manutenção
- [@cristovao-pereira](https://github.com/cristovao-pereira) - Criador original do Varejix

---

**Status:** ✅ Produção-ready para desenvolvimento | ⚠️ Requer ajustes para produção (ver checklist)
