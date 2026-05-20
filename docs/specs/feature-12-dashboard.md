# Spec: Feature #12 — Dashboard с навигацией по ролям

## Overview

Реализует полноценный Dashboard-лейаут для AutoService CRM с ролезависимой навигацией через Sidebar, Header с данными пользователя и вложенной маршрутизацией через React Router 7. Текущая заглушка `src/pages/DashboardPage.jsx` полностью заменяется: вместо одного компонента появляется Layout-компонент (`DashboardLayout`) с вложенными маршрутами `/dashboard/*`, каждый из которых рендерит соответствующую страницу-заглушку.

Зависимости:
- Feature #1 (реализована) — `src/lib/firebase.js`, базовая структура проекта
- Feature #7 (реализована) — `src/lib/authContext.jsx` → `useAuth()` возвращает `{ user, role, loading, signOut }`; `ProtectedRoute` в `App.jsx`; маршруты `/login` и `/dashboard`

Роли из `useAuth()`:
- `'admin'` — полный доступ ко всем разделам
- `'manager'` — операционные разделы (заказы, клиенты)
- `'mechanic'` — только собственные заказы
- `'client'` — вне скоупа данной фичи (редирект или пустой dashboard)

---

## User Stories

### US-1 — Роль-зависимая навигация (Sidebar)

**As a** авторизованный пользователь с ролью admin, manager или mechanic,  
**I want** видеть в боковой панели только те пункты меню, которые соответствуют моей роли,  
**so that** интерфейс не перегружен недоступными разделами и у меня нет визуального доступа к функциям, которых нет у моей роли.

**Details:**
- `Sidebar` получает роль через `useAuth()` и рендерит список ссылок согласно Navigation Map (см. ниже)
- Активный маршрут подсвечивается: используется `NavLink` из `react-router-dom` с CSS-классом или inline-стилем для `isActive`
- При изменении роли в runtime (например, смена учётной записи без перезагрузки) Sidebar обновляется автоматически — реактивность через `useAuth()`
- Sidebar не управляет состоянием «открыт/закрыт» в данной фиче (мобильная адаптация — Out of Scope)

---

### US-2 — Header с данными пользователя

**As a** авторизованный пользователь,  
**I want** видеть в шапке свой email, роль в виде бейджа и кнопку выхода,  
**so that** я всегда знаю, под каким аккаунтом работаю, и могу легко выйти.

**Details:**
- `Header` получает `user`, `role`, `signOut` через `useAuth()`
- Email отображается как `user.email`
- Роль отображается как бейдж (`<span>`) с текстом роли: admin / manager / mechanic
- Кнопка «Выйти» вызывает `signOut()` из `useAuth()` — после выхода React Router перенаправляет на `/login` (логика уже в `ProtectedRoute`)
- Во время `loading === true` Header показывает скелетон / пустые placeholder-значения, кнопка выхода недоступна (`disabled`)

---

### US-3 — Вложенный роутинг /dashboard/*

**As a** разработчик фичи,  
**I want** настроить вложенные маршруты React Router 7 под `/dashboard/*`,  
**so that** каждый раздел (users, orders, clients, my-orders, settings) рендерится в области контента DashboardLayout без перезагрузки всей страницы.

**Details:**
- `App.jsx` обновляется: маршрут `/dashboard` заменяется на `/dashboard/*` с `element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}`
- Внутри `DashboardLayout` используется `<Outlet />` из `react-router-dom` — дочерние маршруты рендерятся в области контента
- Дочерние маршруты объявляются внутри родительского `<Route path="/dashboard/*">`:
  - `<Route index />` — редирект на первый доступный раздел согласно роли (см. Navigation Map)
  - `<Route path="orders" />`, `<Route path="clients" />`, `<Route path="users" />`, `<Route path="settings" />`, `<Route path="my-orders" />`
- Неизвестный маршрут (`/dashboard/something-else`) — редирект на index-маршрут роли
- `DashboardPage.jsx` удаляется как файл, его логика распределяется по новым компонентам

---

### US-4 — Страницы-заглушки для каждого раздела

**As a** разработчик,  
**I want** минимальные страницы-заглушки для каждого раздела dashboard,  
**so that** маршруты работают и дальнейшие фичи могут заменять заглушки реальными реализациями поэтапно.

**Details:**
- Каждая страница-заглушка — отдельный компонент в `src/features/<domain>/` или `src/pages/dashboard/`
- Заглушка содержит: заголовок раздела, `data-testid` корневого элемента, текст-placeholder «Раздел в разработке»
- Страницы не содержат бизнес-логики — только разметка
- Все `data-testid` уникальны в рамках приложения

---

## Acceptance Criteria

