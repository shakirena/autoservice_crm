# Spec: Feature #17 — Управление пользователями и ролями (admin)

## Overview

Реализует полноценное управление сотрудниками для роли `admin` в AutoService CRM. Заглушка `src/pages/dashboard/UsersPage.jsx` заменяется реальным интерфейсом: список сотрудников с поиском, форма создания нового сотрудника, модальное окно редактирования (смена роли, блокировка/разблокировка).

Архитектура следует установленному data flow: `UsersPage` → хуки (`useUsers.js`) → сервис (`usersService.js`) → Firestore SDK. Компоненты не импортируют Firestore напрямую.

**MVP-ограничения:**
- Создание пользователей — через `createUserWithEmailAndPassword` в браузере (без Cloud Functions / Admin SDK). Admin создаёт аккаунт с временным паролем; сотрудник должен сменить пароль при первом входе (сброс пароля — Out of Scope MVP).
- Блокировка в Firebase Auth (реальный `disabled` флаг) требует Admin SDK — недоступен из браузера. В MVP блокировка реализуется полем `disabled: true` в Firestore `users/{uid}`. Проверка флага выполняется в `authContext.jsx` при `onAuthStateChanged` — заблокированный пользователь принудительно разлогинивается.
- Роль устанавливается записью в Firestore `users/{uid}.role`; custom claims Firebase Auth не используются (согласно Feature #7).

**Зависимости:**
- Feature #1 — `src/lib/firebase.js`
- Feature #7 — `src/lib/authContext.jsx`, `useAuth()`, `src/services/authService.js`, `src/store/authStore.js`
- Feature #12 — `DashboardLayout`, `RoleGuard (allowedRoles=['admin'])`, маршрут `/dashboard/users`

---

## User Stories

### US-1 — Список сотрудников

**As an** администратор,  
**I want** видеть на странице `/dashboard/users` таблицу всех сотрудников системы (uid, displayName, email, роль, статус активности),  
**so that** я могу быстро оценить состав команды и найти нужного человека.

**Details:**
- Загружает документы из коллекции `users` Firestore, отсортированные по `createdAt` desc
- Отображает колонки: Имя (`displayName`), Email, Роль (бейдж с цветом), Статус (Активен / Заблокирован), Дата добавления (`createdAt`), Действия
- Строка поиска (фильтр по имени и email) — локальный фильтр по загруженным данным, без дополнительных запросов к Firestore
- Во время загрузки отображается скелетон (не спиннер) — минимум 3 строки-заглушки
- При пустом списке (нет сотрудников) отображается состояние empty state с кнопкой «Добавить первого сотрудника»
- При ошибке загрузки — inline сообщение об ошибке с кнопкой «Повторить»
- Колонка «Действия» содержит кнопки «Редактировать» и «Заблокировать/Разблокировать» для каждой строки
- Текущий авторизованный admin не может заблокировать или изменить роль самого себя — кнопки для собственной строки отключены (`disabled`) с tooltip «Нельзя изменить собственную учётную запись»

---

### US-2 — Создание сотрудника

**As an** администратор,  
**I want** форму для создания нового сотрудника с полями email, displayName, роль и временный пароль,  
**so that** я могу добавить нового человека в систему, не передавая ему доступ к Firebase Console.

**Details:**
- Кнопка «Добавить сотрудника» открывает модальное окно с формой
- Форма управляется через React Hook Form 7
- Поля: `email` (required, email format), `displayName` (required, min 2 символа), `role` (select: manager | mechanic; admin не создаёт других admin через UI — это ограничение MVP), `password` (required, min 8 символов — временный пароль)
- При отправке последовательно выполняется:
  1. `createUserWithEmailAndPassword(auth, email, password)` — создание Firebase Auth аккаунта
  2. `updateProfile(newUser, { displayName })` — установка displayName в Firebase Auth
  3. `setDoc(doc(db, 'users', newUser.uid), { uid, email, displayName, role, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), disabled: false })` — создание Firestore документа
  4. Текущий admin не разлогинивается — `createUserWithEmailAndPassword` меняет `auth.currentUser`. Необходимо после создания сотрудника восстановить сессию admin через `signInWithEmailAndPassword` с его кешированными credentials ИЛИ использовать secondary Firebase App для создания пользователя (предпочтительно — см. Implementation Notes)
- При успехе: модальное окно закрывается, список сотрудников инвалидируется через TanStack Query (`queryClient.invalidateQueries`)
- При ошибке: отображается русскоязычное сообщение в форме, модальное окно остаётся открытым
- Кнопка Submit блокируется во время отправки (`isSubmitting`)

**Implementation Note — проблема смены auth-сессии:**
`createUserWithEmailAndPassword` автоматически меняет `auth.currentUser` на нового пользователя. Решение MVP: инициализировать вторую Firebase App instance только для создания пользователей:
```js
// src/services/usersService.js
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

const secondaryApp = initializeApp(firebaseConfig, 'secondary')
const secondaryAuth = getAuth(secondaryApp)
```
Операция `createUserWithEmailAndPassword` вызывается через `secondaryAuth` — основная сессия admin не затрагивается.

---

### US-3 — Смена роли сотрудника

**As an** администратор,  
**I want** изменить роль существующего сотрудника через модальное окно редактирования,  
**so that** я могу повысить механика до менеджера или скорректировать права без пересоздания аккаунта.

**Details:**
- Кнопка «Редактировать» в строке таблицы открывает модальное окно с формой редактирования
- В форме отображается: текущие данные сотрудника (email, displayName — read-only), select смены роли с текущим значением
- Доступные роли для назначения через UI: `manager`, `mechanic` (admin не назначается через UI — Out of Scope MVP)
- При сохранении: `updateDoc(doc(db, 'users', uid), { role: newRole, updatedAt: serverTimestamp() })`
- При успехе: модальное закрывается, список инвалидируется
- Смена роли вступает в силу при следующем входе пользователя (роль читается из Firestore при `onAuthStateChanged` — согласно Feature #7)
- Admin не может изменить собственную роль — select заблокирован для текущего uid

---

### US-4 — Блокировка и разблокировка пользователя

**As an** администратор,  
**I want** заблокировать или разблокировать сотрудника одним кликом,  
**so that** уволенный или временно отстранённый сотрудник немедленно теряет доступ к CRM.

**Details:**
- В таблице у каждого сотрудника есть кнопка «Заблокировать» / «Разблокировать» (зависит от текущего `disabled` флага)
- При блокировке: `updateDoc(doc(db, 'users', uid), { disabled: true, updatedAt: serverTimestamp() })`
- При разблокировке: `updateDoc(doc(db, 'users', uid), { disabled: false, updatedAt: serverTimestamp() })`
- `authContext.jsx` обновляется: в `onAuthStateChanged` после получения Firestore-документа проверяется `data.disabled === true` — если да, вызывается `signOut(auth)` и пользователь перенаправляется на `/login` с сообщением «Ваша учётная запись заблокирована»
- Блокировка применяется при следующей загрузке страницы/обновлении Firestore-документа — не мгновенно для уже активной сессии (ограничение MVP без Admin SDK и realtime listener в authContext)
- Диалог подтверждения перед блокировкой: «Вы уверены, что хотите заблокировать [displayName]? Пользователь потеряет доступ при следующем обновлении сессии»
- Admin не может заблокировать самого себя — кнопка заблокирована (`disabled`)

---

## Acceptance Criteria

### AC — Страница и список (US-1)

| # | Критерий | `data-testid` / проверка |
|---|----------|--------------------------|
| AC-1 | `UsersPage` рендерит контейнер с `data-testid="page-users"` | DOM |
| AC-2 | Таблица сотрудников рендерится в `data-testid="users-table"` | DOM |
| AC-3 | Каждая строка таблицы имеет `data-testid="user-row-{uid}"` | DOM: по uid |
| AC-4 | Колонка Имя: `data-testid="user-cell-name-{uid}"` | DOM |
| AC-5 | Колонка Email: `data-testid="user-cell-email-{uid}"` | DOM |
| AC-6 | Колонка Роль: `data-testid="user-cell-role-{uid}"` с текстом роли | DOM |
| AC-7 | Колонка Статус: `data-testid="user-cell-status-{uid}"` — «Активен» или «Заблокирован» | DOM |
| AC-8 | Строка заблокированного пользователя имеет визуальное отличие (класс или inline-стиль — на усмотрение разработчика) | DOM |
| AC-9 | Поле поиска имеет `data-testid="users-search"` и фильтрует список по имени и email | Ввод текста → DOM |
| AC-10 | Во время загрузки рендерятся строки-скелетоны в `data-testid="users-skeleton"` | DOM при `isFetching` |
| AC-11 | При ошибке загрузки рендерится `data-testid="users-error"` с кнопкой `data-testid="users-retry"` | Мок ошибки Firestore |
| AC-12 | При пустом списке рендерится `data-testid="users-empty"` | Мок пустого ответа |
| AC-13 | Кнопки действий для собственной строки admin заблокированы (`disabled`) | DOM: текущий uid |
| AC-14 | Страница `/dashboard/users` недоступна для ролей `manager` и `mechanic` — редирект через `RoleGuard` | Прямой URL |

### AC — Создание сотрудника (US-2)

| # | Критерий | `data-testid` / проверка |
|---|----------|--------------------------|
| AC-15 | Кнопка `data-testid="btn-add-user"` открывает модальное окно | Клик |
| AC-16 | Модальное окно имеет `data-testid="modal-create-user"` | DOM после клика |
| AC-17 | Поле email: `data-testid="create-user-email"` | DOM |
| AC-18 | Поле displayName: `data-testid="create-user-name"` | DOM |
| AC-19 | Select роли: `data-testid="create-user-role"` — опции `manager` и `mechanic` | DOM |
| AC-20 | Поле временного пароля: `data-testid="create-user-password"` | DOM |
| AC-21 | Кнопка Submit: `data-testid="create-user-submit"` — `disabled` при `isSubmitting` | DOM |
| AC-22 | Кнопка отмены: `data-testid="create-user-cancel"` — закрывает модальное окно | Клик |
| AC-23 | Валидация email: required + корректный формат; ошибка в `data-testid="create-user-email-error"` | Невалидный ввод |
| AC-24 | Валидация displayName: required + min 2 символа; ошибка в `data-testid="create-user-name-error"` | Невалидный ввод |
| AC-25 | Валидация password: required + min 8 символов; ошибка в `data-testid="create-user-password-error"` | Невалидный ввод |
| AC-26 | При успехе модальное закрывается, новый пользователь появляется в таблице | E2E / TanStack Query invalidation |
| AC-27 | При ошибке (например, email уже занят) отображается `data-testid="create-user-server-error"` с русским сообщением | Мок Firebase ошибки |
| AC-28 | Сессия создающего admin не прерывается после создания сотрудника | Проверка `auth.currentUser` до и после |

### AC — Редактирование роли (US-3)

| # | Критерий | `data-testid` / проверка |
|---|----------|--------------------------|
| AC-29 | Кнопка редактирования: `data-testid="btn-edit-user-{uid}"` — открывает модальное окно | Клик |
| AC-30 | Модальное окно редактирования: `data-testid="modal-edit-user"` | DOM |
| AC-31 | Email в модальном окне: `data-testid="edit-user-email"` — read-only | DOM |
| AC-32 | Select роли: `data-testid="edit-user-role"` с предзаполненным текущим значением | DOM |
| AC-33 | Кнопка сохранения: `data-testid="edit-user-submit"` — `disabled` при `isSubmitting` | DOM |
| AC-34 | Кнопка отмены: `data-testid="edit-user-cancel"` — закрывает модальное без сохранения | Клик |
| AC-35 | После сохранения таблица отражает новую роль | TanStack Query invalidation |
| AC-36 | Select роли заблокирован (`disabled`) если `uid === currentUser.uid` | DOM: текущий uid |

### AC — Блокировка (US-4)

| # | Критерий | `data-testid` / проверка |
|---|----------|--------------------------|
| AC-37 | Кнопка блокировки: `data-testid="btn-toggle-block-{uid}"` — текст «Заблокировать» / «Разблокировать» | DOM |
| AC-38 | Клик вызывает диалог подтверждения `data-testid="modal-confirm-block"` | Клик |
| AC-39 | Кнопка подтверждения в диалоге: `data-testid="confirm-block-ok"` | DOM |
| AC-40 | Кнопка отмены в диалоге: `data-testid="confirm-block-cancel"` | DOM |
| AC-41 | После подтверждения статус строки меняется (Активен ↔ Заблокирован) | TanStack Query invalidation |
| AC-42 | Кнопка заблокирована (`disabled`) если `uid === currentUser.uid` | DOM: текущий uid |
| AC-43 | Заблокированный пользователь при попытке войти получает сообщение «Ваша учётная запись заблокирована» | `auth/user-disabled` или проверка `disabled` в authContext |

### AC — Общее

| # | Критерий | Проверка |
|---|----------|----------|
| AC-44 | `src/services/usersService.js` не импортирует React, только Firebase SDK | Code review |
| AC-45 | `src/hooks/useUsers.js` не импортирует Firebase SDK напрямую | Code review |
| AC-46 | Все формы используют React Hook Form 7 (`useForm`, `register`, `handleSubmit`) | Code review |
| AC-47 | `npm run lint` завершается без ошибок | CI / локально |
| AC-48 | `npm run build` завершается без ошибок | CI / локально |

---

## Data Models

### Firestore: `users/{uid}` — обновлённая схема

Feature #17 добавляет поле `disabled` к существующей схеме.

```js
/**
 * @typedef {Object} UserDoc
 * @property {string}   uid          — Firebase Auth UID (совпадает с ID документа)
 * @property {string}   email        — Email пользователя
 * @property {string}   displayName  — Отображаемое имя (из Firebase Auth Profile)
 * @property {'admin'|'manager'|'mechanic'} role — Роль в системе
 * @property {boolean}  disabled     — true = заблокирован (MVP-блокировка; Admin SDK недоступен)
 * @property {import('firebase/firestore').Timestamp} createdAt — serverTimestamp() при создании
 * @property {import('firebase/firestore').Timestamp} updatedAt — serverTimestamp() при изменении
 */
```

**Индексы Firestore** (добавить в `firestore.indexes.json`):
- Коллекция `users`, поля: `disabled ASC`, `createdAt DESC` — для фильтрации активных/заблокированных с сортировкой

### Обновление authContext.jsx

`onAuthStateChanged` расширяется проверкой флага `disabled`:

```js
// src/lib/authContext.jsx — фрагмент onAuthStateChanged
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (snap.exists() && snap.data().disabled === true) {
      await signOut(auth)
      // authStore.setUser(null), authStore.setRole(null)
      // навигация на /login обрабатывается ProtectedRoute
      return
    }
    const role = snap.exists() ? (snap.data().role ?? 'client') : 'client'
    // setUser, setRole, setLoading(false)
  } else {
    // setUser(null), setRole(null), setLoading(false)
  }
})
```

---

## Security Rules Update

Добавить в `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Существующее правило (Feature #7):
    // users/{uid}: пользователь читает/изменяет только свой документ
    // Feature #17 добавляет: admin может читать и изменять любой документ users/{uid}

    match /users/{uid} {
      // Чтение: сам пользователь или admin
      allow read: if request.auth != null
        && (request.auth.uid == uid
          || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');

      // Создание: только admin (через usersService, secondary App)
      allow create: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
        && request.resource.data.keys().hasAll(['uid', 'email', 'displayName', 'role', 'disabled', 'createdAt', 'updatedAt'])
        && request.resource.data.role in ['manager', 'mechanic']
        && request.resource.data.disabled == false;

      // Обновление: сам пользователь (только displayName) или admin (role, disabled, displayName)
      allow update: if request.auth != null
        && (
          // Сам пользователь обновляет только displayName
          (request.auth.uid == uid
            && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['displayName', 'updatedAt']))
          // Admin обновляет role, disabled, displayName
          || (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
              && request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['role', 'disabled', 'displayName', 'updatedAt']))
        );

      // Удаление: запрещено через UI (Out of Scope MVP)
      allow delete: if false;
    }
  }
}
```

**Замечание:** правило `create` допускает создание документа `users/{uid}` только admin. Поскольку `createUserWithEmailAndPassword` через secondary App создаёт Firebase Auth аккаунт, а затем admin (через основной auth) создаёт Firestore документ — `request.auth.uid` в момент `setDoc` будет uid admin'а, поэтому правило корректно.

---

## API / Service Layer

### `src/services/usersService.js`

```js
/**
 * getUsers() → Promise<UserDoc[]>
 * Возвращает все документы коллекции users, отсортированные по createdAt desc.
 */
export async function getUsers() { ... }

/**
 * createEmployee({ email, displayName, role, password }) → Promise<{ uid: string }>
 * 1. createUserWithEmailAndPassword через secondaryAuth (secondary Firebase App)
 * 2. updateProfile(newUser, { displayName })
 * 3. setDoc(doc(db, 'users', uid), { uid, email, displayName, role, disabled: false, createdAt, updatedAt })
 * Throws: Firebase Auth errors (email-already-in-use и др.)
 */
export async function createEmployee({ email, displayName, role, password }) { ... }

/**
 * updateUserRole(uid, newRole) → Promise<void>
 * updateDoc users/{uid}: { role: newRole, updatedAt: serverTimestamp() }
 */
export async function updateUserRole(uid, newRole) { ... }

/**
 * toggleUserBlock(uid, disabled) → Promise<void>
 * updateDoc users/{uid}: { disabled, updatedAt: serverTimestamp() }
 * @param {string} uid
 * @param {boolean} disabled — true = заблокировать, false = разблокировать
 */
export async function toggleUserBlock(uid, disabled) { ... }
```

**Secondary Firebase App** инициализируется один раз при импорте модуля:

```js
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { firebaseConfig } from '../lib/firebase.js'

const SECONDARY_APP_NAME = 'secondary'
const secondaryApp = getApps().find(a => a.name === SECONDARY_APP_NAME)
  ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME)
const secondaryAuth = getAuth(secondaryApp)
```

`firebaseConfig` необходимо экспортировать из `src/lib/firebase.js` (named export).

### `src/hooks/useUsers.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createEmployee, updateUserRole, toggleUserBlock } from '../services/usersService.js'

const USERS_QUERY_KEY = ['users']

/**
 * useUsers() — список всех сотрудников
 * Returns TanStack Query result: { data: UserDoc[], isLoading, isError, error, refetch }
 */
export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: getUsers,
  })
}

