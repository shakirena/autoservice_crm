# Feature #12 — Dashboard с навигацией по ролям

## Обзор

Dashboard реализует вложенный роутинг через `DashboardLayout`, который оборачивает все защищённые страницы. Навигация управляется config-driven подходом: набор пунктов меню определяется ролью пользователя из `useAuth()`.

---

## Дерево компонентов

```
App
└── ProtectedRoute
    └── DashboardLayout                  [data-testid="dashboard-layout"]
        ├── Header                       [data-testid="dashboard-header"]
        │   ├── user.email / displayName [data-testid="header-user-email"]
        │   ├── badge: role              [data-testid="header-user-role"]
        │   └── кнопка «Выход»          [data-testid="header-sign-out"]
        ├── Sidebar                      [data-testid="sidebar"]
        │   └── NavLink × N             [data-testid="nav-item-{path}"]
        └── <Outlet />                   [data-testid="dashboard-content"]
            ├── DashboardIndexPage       [data-testid="page-dashboard-index"]
            ├── UsersPage                [data-testid="page-users"]
            ├── OrdersPage               [data-testid="page-orders"]
            ├── ClientsPage              [data-testid="page-clients"]
            ├── SettingsPage             [data-testid="page-settings"]
            └── MyOrdersPage             [data-testid="page-my-orders"]
```

---

## Стратегия вложенного роутинга (React Router 7)

```jsx
// src/App.jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<DashboardIndexPage />} />
  <Route path="users"     element={<UsersPage />} />
  <Route path="orders"    element={<OrdersPage />} />
  <Route path="clients"   element={<ClientsPage />} />
  <Route path="settings"  element={<SettingsPage />} />
  <Route path="my-orders" element={<MyOrdersPage />} />
</Route>
```

- `DashboardLayout` рендерит `<Outlet />` внутри основной области контента.
- Защита (`ProtectedRoute`) применяется один раз на уровне родительского маршрута — дочерние маршруты наследуют защиту автоматически.
- Переход по `/dashboard` (без дочернего сегмента) рендерит `index` — `DashboardIndexPage`.

---

## Config-driven навигация по ролям

```
src/config/navigation.js
  └── getNavItems(role) → NavItem[]
```

```ts
// JSDoc-тип
/**
 * @typedef {{ label: string, path: string, testId: string }} NavItem
 */
```

| Роль      | Пункты меню                                         |
|-----------|-----------------------------------------------------|
| admin     | Пользователи, Заказы, Клиенты, Настройки            |
| manager   | Заказы, Клиенты                                     |
| mechanic  | Мои заказы                                          |
| client    | (пустой список — клиентские страницы не реализованы)|
| unknown   | (пустой список, sidebar показывает заглушку)        |

### Поток данных

```
AuthContext (useAuth) → role
        ↓
Sidebar.jsx
  getNavItems(role)   ← navigation.js
        ↓
NavLink[]  (React Router NavLink, активный стиль через style callback)
```

- `Sidebar` не знает о Firebase / Zustand — принимает только то, что возвращает `useAuth()`.
- Если роль не входит ни в один ключ конфига, `getNavItems` возвращает `[]`, `Sidebar` рендерит контейнер с `data-testid="sidebar-empty"`.

---

## Защищённость маршрутов

```
/dashboard/*  →  ProtectedRoute → проверяет user + loading
                  ↳ loading=true  →  <div data-testid="app-loading" />
                  ↳ user=null     →  <Navigate to="/login" replace />
                  ↳ user≠null     →  DashboardLayout + дочерний маршрут
```

Авторизация на уровне страниц (например, только admin видит `/dashboard/users`) реализуется отдельным `RoleRoute`-компонентом — вне скоупа Feature #12.

---

## Соглашения

- ESM only, no TypeScript.
- Все key-элементы имеют `data-testid` — E2E тесты используют только их.
- Никаких CSS-фреймворков — только inline styles.
- `NavLink` из react-router-dom — активное состояние через `style` callback (`isActive`).
- Firestore/Firebase не импортируются ни в один layout/component — только через `useAuth()`.
