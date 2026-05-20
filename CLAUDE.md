# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server with HMR (Vite)
npm run build     # Production build → dist/
npm run lint      # ESLint (js + jsx, react-hooks rules)
npm run preview   # Serve production build locally
```

No test runner is configured yet. When adding tests, use **Vitest** (already compatible with the Vite setup — add `vitest` to devDependencies).

## Project State

Early-stage CRM. `src/` currently contains only the Vite default starter (App.jsx + main.jsx). All dependencies are installed but no CRM features are implemented yet.

## Tech Stack

- **React 19** + **Vite 8** — no TypeScript, plain JS (ESM)
- **Firebase** (`autoservice-crm-b09d8`) — Firestore + Auth + Storage + Hosting
- **React Router DOM 7** — client-side routing
- **Zustand 5** — local/global state
- **TanStack React Query 5** — server state, async data fetching
- **React Hook Form 7** — form management

## Architecture (Intended)

```
src/
  lib/firebase.js       # Firebase app init (reads VITE_FIREBASE_* from env)
  services/             # Firestore CRUD — one file per domain entity
  store/                # Zustand stores
  hooks/                # Custom hooks (wrap TanStack Query + services)
  features/             # Feature modules (collocate components + logic)
  pages/                # Route-level components
  components/           # Shared UI primitives
```

**Data flow:** `pages` → `hooks` (useQuery/useMutation) → `services` (Firestore SDK) → Firebase.  
**Side effects** live in services only — components never import Firestore directly.

## Firebase

Config variables are in `.env` (prefix `VITE_FIREBASE_*`). Firestore Security Rules must always enforce `request.auth != null` as baseline. RBAC roles are stored in Firebase Auth custom claims (`request.auth.token.role`) and mirrored in `users/{uid}.role` in Firestore.

| Role | Access |
|------|--------|
| `admin` | Full access |
| `manager` | CRM operations, no system settings |
| `mechanic` | View + edit assigned orders |
| `client` | Own orders only |

## Key Conventions

- **ESM only** — no CommonJS (`require`). All imports use `.js` or `.jsx` extension or bare specifiers.
- **No TypeScript** — use JSDoc `@typedef` for complex shapes if needed.
- Firestore listeners (`onSnapshot`) belong in hooks, not in components or stores.
- Zustand stores hold UI state and optimistic updates; React Query owns the authoritative server cache.
- Forms always go through React Hook Form — no uncontrolled inputs in form elements.
- E2E selectors: only `[data-testid='*']` attributes — no CSS classes or XPath in tests.

## Deploy

```bash
npm run build
firebase deploy --only hosting       # static dist/ → Firebase Hosting
firebase deploy --only firestore:rules
```

## Agent System

Multi-agent development pipeline documented in `.claude/AGENTS_FRAMEWORK.md`.

Quick start:
```
/setup-board   # create 35 GitHub labels + Project Board (once)
/feature <description>
/analyze #N
/develop #N
/test #N
/deploy staging
```

Full pipeline shortcut: `/kanban <description>`