| # | Критерий | Проверяется |
|---|----------|-------------|
| AC-1 | `DashboardLayout` рендерит `Sidebar`, `Header` и `<Outlet />` | DOM: `[data-testid="dashboard-layout"]` содержит `[data-testid="sidebar"]`, `[data-testid="header"]`, `[data-testid="dashboard-content"]` |
| AC-2 | Admin видит в Sidebar ровно 4 пункта: Users, Orders, Clients, Settings | DOM под `[data-testid="sidebar"]`: ровно 4 элемента `[data-testid^="nav-link-"]` |
| AC-3 | Manager видит в Sidebar ровно 2 пункта: Orders, Clients | DOM под `[data-testid="sidebar"]`: ровно 2 элемента `[data-testid^="nav-link-"]` |
| AC-4 | Mechanic видит в Sidebar ровно 1 пункт: My Orders | DOM под `[data-testid="sidebar"]`: ровно 1 элемент `[data-testid^="nav-link-"]` |
| AC-5 | Активный NavLink имеет атрибут `aria-current="page"` | DOM при каждом маршруте |
| AC-6 | Header отображает `user.email` | `[data-testid="header-user-email"]` содержит текст email |
| AC-7 | Header отображает бейдж с ролью | `[data-testid="header-user-role"]` содержит текст роли |
| AC-8 | Кнопка выхода вызывает `signOut()` и приводит к редиректу на `/login` | Клик на `[data-testid="header-sign-out"]` → `window.location.pathname === '/login'` |
| AC-9 | `App.jsx` регистрирует маршрут `/dashboard/*` | Code review: `<Route path="/dashboard/*">` |
| AC-10 | `<Outlet />` находится внутри `DashboardLayout`, не в `App.jsx` | Code review |
| AC-11 | Переход на `/dashboard` (без суффикса) редиректит на первый раздел роли | Прямой переход в браузере / E2E |
| AC-12 | Переход на `/dashboard/something-unknown` редиректит на index-маршрут роли | Прямой URL в браузере |
| AC-13 | Страница `/dashboard/orders` рендерит `[data-testid="orders-page"]` | DOM после навигации |
| AC-14 | Страница `/dashboard/clients` рендерит `[data-testid="clients-page"]` | DOM после навигации |
| AC-15 | Страница `/dashboard/users` рендерит `[data-testid="users-page"]` | DOM после навигации |
| AC-16 | Страница `/dashboard/settings` рендерит `[data-testid="settings-page"]` | DOM после навигации |
| AC-17 | Страница `/dashboard/my-orders` рендерит `[data-testid="my-orders-page"]` | DOM после навигации |
| AC-18 | Mechanic не может получить доступ к `/dashboard/users` или `/dashboard/settings` — редирект на `/dashboard/my-orders` | Прямой URL |
| AC-19 | Manager не может получить доступ к `/dashboard/users` или `/dashboard/settings` — редирект на `/dashboard/orders` | Прямой URL |
| AC-20 | `npm run lint` завершается без ошибок | CI / локально |
| AC-21 | `npm run build` завершается без ошибок | CI / локально |

---

## Navigation Map

| Роль | Пункт меню | Маршрут | `data-testid` ссылки | `data-testid` страницы |
|------|-----------|---------|----------------------|------------------------|
| admin | Users | `/dashboard/users` | `nav-link-users` | `users-page` |
| admin | Orders | `/dashboard/orders` | `nav-link-orders` | `orders-page` |
| admin | Clients | `/dashboard/clients` | `nav-link-clients` | `clients-page` |
| admin | Settings | `/dashboard/settings` | `nav-link-settings` | `settings-page` |
| manager | Orders | `/dashboard/orders` | `nav-link-orders` | `orders-page` |
| manager | Clients | `/dashboard/clients` | `nav-link-clients` | `clients-page` |
| mechanic | My Orders | `/dashboard/my-orders` | `nav-link-my-orders` | `my-orders-page` |

**Index-редирект по роли** (маршрут `/dashboard` без суффикса):

