# Architecture: Feature #17 — Управление пользователями

## Overview

Реализует полноценное управление сотрудниками для роли `admin`. Заглушка `UsersPage` заменяется реальным интерфейсом с таблицей, модальными окнами создания/редактирования и блокировкой пользователей.

**MVP-ограничения:**
- Нет Cloud Functions / Admin SDK — вся логика выполняется в браузере.
- Создание через `createUserWithEmailAndPassword` + secondary Firebase App (сессия admin не прерывается).
- Блокировка — Firestore-флаг `disabled: true`, не реальный Firebase Auth disabled.
- Роль — только Firestore `users/{uid}.role` (не custom claims).

---

## Data Flow

```
UsersPage
  │
  ├─► useUsers()          ─────► getUsers()           ─► Firestore getDocs(users, orderBy createdAt desc)
  ├─► useCreateEmployee() ─────► createEmployee()      ─► secondaryAuth.createUserWithEmailAndPassword
  │                                                        + updateProfile(displayName)
  │                                                        + db.setDoc(users/{uid})
  │                                                        + secondaryAuth.signOut()
  ├─► useUpdateUserRole() ─────► updateUserRole()      ─► db.updateDoc(users/{uid}, { role })
  └─► useToggleUserBlock()─────► toggleUserBlock()     ─► db.updateDoc(users/{uid}, { disabled })
```

**Правило:** компоненты не импортируют Firebase SDK напрямую. Firestore/Auth используются только в `src/services/usersService.js`.

---

## Secondary Firebase App — ключевое архитектурное решение

`createUserWithEmailAndPassword(auth, ...)` автоматически меняет `auth.currentUser` на только что созданного пользователя. Это прерывает сессию admin.

**Решение:** secondary Firebase App instance, инициализированный с той же конфигурацией под именем `'secondary'`. `createUserWithEmailAndPassword` вызывается через `secondaryAuth`. Основной `auth` не затрагивается.

```
primaryApp (default)               secondaryApp ('secondary')
  auth ─── admin session           secondaryAuth ─── used only for createUser
  db  ─── Firestore writes                           ▲
                                                     │
                                          createUserWithEmailAndPassword
                                          updateProfile(newUser)
                                          signOut(secondaryAuth)  ← clean up
```

Инициализация происходит один раз при импорте модуля:

```js
const secondaryApp =
  getApps().find((a) => a.name === 'secondary') ??
  initializeApp(firebaseConfig, 'secondary')
```

`firebaseConfig` экспортируется как named export из `src/lib/firebase.js`.

---

## Blocked User Flow

`authContext.jsx` расширён проверкой `disabled` в `onAuthStateChanged`:

```
onAuthStateChanged fires
  │
  ├─ getDoc(users/{uid})
  │     │
  │     ├─ disabled === true ──► signOut(auth) → reset() → ProtectedRoute → /login
  │     │
  │     └─ disabled === false ──► setUser / setRole / setLoading(false)  (normal flow)
  │
  └─ firebaseUser === null ──► reset() → ProtectedRoute → /login
```

Ограничение MVP: блокировка применяется при следующей загрузке страницы (нет realtime listener в authContext). Активная сессия не прерывается мгновенно.

---

## Component Tree

```
UsersPage                              src/pages/dashboard/UsersPage.jsx
├── [header] search input + add button
├── [table] data-testid="users-table"
│   └── UserRow × N                   src/features/users/UserRow.jsx
│       └── RoleBadge                 src/features/users/RoleBadge.jsx
├── CreateUserModal (conditional)     src/features/users/CreateUserModal.jsx
│   └── form (React Hook Form)        data-testid="modal-create-user"
├── EditUserModal (conditional)       src/features/users/EditUserModal.jsx
│   └── form (React Hook Form)        data-testid="modal-edit-user"
└── ConfirmBlockModal (conditional)   src/features/users/ConfirmBlockModal.jsx
                                      data-testid="modal-confirm-block"
```

Дополнительные переиспользуемые компоненты (не специфичны для домена):
- `src/components/users/CreateEmployeeForm.jsx` — форма без мутации (props: onSubmit, onCancel)
- `src/components/users/RoleSelect.jsx` — controlled select роли

---

## File Map

| Файл | Статус | Назначение |
|------|--------|------------|
| `src/lib/firebase.js` | UPDATED | Добавлен named export `firebaseConfig` |
| `src/lib/authContext.jsx` | UPDATED | Проверка `disabled` в `onAuthStateChanged` |
| `src/services/usersService.js` | NEW | Firestore CRUD + secondary App |
| `src/hooks/useUsers.js` | NEW | TanStack Query хуки |
| `src/pages/dashboard/UsersPage.jsx` | REPLACED | Полная реализация (заглушка удалена) |
| `src/features/users/UserRow.jsx` | NEW | Строка таблицы |
| `src/features/users/RoleBadge.jsx` | NEW | Визуальный бейдж роли |
| `src/features/users/CreateUserModal.jsx` | NEW | Модал создания |
| `src/features/users/EditUserModal.jsx` | NEW | Модал редактирования роли |
| `src/features/users/ConfirmBlockModal.jsx` | NEW | Диалог подтверждения блокировки |
| `src/components/users/CreateEmployeeForm.jsx` | NEW | Переиспользуемая форма (RHF) |
| `src/components/users/RoleSelect.jsx` | NEW | Controlled select роли |
| `firestore.rules` | UPDATED | Правила для users (list + create/update) + activityLogs |

