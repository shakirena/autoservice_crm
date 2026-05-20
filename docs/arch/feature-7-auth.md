# Architecture: Feature #7 — Модуль аутентификации

## Auth Flow Diagram

```
Browser
   │
   ▼
LoginPage (React Hook Form)
   │  email + password
   ▼
authService.loginWithEmail(email, password)
   │  Firebase SDK
   ▼
signInWithEmailAndPassword(auth, email, password)
   │
   ├─ SUCCESS ──► UserCredential
   │                    │
   │                    ▼
   │           onAuthStateChanged fires (authContext.jsx)
   │                    │
   │           getDoc(users/{uid})          ← Firestore read
   │                    │
   │           useAuthStore.setUser(user)
   │           useAuthStore.setRole(doc.role ?? 'client')
   │           useAuthStore.setLoading(false)
   │                    │
   │                    ▼
   │           ProtectedRoute sees user → <Navigate to="/dashboard" />
   │
   └─ ERROR ──► Firebase error code
                    │
                    ▼
               mapFirebaseError(code) → Russian message
                    │
                    ▼
               LoginPage shows error under form


Logout flow:
   │
   ▼
authService.logout()
   │
   ▼
signOut(auth)
   │
   ▼
onAuthStateChanged fires with null
   │
   ▼
useAuthStore.reset()   → { user: null, role: null, loading: false }
   │
   ▼
ProtectedRoute → <Navigate to="/login" />
```

## State Management Architecture: AuthContext vs Zustand Store

### Decision

The canonical auth state lives in **Zustand** (`useAuthStore`).
`AuthContext` acts as a thin bridge: it owns the Firebase `onAuthStateChanged`
subscription and writes into the store. Components read from the store via
`useAuth()` (which in turn returns store values through context).

### Rationale

| Concern | Solution |
|---------|----------|
| Single source of truth for user/role | Zustand store (`useAuthStore`) |
| Lifecycle of Firebase listener | `AuthContext` `useEffect` (mounted once at root) |
| Subscription cleanup | `onAuthStateChanged` returns `unsubscribe`, called on unmount |
| Access in non-component code (services, utils) | `useAuthStore.getState()` (Zustand vanilla) |
| Reactivity in components | `useAuth()` → context value derived from store |
| Optimistic logout UI | `reset()` action synchronously clears store before Firebase responds |

### Store shape

```
useAuthStore {
  state: {
    user:    FirebaseUser | null   // Firebase Auth user object
    role:    'admin'|'manager'|'mechanic'|'client' | null
    loading: boolean               // true until first onAuthStateChanged fires
  }
  actions: {
    setUser(user)    // called by AuthContext on auth change
    setRole(role)    // called by AuthContext after Firestore role read
    setLoading(bool) // called by AuthContext
    reset()          // sets user=null, role=null, loading=false
  }
}
```

### Context shape (AuthContext.Provider value)

```
{ user, role, loading, signOut }
```

Values `user`, `role`, `loading` are read from `useAuthStore` on every render
so context consumers always receive fresh Zustand state without extra selectors.

## Role Strategy: Reading from Firestore (TanStack Query)

### Source of truth split

| Layer | Source | Purpose |
|-------|--------|---------|
| Firestore Security Rules | `request.auth.token.role` custom claim | Enforce access server-side |
| UI rendering | `users/{uid}.role` Firestore field | Display menus, guard routes client-side |

Custom claims require a token refresh to propagate after being set by Admin SDK.
Reading the Firestore mirror is immediate and does not require a token refresh,
making it the right choice for UI role decisions.

### Read strategy in AuthContext

`onAuthStateChanged` is async. When a user signs in:

1. Firebase returns a `User` object.
2. `AuthContext` calls `getDoc(doc(db, 'users', uid))`.
3. The role is extracted from `snap.data().role` (default `'client'` if absent).
4. `useAuthStore.setRole(role)` is called synchronously before `setLoading(false)`.

This keeps the role read inside the auth listener — no separate TanStack Query
needed for the initial auth bootstrap. TanStack Query is used for downstream
profile data (display name, avatar, phone) that is not needed for route guarding.

### Why not useQuery for role?

`useQuery` is component-scoped. The role is needed before the component tree
renders (to decide which routes are accessible). Placing the read in
`onAuthStateChanged` inside `AuthContext` ensures the role is available when
`loading` transitions from `true` to `false` — at the same moment the rest of
the app becomes interactive.

## Error Handling: Firebase Auth

### Error map (Russian locale)

| Firebase code | Displayed message |
|---------------|-------------------|
| `auth/user-not-found` | Пользователь с таким email не найден |
| `auth/wrong-password` | Неверный пароль |
| `auth/invalid-credential` | Неверный email или пароль |
| `auth/too-many-requests` | Слишком много попыток. Попробуйте позже |
| `auth/user-disabled` | Аккаунт заблокирован. Обратитесь к администратору |
| `auth/network-request-failed` | Ошибка сети. Проверьте подключение к интернету |
| *(fallback)* | Ошибка входа. Попробуйте ещё раз |

### Error boundary strategy

- `loginWithEmail` in `authService.js` re-throws Firebase errors unchanged.
- `LoginPage` catches them in the `handleSubmit` callback and maps the code
  to a Russian message via `mapFirebaseError(error.code)`.
- The message is stored in local component state and rendered below the form.
- The error clears when the user starts typing again (`onChange` side-effect via
  React Hook Form `watch` or `clearErrors`).
- No `console.log` of passwords or tokens anywhere in the auth flow.

## File Map

```
src/
├── lib/
│   ├── firebase.js          # unchanged — exports auth, db
│   └── authContext.jsx      # UPDATED — writes to Zustand, reads role from Firestore
├── services/
│   └── authService.js       # NEW — loginWithEmail, logout, getCurrentUser
├── store/
│   └── authStore.js         # NEW — Zustand store for user/role/loading
└── pages/
    └── LoginPage.jsx        # REPLACED — full RHF form with validation + error map
```
