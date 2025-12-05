<!--
Auto-generated copilot instructions template.
This repo appears to have no discoverable files in the workspace snapshot you provided.
If you have an existing `README.md`, `package.json`, `pyproject.toml`, CI workflows, or other files,
please add them to the repo and re-run the agent so this file can be updated with concrete examples.
-->

# Copilot instructions for this repository (React + Vite)

Summary
- Purpose: Guide AI coding agents for the `Varejix` retail management frontend (React, JavaScript, Vite).
- Status: The repository currently contains a minimal React + Vite scaffold. Update this file after major structural changes.

Quick agent checklist (run before making changes)
- Confirm project type: look for `package.json` at repository root (this repo uses React + Vite).
- Inspect `README.md`, `vite.config.js`, and `src/` for app entrypoints and conventions.
- Check `.github/workflows/` for CI commands if present, otherwise rely on `package.json` scripts.

Key commands (PowerShell examples)
- Install dependencies:

```powershell
cd c:\Apps\varejix
npm install
```

- Run dev server:

```powershell
npm run dev
```

- Build and preview production:

```powershell
npm run build
npm run preview
```

What to inspect first (project-specific)
- `package.json` — scripts and dependencies (`vite`, `@vitejs/plugin-react`, `react`, `react-dom`).
- `vite.config.js` — dev server config and plugins.
- `index.html` and `src/main.jsx` — app bootstrap and root element.
- `src/App.jsx` — top-level component and example layout.
- `src/` — component, routes, services conventions (add folders as the project grows):
  - `src/components/` — small, reusable UI pieces
  - `src/pages/` or `src/routes/` — route-level views
  - `src/services/` — API client and data access layer (e.g., `services/api.js`)
  - `src/state/` — global state (Context, Redux, or chosen library)

Architecture hints & recommended patterns for this frontend
- Single-page React app served by Vite for dev and build. Entry point: `src/main.jsx` -> `src/App.jsx`.
- Keep domain logic in `services/` and UI in `components/` and `pages/` to keep boundaries clear.
- For API integration, prefer a small wrapper `src/services/api.js` that centralizes base URL, auth token handling, and error mapping.
- For state:
  - Small/local component state: React `useState`/`useReducer`.
  - App-wide state: start with React Context + hooks; add Redux or Zustand only if complexity increases.
- Routing: use `react-router-dom` (add `src/routes/*` and `src/AppRoutes.jsx`).
- Styling: project uses simple CSS in `src/index.css`. The team may introduce Tailwind, CSS modules, or styled-components later.

Project-specific developer workflows
- Local dev: `npm run dev` (hot module replacement via Vite).
- Build for prod: `npm run build` then `npm run preview` to verify the production bundle locally.
- Testing (suggestion): add `vitest` + `@testing-library/react` and put tests alongside components as `Component.test.jsx`.

Conventions added by AI agent (this repo)
- Component files: `PascalCase.jsx` for React components in `src/components/`.
- Page files: `src/pages/` with title comment and initial data fetch inside `useEffect`.
- Services: single exported client in `src/services/api.js` with `get/post/put/delete` helpers.

Integration & external dependencies
- Backend endpoints: document any back-end base URL in `.env` (example: `VITE_API_BASE_URL=https://api.example.com`).
- If using authentication, centralize token handling in `src/services/auth.js` and wire into API client.

How to propose changes (agent workflow)
1. Make small, focused branches that modify one area (API, UI, state) and include a short PR description.
2. Add or update unit tests for new logic. Prefer `vitest` for fast JS tests.
3. Keep changes reversible and document new top-level folders in `README.md`.

Examples and file pointers (from this scaffold)
- App bootstrap: `index.html`, `src/main.jsx`, `src/App.jsx`.
- Vite config: `vite.config.js` (dev server options, plugins).
- Local commands: `package.json` scripts (`dev`, `build`, `preview`).

When expected files are missing
- Ask the maintainer to provide `README.md`, top-level manifest(s), or CI workflow examples.
- After new files are added, re-run the scan and update this document with concrete commands and patterns.

Contact / escalation
- If unsure about architecture decisions, open an issue and tag the maintainers or code owners.

Request for maintainers
- If you are a maintainer, please add the backend contract (`openapi.yml` or `API.md`) and preferred state library.
  That allows AI agents to scaffold API clients and feature pages more accurately.

---
This file was expanded for a React + Vite JavaScript scaffold. If you want a different stack (TypeScript,
Next.js, or an opinionated setup with Tailwind + React Router), tell me and I'll update this file and scaffold accordingly.