/**
 * useCreateEmployee() — мутация создания сотрудника
 * Returns { mutate, mutateAsync, isPending, error }
 * onSuccess: invalidates USERS_QUERY_KEY
 */
export function useCreateEmployee() { ... }

/**
 * useUpdateUserRole() — мутация смены роли
 * Returns { mutate, mutateAsync, isPending, error }
 * onSuccess: invalidates USERS_QUERY_KEY
 */
export function useUpdateUserRole() { ... }

/**
 * useToggleUserBlock() — мутация блокировки/разблокировки
 * Returns { mutate, mutateAsync, isPending, error }
 * onSuccess: invalidates USERS_QUERY_KEY
 */
export function useToggleUserBlock() { ... }
```

### Маппинг ошибок Firebase Auth (для формы создания)

| Firebase error code | Русское сообщение |
|--------------------|-------------------|
| `auth/email-already-in-use` | «Пользователь с таким email уже существует» |
| `auth/invalid-email` | «Некорректный формат email» |
| `auth/weak-password` | «Пароль слишком простой. Минимум 8 символов» |
| `auth/operation-not-allowed` | «Создание пользователей через email/password не настроено» |
| `auth/network-request-failed` | «Ошибка сети. Проверьте подключение к интернету» |
| любой другой код | «Ошибка создания пользователя. Попробуйте снова» |

---

## Component Tree

```
UsersPage                              (src/pages/dashboard/UsersPage.jsx)
├── UsersHeader                        (кнопка «Добавить сотрудника», поле поиска)
├── UsersTable                         (таблица с данными)
│   └── UserRow × N                   (строка: данные + кнопки действий)
├── CreateUserModal                    (модальное окно создания)
│   └── CreateUserForm                 (React Hook Form)
├── EditUserModal                      (модальное окно редактирования)
│   └── EditUserForm                   (React Hook Form)
└── ConfirmBlockModal                  (диалог подтверждения блокировки)
```

**Расположение компонентов:** `src/features/users/` — все компоненты специфичны для домена Users и не являются shared UI примитивами.

| Файл | Назначение |
|------|-----------|
| `src/pages/dashboard/UsersPage.jsx` | Маршрутный компонент — заменяет заглушку; оркестрирует хуки и дочерние компоненты |
| `src/features/users/UsersTable.jsx` | Таблица со строками, поиском и состояниями загрузки/ошибки/пустого |
| `src/features/users/UserRow.jsx` | Одна строка таблицы с кнопками действий |
| `src/features/users/CreateUserModal.jsx` | Модальное окно + форма создания |
| `src/features/users/EditUserModal.jsx` | Модальное окно + форма редактирования |
| `src/features/users/ConfirmBlockModal.jsx` | Простой диалог подтверждения |
| `src/services/usersService.js` | Firestore CRUD + secondary Firebase App |
| `src/hooks/useUsers.js` | TanStack Query хуки |

**Изменяемые файлы:**

| Файл | Изменение |
|------|-----------|
| `src/pages/dashboard/UsersPage.jsx` | Заглушка заменяется реальным компонентом |
| `src/lib/authContext.jsx` | Добавить проверку `disabled` в `onAuthStateChanged` |
| `src/lib/firebase.js` | Экспортировать `firebaseConfig` как named export для secondary App |
| `firestore.rules` | Обновить правила для коллекции `users` |
| `firestore.indexes.json` | Добавить composite index для `users` |

---

## Out of Scope (MVP)

- **Cloud Functions / Admin SDK** — создание через `createUserWithEmailAndPassword` (secondary App) достаточно для MVP
- **Реальная блокировка Firebase Auth** (`admin.auth().updateUser(uid, { disabled: true })`) — требует Admin SDK; в MVP блокировка через Firestore-флаг
- **Удаление пользователей** — из соображений аудита; `disabled: true` является достаточным для MVP
- **Роль `admin` через UI** — назначение admin-прав выполняется только через Firebase Console или Cloud Functions
- **Роль `client`** — управление клиентскими аккаунтами выносится в Feature #20 (клиентский портал)
- **Журнал действий (activityLogs)** — опциональная функциональность; будет добавлена в Feature #19 или отдельным итерационным тикетом. Если время позволяет: коллекция `activityLogs` с документами `{ uid, action, targetUid, targetEmail, timestamp }`, запись при каждом `updateUserRole` и `toggleUserBlock`
- **Сброс пароля** — сотрудник сбрасывает пароль самостоятельно через стандартный Firebase flow (`sendPasswordResetEmail`); UI для этого в `LoginPage` — отдельная фича
- **Принудительный logout активных сессий** — при блокировке флаг применяется при следующей загрузке страницы; мгновенный logout через `onSnapshot` в authContext может быть добавлен в следующем итерационном тикете
- **Pagination / infinite scroll** — список загружается целиком (ожидаемый объём: десятки сотрудников, не тысячи)
- **Экспорт списка пользователей** (CSV / Excel)
- **Аватар / фото профиля** — Firebase Storage для фотографий
- **UI-библиотека / CSS-фреймворк** — plain CSS или inline-стили на усмотрение разработчика (согласно Feature #12)
