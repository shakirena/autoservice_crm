# Feature 1: Инициализация CRM-проекта — структура папок + настройка Firebase

## Overview

Establish the foundational project structure and Firebase integration for AutoService CRM. This feature covers scaffolding the `src/` directory tree, wiring up Firebase (Firestore, Auth), configuring environment variables, writing baseline Firestore Security Rules, and seeding the `users/{uid}` document schema. No CRM domain features are implemented here — the goal is a clean, convention-compliant base that all subsequent features build on.

---

## User Stories

### US-1 — Project Structure Scaffold
**As a** developer joining the project,  
**I want** a well-defined `src/` folder structure that matches the intended architecture,  
**so that** I know exactly where to place new files without ambiguity.

**Details:**
- Directories: `src/lib/`, `src/services/`, `src/store/`, `src/hooks/`, `src/features/`, `src/pages/`, `src/components/`
- Each directory contains a `.gitkeep` so the folder is tracked in git
- The existing Vite default starter files are replaced with a minimal CRM shell

---

### US-2 — Firebase Initialisation Module
**As a** developer,  
**I want** a single `src/lib/firebase.js` module that initialises the Firebase app and exports service handles,  
**so that** all other modules import from one authoritative source and never re-initialise Firebase.

**Details:**
- Reads all config from `VITE_FIREBASE_*` environment variables (never hard-coded)
- Exports: `app` (default), `auth`, `db` (Firestore)

---

### US-3 — Environment Variable Configuration
**As a** developer (or DevOps),  
**I want** a documented `.env.example` file with all required `VITE_FIREBASE_*` keys,  
**so that** anyone cloning the repo knows which secrets to supply without looking at source code.

**Details:**
- `.env` is git-ignored; `.env.example` is committed
- Required keys: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`

---

### US-4 — Firestore Security Rules Baseline
**As a** security-conscious product owner,  
**I want** Firestore Security Rules that deny unauthenticated access by default and enforce role-based access on the `users` collection,  
**so that** no data is ever publicly readable or writable.

**Details:**
- Default `deny all` at the top level
- `users/{uid}` rules enforce ownership + role checks
- Rules file: `firestore.rules`

---

### US-5 — AuthContext + useAuth Hook
**As a** developer building protected routes,  
**I want** an `AuthContext` that provides the current user, their role, and a `signOut` function,  
**so that** any component can read auth state without importing Firebase directly.

**Details:**
- `src/lib/authContext.jsx` exports `AuthProvider` and `useAuth`
- Role is read from `getIdTokenResult().claims.role`
- `loading` state prevents flash of unauthenticated content

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | All `src/` subdirectories exist and are tracked in git |
| AC-2 | `src/lib/firebase.js` exports `{ auth, db }` and default `app` |
| AC-3 | All config reads from `import.meta.env.VITE_FIREBASE_*` — no hard-coded values |
| AC-4 | `firestore.rules` enforces `request.auth != null` as baseline + RBAC by custom claims |
| AC-5 | `AuthProvider` + `useAuth` exist in `src/lib/authContext.jsx` |
| AC-6 | Routes `/login` and `/dashboard` are registered in `App.jsx` |
| AC-7 | `npm run dev` starts without errors when `.env` is populated |
| AC-8 | `.env.example` is committed; `.env` is git-ignored |

---

## Data Models

### `users/{uid}` — Firestore Document

```js
/**
 * @typedef {Object} UserDoc
 * @property {string}   uid          — Firebase Auth UID (same as document ID)
 * @property {string}   email        — User's email address
 * @property {string}   displayName  — Full name for display in UI
 * @property {'admin'|'manager'|'mechanic'|'client'} role — mirrors Auth custom claim
 * @property {string}   [phone]      — Optional E.164 phone number
 * @property {string}   [avatarUrl]  — Optional Firebase Storage URL
 * @property {Timestamp} createdAt   — serverTimestamp() on creation
 * @property {Timestamp} updatedAt   — serverTimestamp() on every write
 */
```

---

## Security Rules Spec

| Role | Read own doc | Read any doc | Write own (excl. role) | Write role | Write any |
|------|:---:|:---:|:---:|:---:|:---:|
| Unauthenticated | — | — | — | — | — |
| `client` | ✓ | — | ✓ | — | — |
| `mechanic` | ✓ | — | ✓ | — | — |
| `manager` | ✓ | ✓ | ✓ | — | — |
| `admin` | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Out of Scope

- Authentication UI (login/register screens)
- Role assignment workflow / admin UI for custom claims
- Any CRM domain collections (orders, clients, vehicles)
- Zustand stores, TanStack Query provider
- Firebase Emulator Suite configuration
- CI/CD pipeline
