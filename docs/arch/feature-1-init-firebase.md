# Architecture: Feature #1 — Инициализация CRM-проекта

## Directory Structure

```
src/
├── lib/
│   ├── firebase.js         # Firebase app, auth, db exports
│   └── authContext.jsx     # AuthContext, AuthProvider, useAuth
├── services/               # Firestore CRUD (one file per entity)
├── store/                  # Zustand stores (UI + optimistic state)
├── hooks/                  # Custom hooks (TanStack Query + services)
├── features/               # Feature modules (components + logic co-located)
├── pages/
│   ├── LoginPage.jsx
│   └── DashboardPage.jsx
└── components/             # Shared UI primitives
```

## Firebase Initialization Pattern

```
import.meta.env.VITE_FIREBASE_*
        │
        ▼
  initializeApp(config)        ← src/lib/firebase.js
        │
   ┌────┴────┐
   │         │
getAuth   getFirestore
   │         │
  auth       db            ← named exports consumed by services + authContext
```

## Auth Flow

```
App start
   │
onAuthStateChanged(auth)
   │
   ├─ user present ──► getIdTokenResult() ──► claims.role ──► setRole()
   │                                                              │
   │                                                    AuthContext.value = { user, role }
   │
   └─ no user ──► setUser(null), setRole(null)
                        │
                  <Navigate to="/login" />   (implemented per feature)
```

## RBAC Design

| Role      | Custom Claim          | Firestore Mirror       |
|-----------|-----------------------|------------------------|
| admin     | token.role = admin    | users/{uid}.role       |
| manager   | token.role = manager  | users/{uid}.role       |
| mechanic  | token.role = mechanic | users/{uid}.role       |
| client    | token.role = client   | users/{uid}.role       |

Custom claims are the source of truth for Security Rules.  
Firestore mirror (`users/{uid}.role`) is used for UI rendering only.

## Routing Strategy

```
/           → Navigate to /dashboard
/login      → LoginPage (public)
/dashboard  → DashboardPage (protected — guard implemented in feature-auth)
```

React Router DOM 7 `<BrowserRouter>` wraps the full app in `main.jsx`.  
Route protection (redirect to /login if unauthenticated) is added in feature-auth story.

## Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

All prefixed `VITE_` so Vite injects them at build time via `import.meta.env`.

## Data Flow

```
pages
  └─► hooks (useQuery / useMutation via TanStack Query)
        └─► services (Firestore SDK calls)
              └─► Firebase (Firestore / Auth)
```

Rule: components and pages never import Firestore or Auth directly.  
All side effects live in `services/`. Zustand stores hold UI state and optimistic updates.

## Provider Stack (main.jsx)

```jsx
<StrictMode>
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
</StrictMode>
```

Order matters: BrowserRouter must wrap everything that uses navigation; QueryClient wraps data consumers; AuthProvider wraps the app because auth state is read everywhere.
