# Varejix — Gestão Varejista (esqueleto)

Projeto inicial para um painel de gestão varejista feito com React + Vite (JavaScript).

Quick start (PowerShell):

```powershell
cd c:\Apps\varejix
npm install
npm run dev
```

Comandos úteis:

- `npm run dev` — inicia servidor de desenvolvimento (Vite)
- `npm run build` — cria build de produção
- `npm run preview` — pré-visualiza o build de produção localmente

Próximos passos sugeridos:

- Escolher solução de roteamento (React Router) e criar `src/routes/*`
- Decidir estado global (Context, Redux, Zustand)
- Especificar API backend (endpoints REST/GraphQL) e criar `src/services/api.js`
- Adicionar testes com `vitest` e `testing-library/react`

This scaffold now includes routing and an example API client:

- Routes are in `src/routes/AppRoutes.jsx` and pages in `src/pages/`.
- API client: `src/services/api.js` — small fetch wrapper using `VITE_API_BASE_URL`.

Example: `src/pages/Products.jsx` uses `api.get('/products')` and falls back to sample data if the backend is unavailable.

Local backend options (quick start)

1) Mock with `json-server` (recommended to start quickly)

```powershell
cd c:\Apps\varejix
npm install
npm run mock    # starts json-server on port 3000
npm run dev     # starts Vite dev server on 5173
```

The dev server is configured to proxy `/api/*` to `http://localhost:3000`.
`src/services/api.js` will, in development, automatically route requests through `/api` if
`VITE_API_BASE_URL` is not set. The mock `db.json` contains a `/products` collection for testing.

2) Mock with Express (auth, protected endpoints, pagination)

This scaffold also includes a small Express mock server that supports:
- `POST /auth/login` — accepts `{ username, password }` and returns `{ user }` (demo user: `admin` / `password`) while setting an httpOnly cookie `auth_token` for subsequent authenticated requests.
- `GET /products?q=&page=&limit=` — public, supports filtering and pagination, returns `{ items, total, page, limit }`.
- Protected routes: `GET /inventory`, `GET /sales`, `POST /products` (require authentication; the app sends credentials so the server reads the httpOnly cookie).
 
CSRF mitigation (development mock)

- The Express mock sets a non-httpOnly cookie `csrf_token` on successful login (double-submit cookie pattern).
- For state-changing requests (POST/PUT/DELETE) the frontend automatically reads `csrf_token` from `document.cookie` and sends it in the `X-CSRF-Token` header. The mock server verifies header === cookie for these requests.
- The dev server is configured to include credentials so cookies are sent automatically (`fetch` uses `credentials: 'include'`).

To test CSRF protection:

1. Start the Express mock and dev server:

```powershell
npm run mock:express:watch
npm run dev
```

2. Login at `http://localhost:5173/login` (admin/password). The mock will set `auth_token` (httpOnly) and `csrf_token` (readable).
3. Use the UI to create a product (or call POST `/products`) — the frontend will send `X-CSRF-Token` header matching the `csrf_token` cookie.
4. If you attempt a state-changing request without the header or with an invalid header, the server will return HTTP 403.

Start the Express mock:

```powershell
npm run mock:express       # run once
npm run mock:express:watch # run with nodemon for auto-reload during development
```

When using the Express mock you can either:
- Keep `VITE_API_BASE_URL` empty and let `src/services/api.js` route to `/api/*` (Vite proxy will forward to the mock), or
- Set `VITE_API_BASE_URL=http://localhost:3000` in `.env` to use direct host calls.

3) Using a real backend

- Create a `.env` file with `VITE_API_BASE_URL=http://your-backend:port` and restart the dev server.
- Ensure the backend either allows CORS or that you use a reverse proxy in front of it. In production the
	build will be compiled with the base URL available at build time.

Contribuições: abra uma issue ou PR com a proposta.