| Роль | Redirect to |
|------|-------------|
| `admin` | `/dashboard/orders` |
| `manager` | `/dashboard/orders` |
| `mechanic` | `/dashboard/my-orders` |
| `client` | `/dashboard/orders` (временно, до Feature #20) |

**Защита маршрутов на уровне Sidebar:** маршруты, недоступные роли, не отображаются в Sidebar. Прямой переход на недоступный маршрут обрабатывается через `RoleGuard` компонент (см. Component Tree) — редирект на index-маршрут роли.

---

## Component Tree

```
App
└── Route path="/dashboard/*"
    └── ProtectedRoute                         (существующий, src/App.jsx)
        └── DashboardLayout                    (новый, src/features/dashboard/DashboardLayout.jsx)
            ├── Sidebar                        (новый, src/features/dashboard/Sidebar.jsx)
            │   └── NavLink × N               (react-router-dom, по роли)
            ├── Header                         (новый, src/features/dashboard/Header.jsx)
            │   ├── <span> user.email
            │   ├── <span> role badge
            │   └── <button> signOut
            └── <main data-testid="dashboard-content">
                └── <Outlet />                 (react-router-dom)
                    ├── Route index            → Navigate to role default
                    ├── Route path="orders"
                    │   └── RoleGuard (admin|manager|client)
                    │       └── OrdersPage     (новый, src/pages/dashboard/OrdersPage.jsx)
                    ├── Route path="clients"
                    │   └── RoleGuard (admin|manager)
                    │       └── ClientsPage    (новый, src/pages/dashboard/ClientsPage.jsx)
                    ├── Route path="users"
                    │   └── RoleGuard (admin)
                    │       └── UsersPage      (новый, src/pages/dashboard/UsersPage.jsx)
                    ├── Route path="settings"
                    │   └── RoleGuard (admin)
                    │       └── SettingsPage   (новый, src/pages/dashboard/SettingsPage.jsx)
                    └── Route path="my-orders"
                        └── RoleGuard (mechanic)
                            └── MyOrdersPage   (новый, src/pages/dashboard/MyOrdersPage.jsx)
```

### Новые файлы

| Файл | Назначение |
|------|-----------|
| `src/features/dashboard/DashboardLayout.jsx` | Корневой лейаут: собирает Sidebar + Header + Outlet |
| `src/features/dashboard/Sidebar.jsx` | Боковая панель с NavLink-ами по роли |
| `src/features/dashboard/Header.jsx` | Шапка: email, role badge, кнопка выхода |
| `src/features/dashboard/RoleGuard.jsx` | Обёртка для дочерних маршрутов: проверяет роль, редиректит если доступ запрещён |
| `src/pages/dashboard/OrdersPage.jsx` | Страница-заглушка «Заказы» |
| `src/pages/dashboard/ClientsPage.jsx` | Страница-заглушка «Клиенты» |
| `src/pages/dashboard/UsersPage.jsx` | Страница-заглушка «Пользователи» |
| `src/pages/dashboard/SettingsPage.jsx` | Страница-заглушка «Настройки» |
| `src/pages/dashboard/MyOrdersPage.jsx` | Страница-заглушка «Мои заказы» |

### Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/App.jsx` | `/dashboard` → `/dashboard/*`; добавить дочерние `<Route>` внутри родительского; удалить импорт `DashboardPage` |
| `src/pages/DashboardPage.jsx` | **Удалить** — заменяется `DashboardLayout` |

### RoleGuard

`RoleGuard` принимает `allowedRoles: string[]` и `children`. Читает `role` через `useAuth()`. Если роль не входит в `allowedRoles` — возвращает `<Navigate to={getRoleDefaultPath(role)} replace />`. Иначе рендерит `children`.

```jsx
// src/features/dashboard/RoleGuard.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/authContext.jsx'

const ROLE_DEFAULT = {
  admin: '/dashboard/orders',
  manager: '/dashboard/orders',
  mechanic: '/dashboard/my-orders',
  client: '/dashboard/orders',
}

export function getRoleDefaultPath(role) {
  return ROLE_DEFAULT[role] ?? '/dashboard/orders'
}

export function RoleGuard({ allowedRoles, children }) {
  const { role, loading } = useAuth()
  if (loading) return null
  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRoleDefaultPath(role)} replace />
  }
  return children
}
```

### Sidebar: логика фильтрации пунктов меню

```js
// src/features/dashboard/Sidebar.jsx — константа конфигурации
const NAV_ITEMS = [
  { label: 'Пользователи', path: '/dashboard/users',     testId: 'nav-link-users',     roles: ['admin'] },
  { label: 'Заказы',       path: '/dashboard/orders',    testId: 'nav-link-orders',    roles: ['admin', 'manager', 'client'] },
  { label: 'Клиенты',      path: '/dashboard/clients',   testId: 'nav-link-clients',   roles: ['admin', 'manager'] },
  { label: 'Мои заказы',   path: '/dashboard/my-orders', testId: 'nav-link-my-orders', roles: ['mechanic'] },
  { label: 'Настройки',    path: '/dashboard/settings',  testId: 'nav-link-settings',  roles: ['admin'] },
]

// Внутри Sidebar:
const items = NAV_ITEMS.filter(item => item.roles.includes(role))
```

---

## Out of Scope

- Мобильная адаптация (hamburger-меню, collapsed Sidebar)
- Анимации открытия/закрытия Sidebar
- Реальная бизнес-логика страниц (OrdersPage, ClientsPage и т. д.) — только заглушки
- Управление ролями и правами через UI
- Страница профиля пользователя (`/dashboard/profile`)
- Роль `client` в Sidebar — dashboard для клиентов выносится в отдельную фичу
- Breadcrumbs и вторичная навигация
- Persistent state Sidebar (запоминание выбранного раздела между сессиями)
- Dark mode / темизация
- CSS-библиотека или UI-фреймворк — компоненты используют plain CSS или inline-стили на усмотрение разработчика
- Уведомления (badge с числом) на пунктах меню
- Страница 404 для полностью неизвестных маршрутов вне `/dashboard`
