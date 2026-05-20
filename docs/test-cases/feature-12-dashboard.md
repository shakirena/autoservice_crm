# Тест-кейсы: Feature #12 — Dashboard с навигацией по ролям

## Покрытие

| Story | Файл тестов | Кейсов | Статус |
|-------|-------------|--------|--------|
| US-1: navigation config | pages/__tests__/DashboardPage.test.jsx | 2 | PASS |
| US-2: Sidebar + Header | pages/__tests__/DashboardPage.test.jsx | 5 | PASS |
| US-3: Страницы-заглушки | (lint + build) | — | PASS |
| US-4: App.jsx роутинг | (build + интеграция) | — | PASS |

**Итого автотестов:** 25/25 PASS

---

## TC-08: Header

| # | Сценарий | Ожидаемый результат | Статус |
|---|----------|---------------------|--------|
| 8.1 | Рендер с auth user | email, роль, кнопка выхода | PASS |
| 8.2 | displayName заменяет email если задан | Показывает displayName, а не email | PASS |

---

## TC-09: Sidebar

| # | Сценарий | Ожидаемый результат | Статус |
|---|----------|---------------------|--------|
| 9.1 | Роль admin | 4 пункта: users, orders, clients, settings | PASS |
| 9.2 | Роль mechanic | Только my-orders, нет orders | PASS |
| 9.3 | Неизвестная роль | sidebar-empty, нет sidebar | PASS |

---

## TC-10: RoleGuard + App routing (ручная верификация)

| # | Сценарий | Ожидаемый результат | Статус |
|---|----------|---------------------|--------|
| 10.1 | Mechanic открывает /dashboard/users | Редирект на /dashboard | PASS (code review) |
| 10.2 | Manager открывает /dashboard/settings | Редирект на /dashboard | PASS (code review) |
| 10.3 | Admin открывает /dashboard/users | Рендер UsersPage | PASS (code review) |
| 10.4 | Незалогиненный → /dashboard | Редирект на /login | PASS (code review) |

---

## Итог G5

- **Автотесты:** 25/25 PASS
- **Линтер:** 0 ошибок
- **Сборка:** успешно
- **Security:** WARN исправлен → RoleGuard на все вложенные маршруты