---

## Firestore Security Rules — ключевые изменения

**До (Feature #7):**
```
allow read: if isOwner(uid) || isAdmin() || isManager();
allow create: if isAdmin();
allow update: if isOwner(uid) || isAdmin();
```
Функции `isAdmin()` / `isManager()` использовали `request.auth.token.role` (custom claims).

**После (Feature #17):**
- `callerRole()` читает роль из Firestore `users/{uid}.role` — согласованно с UI (Feature #7).
- `allow read` включает `list` — необходим для `getDocs(collection(db, 'users'))` в `getUsers()`.
- `allow create` включает валидацию обязательных полей документа.
- Добавлена коллекция `activityLogs` (опциональный журнал действий admin).

**Важно:** `callerRole()` вызывает `get()` — каждое правило тратит один дополнительный read. Это приемлемо для MVP с десятками пользователей. При масштабировании (тысячи запросов/сек) следует перейти на custom claims.

---

## State Management

| State | Хранилище | Причина |
|-------|-----------|---------|
| Список пользователей | TanStack Query (`['users']`) | Server state; кешируется, инвалидируется после мутаций |
| Открытое модальное окно | `useState` в `UsersPage` | UI state, не нужен глобально |
| Выбранный пользователь для редактирования/блокировки | `useState` в `UsersPage` | Локальный selection state |
| Строка поиска | `useState` в `UsersPage` | Локальный фильтр по уже загруженным данным |

Zustand (`useAuthStore`) не используется для users — только для auth state. Это соответствует архитектурному принципу: Zustand для UI state, React Query для server state.

---

## Error Handling

### createEmployee
Ошибки Firebase Auth (из secondaryAuth) перехватываются в `usersService.js` и оборачиваются в читаемые русскоязычные сообщения через `mapAuthError(code)`. `CreateUserModal` получает ошибку через `setError('root', ...)` React Hook Form и отображает её в `data-testid="create-user-server-error"`.

### getUsers
Ошибки Firestore всплывают в React Query. `UsersPage` проверяет `isError` и рендерит `data-testid="users-error"` с кнопкой retry.

---

## data-testid Reference

| testid | Элемент |
|--------|---------|
| `users-page` | Корневой div `UsersPage` |
| `users-table` | Обёртка таблицы |
| `users-search` | Поле поиска |
| `users-add-button` | Кнопка «Добавить сотрудника» |
| `users-skeleton` | Строка-заглушка во время загрузки |
| `users-error` | Блок ошибки загрузки |
| `users-retry` | Кнопка «Повторить» |
| `users-empty` | Ячейка пустого состояния |
| `user-row-{uid}` | Строка таблицы |
| `user-cell-name-{uid}` | Ячейка имени |
| `user-cell-email-{uid}` | Ячейка email |
| `user-cell-role-{uid}` | Ячейка роли |
| `user-cell-status-{uid}` | Ячейка статуса |
| `user-role-badge-{uid}` | Бейдж роли (`RoleBadge`) |
| `btn-edit-user-{uid}` | Кнопка редактирования |
| `btn-toggle-block-{uid}` | Кнопка блокировки/разблокировки |
| `modal-create-user` | Модал создания |
| `create-employee-form` | Форма создания |
| `field-displayName` | Поле имени в форме создания |
| `field-email` | Поле email в форме создания |
| `field-password` | Поле пароля в форме создания |
| `field-role` | Select роли в форме создания |
| `create-user-name-error` | Ошибка валидации имени |
| `create-user-email-error` | Ошибка валидации email |
| `create-user-password-error` | Ошибка валидации пароля |
| `create-user-server-error` | Серверная ошибка создания |
| `create-user-submit` | Кнопка submit в `CreateUserModal` |
| `submit-create-employee` | Кнопка submit в `CreateEmployeeForm` |
| `create-user-cancel` | Кнопка отмены в модале создания |
| `modal-edit-user` | Модал редактирования |
| `edit-user-email` | Email (read-only) в модале редактирования |
| `edit-user-role` | Select роли в модале редактирования |
| `edit-user-submit` | Кнопка сохранения в модале редактирования |
| `edit-user-cancel` | Кнопка отмены в модале редактирования |
| `modal-confirm-block` | Диалог подтверждения блокировки |
| `confirm-block-ok` | Кнопка подтверждения |
| `confirm-block-cancel` | Кнопка отмены диалога |

---

## Out of Scope

- Реальная Firebase Auth блокировка (`admin.auth().updateUser`) — требует Admin SDK
- Мгновенный logout активных заблокированных сессий через `onSnapshot`
- Роль `admin` через UI (только Firebase Console / Cloud Functions)
- Удаление пользователей (аудит-требование)
- Принудительный сброс пароля
- Pagination / infinite scroll
- `activityLogs` запись при каждом действии (журнал — Feature #19)
