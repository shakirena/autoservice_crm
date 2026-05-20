# Spec: Feature #7 — Модуль аутентификации

## Overview

Реализует полноценный модуль входа для AutoService CRM: сервисный слой Firebase Auth, Zustand-стор для глобального auth-состояния и реальную форму входа на LoginPage. Роль пользователя читается из Firestore `users/{uid}.role`, а не из custom claims (изменение поведения относительно Feature #1). После реализации пользователь может войти через email/password, приложение сохраняет его данные в Zustand-сторе, ProtectedRoute в `App.jsx` корректно перенаправляет аутентифицированных/неаутентифицированных пользователей.

Зависимость: Feature #1 (уже реализована) — `src/lib/firebase.js`, `src/lib/authContext.jsx`, `src/App.jsx` с ProtectedRoute, заглушка `src/pages/LoginPage.jsx`.

---

## User Stories

### US-1 — authService: loginWithEmail, logout, getCurrentUser

**As a** разработчик фичи,  
**I want** изолированный сервисный модуль `src/services/authService.js`,  
**so that** ни один компонент не импортирует Firebase SDK напрямую, и вся логика Auth сосредоточена в одном месте.

**Details:**
- `loginWithEmail(email, password)` — вызывает `signInWithEmailAndPassword(auth, email, password)`, при успехе читает роль из Firestore `users/{uid}.role` и возвращает объект `{ user, role }`
- `logout()` — вызывает `signOut(auth)` и возвращает Promise
- `getCurrentUser()` — возвращает `auth.currentUser` синхронно (может быть `null`)
- Ошибки Firebase пробрасываются наружу без оборачивания — обработка на уровне вызывающего кода (хук/компонент)
- ESM only, никаких default-экспортов — только named exports

---

### US-2 — Zustand authStore

**As a** разработчик любого компонента,  
**I want** единый Zustand-стор `src/store/authStore.js` с auth-состоянием,  
**so that** компоненты вне дерева AuthProvider могут читать `user`, `role`, `loading` без prop drilling.

**Details:**
- Состояние: `{ user: null, role: null, loading: true }`
- Мутаторы: `setUser(user)`, `setRole(role)`, `setLoading(bool)`
- Стор не занимается побочными эффектами (подписка на `onAuthStateChanged` — в `authContext.jsx`)
- `loading: true` по умолчанию (начальное неизвестное состояние)
- Стор создаётся через `create` из `zustand`, без middleware (persist не нужен — роль всегда актуализируется из Firestore при монтировании)

---

### US-3 — LoginPage: реальная форма email/password

**As a** пользователь приложения,  
**I want** форму входа с полями email и password,  
**so that** я могу авторизоваться в CRM через свою учётную запись Firebase.

**Details:**
- Заменяет заглушку `src/pages/LoginPage.jsx` полноценной формой
- Форма использует React Hook Form 7: `useForm`, `register`, `handleSubmit`, `formState.errors`
- При отправке вызывает `loginWithEmail(email, password)` из `authService.js`
- При успехе: `navigate('/dashboard', { replace: true })`
- При ошибке: отображает русскоязычное сообщение (маппинг Firebase error codes — см. раздел Error Handling)
- Кнопка Submit блокируется (`disabled`) в процессе отправки (`isSubmitting` из RHF)
- Все интерактивные элементы имеют `data-testid` атрибуты (E2E convention)
- Если пользователь уже аутентифицирован — редирект на `/dashboard` (проверка через `useAuth`)

---

### US-4 — Интеграция роутинга (App.jsx)

**As a** пользователь,  
**I want** корректную навигацию: неаутентифицированные → `/login`, аутентифицированные с `/login` → `/dashboard`,  
**so that** нет доступа к защищённым страницам без входа и нет возврата на логин после входа.

**Details:**
- `ProtectedRoute` уже реализован в `App.jsx` (Feature #1) — проверяется, что логика корректна
- Добавить редирект с `/login` для уже вошедшего пользователя: если `user !== null && !loading` → `<Navigate to="/dashboard" replace />`
- Маршруты остаются прежними: `/` → `/dashboard`, `/login`, `/dashboard` (protected)
- `App.jsx` не импортирует authStore напрямую — использует только `useAuth` из authContext

---

## Acceptance Criteria

| # | Критерий | Проверяется |
|---|----------|-------------|
| AC-1 | `src/services/authService.js` экспортирует `loginWithEmail`, `logout`, `getCurrentUser` | Ручной импорт + вызов |
| AC-2 | `loginWithEmail` читает роль из `users/{uid}.role` в Firestore, а не из custom claims | Code review: `getDoc(doc(db, 'users', uid))` |
| AC-3 | `loginWithEmail` возвращает `{ user, role }` при успешном входе | Unit test / ручной вызов |
| AC-4 | `logout()` вызывает `signOut(auth)` и возвращает Promise | Code review |
| AC-5 | `src/store/authStore.js` создан через `zustand`, экспортирует `useAuthStore` | Импорт в компоненте |
| AC-6 | authStore имеет поля `user`, `role`, `loading` и мутаторы `setUser`, `setRole`, `setLoading` | Code review |
| AC-7 | `LoginPage.jsx` содержит форму с полями `email` и `password`, управляемую через React Hook Form | Code review + DOM |
| AC-8 | Поля формы имеют `data-testid="login-email"`, `data-testid="login-password"`, кнопка — `data-testid="login-submit"` | DOM inspect |
| AC-9 | Валидация: email — required + valid format; password — required + min 6 символов; ошибки отображаются рядом с полем | Ручной ввод невалидных данных |
| AC-10 | При успешном входе — редирект на `/dashboard` | E2E / ручная проверка |
| AC-11 | При ошибке входа отображается русскоязычное сообщение (не код Firebase) | Ввод неверного пароля |
| AC-12 | Кнопка Submit `disabled` пока форма в состоянии `isSubmitting` | Медленный network / Dev Tools throttle |
| AC-13 | Уже аутентифицированный пользователь на `/login` перенаправляется на `/dashboard` | Прямой переход по URL |
| AC-14 | `authContext.jsx` обновлён: роль читается из Firestore `users/{uid}.role`, не из `getIdTokenResult().claims.role` | Code review |
| AC-15 | `npm run lint` завершается без ошибок | CI / локально |
| AC-16 | `npm run build` завершается без ошибок | CI / локально |

---

## Data Models

### Firestore: `users/{uid}`

Документ создаётся при регистрации (вне скоупа этой фичи — предполагается наличие). Feature #7 только **читает** поле `role`.

```js
/**
 * @typedef {Object} UserDoc
 * @property {string}   uid          — Firebase Auth UID (совпадает с ID документа)
 * @property {string}   email        — Email пользователя
 * @property {string}   displayName  — Отображаемое имя
 * @property {'admin'|'manager'|'mechanic'|'client'} role — Роль; читается Feature #7
 * @property {Timestamp} createdAt   — serverTimestamp() при создании
 * @property {Timestamp} updatedAt   — serverTimestamp() при каждом изменении
 */
```

### Как роль читается из Firestore

`authService.loginWithEmail` после успешного `signInWithEmailAndPassword` выполняет:

```js
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

const snap = await getDoc(doc(db, 'users', user.uid))
const role = snap.exists() ? (snap.data().role ?? 'client') : 'client'
```

Fallback: если документ не существует или поле `role` отсутствует — присваивается `'client'`.

`authContext.jsx` обновляется аналогично: в `onAuthStateChanged` заменить вызов `getIdTokenResult()` на `getDoc(doc(db, 'users', firebaseUser.uid))` для получения роли.

### Zustand authStore shape

```js
/**
 * @typedef {Object} AuthState
 * @property {import('firebase/auth').User|null} user    — Firebase User object или null
 * @property {'admin'|'manager'|'mechanic'|'client'|null} role — Роль из Firestore
 * @property {boolean} loading — true пока onAuthStateChanged не ответил
 * @property {function(import('firebase/auth').User|null): void} setUser
 * @property {function('admin'|'manager'|'mechanic'|'client'|null): void} setRole
 * @property {function(boolean): void} setLoading
 */
```

---

## Form Validation Rules

Форма управляется через `useForm` из React Hook Form 7. Правила регистрируются через `register(name, options)`.

| Поле | Правило | Сообщение об ошибке |
|------|---------|---------------------|
| `email` | `required: true` | «Введите email» |
| `email` | `pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/` | «Некорректный формат email» |
| `password` | `required: true` | «Введите пароль» |
| `password` | `minLength: 6` | «Пароль должен содержать не менее 6 символов» |

Ошибки отображаются под соответствующим полем в элементе с `data-testid="login-email-error"` / `data-testid="login-password-error"`.

Серверная ошибка (Firebase) отображается в общем блоке с `data-testid="login-error"` над кнопкой Submit.

---

## Error Handling

Firebase Auth возвращает ошибки через `error.code`. Все коды маппируются на русские сообщения для отображения пользователю.

| Firebase error code | Русское сообщение |
|--------------------|-------------------|
| `auth/user-not-found` | «Пользователь с таким email не найден» |
| `auth/wrong-password` | «Неверный пароль» |
| `auth/invalid-credential` | «Неверный email или пароль» |
| `auth/invalid-email` | «Некорректный формат email» |
| `auth/user-disabled` | «Учётная запись заблокирована. Обратитесь к администратору» |
| `auth/too-many-requests` | «Слишком много попыток входа. Попробуйте позже» |
| `auth/network-request-failed` | «Ошибка сети. Проверьте подключение к интернету» |
| `auth/operation-not-allowed` | «Вход через email/password не настроен» |
| любой другой код | «Произошла ошибка входа. Попробуйте снова» |

Маппинг реализуется вспомогательной функцией `getAuthErrorMessage(code)` в `authService.js` или в самом компоненте — на усмотрение разработчика, но функция должна быть тестируемой (экспортировать отдельно от side-эффектов).

Ошибки чтения Firestore (`users/{uid}`) при получении роли не прерывают вход — пользователь получает роль `'client'` по умолчанию, а ошибка логируется в `console.error`.

---

## Out of Scope

- Регистрация новых пользователей (создание `users/{uid}` документа)
- Восстановление пароля (forgot password flow)
- Вход через OAuth-провайдеры (Google, GitHub и т. д.)
- Управление ролями через UI (назначение/изменение роли)
- Сброс кастомных claims в Firebase Auth
- Firebase Auth Emulator / локальное тестирование без сети
- Refresh токенов и логика истечения сессии
- Многофакторная аутентификация (MFA)
- «Запомнить меня» / управление persistence (`browserSessionPersistence` vs `browserLocalPersistence`)
- Страница ошибки доступа (403) для неправильной роли
- Toast/snackbar UI-библиотека — ошибки отображаются inline в форме
