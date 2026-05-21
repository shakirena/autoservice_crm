# Architecture: Feature #22 — Отчёты и аналитика

_Дата: 2026-05-21 | Автор: architect_

---

## ADR (Architecture Decision Records)

### ADR-22-01: Все вычисления аналитики — клиент-сайд (без Cloud Functions)

**Статус:** Accepted

**Контекст:**
Аналитические метрики (выручка, топ-услуги, статистика сотрудников) могут вычисляться:
- На сервере через Cloud Functions (Firebase) — агрегация в Cloud, результат в Firestore или HTTP response
- На клиенте из уже загруженной коллекции `orders` через `useMemo`

**Решение:** Все агрегации вычисляются клиент-сайд через чистые функции в `analyticsService.js`. Данные поступают из кеша `useOrders()` (TanStack Query) без дополнительных Firestore-запросов.

**Обоснование:**
- MVP-объём: < 5 000 заказов — вычисления в памяти браузера не создают заметной задержки
- `orders` уже загружены в кеш TanStack Query для других страниц — повторного сетевого запроса нет
- Cloud Functions требуют деплоя, тарификации и отдельного тестирования — неоправданно для MVP
- Чистые функции легко тестируются (Vitest) без моков Firebase

**Последствия:** При росте > 50 000 заказов — перейти на Cloud Functions (scheduled aggregation) с хранением агрегатов в `analytics/{period}` Firestore-документах. Интерфейс `analyticsService.js` остаётся совместимым.

---

### ADR-22-02: CSS-only столбчатые диаграммы (без charting-библиотек)

**Статус:** Accepted

**Контекст:**
Визуализация выручки по дням требует диаграммы. Варианты:
- Recharts (~300 KB gzip) — React-native, декларативный
- Chart.js (~200 KB gzip) — DOM-based, требует canvas + wrapper
- CSS flex/grid bars — нулевой бандл, полный контроль над стилями

**Решение:** Реализовать столбчатый график `RevenueChart.jsx` через CSS flexbox: высота `<div>` пропорциональна максимальному значению в серии. Tooltip через CSS `:hover` + `title` атрибут.

**Обоснование:**
- Бандл проекта не увеличивается
- Для MVP достаточно базовой визуализации «выше = больше»
- Кастомные стили без override библиотечных тем
- Соответствует ограничению CLAUDE.md: «No charting libraries»

**Последствия:** Функциональность ограничена по сравнению с Recharts (нет зума, экспорта, tooltip с несколькими метриками). При необходимости продвинутой визуализации — подключить Recharts в отдельном PR и заменить `RevenueChart.jsx`.

---

### ADR-22-03: Фильтр периода — UI-состояние (не URL-параметр)

**Статус:** Accepted

**Контекст:**
Фильтр «Сегодня / Неделя / Месяц / Всё время» может храниться:
- В URL: `/dashboard/analytics?period=week` — поддерживает закладки и «назад»
- В `useState` компонента — сбрасывается при переходе на другую страницу

**Решение:** `useState('month')` в `AnalyticsPage.jsx`. Период не попадает в URL.

**Обоснование:**
- Аналитика — административный инструмент, не публичная ссылка
- URL-параметры требуют синхронизации с `useSearchParams` — дополнительная сложность
- Согласуется с паттерном `statusFilter` в `OrdersPage.jsx` (ADR-21 прецедент)
- Default `'month'` — наиболее полезный вид при открытии страницы

**Последствия:** Выбранный период не сохраняется при навигации на другие страницы и обратно. При необходимости персистентности — перенести в Zustand `useAnalyticsStore` или URL-params в отдельном PR.

---

## Поток данных

```
AnalyticsPage
  │
  ├── useState(period)            — 'today'|'week'|'month'|'all'
  │
  └── useAnalytics(period)
        │
        ├── useOrders()           — TanStack Query, кеш ['orders']
        │       └── getOrders()   — Firestore getDocs (уже закеширован)
        │
        └── useMemo (6 вычислений)
              ├── filterByPeriod(orders, period)   → filtered[]
              ├── computeRevenue(filtered)          → number ₼
              ├── computeOrderCount(filtered)       → number
              ├── computeAvgTicket(filtered)        → number ₼
              ├── computeTopServices(filtered, 5)   → [{name,count,revenue}]
              └── computeStaffStats(filtered)       → [{uid,count,revenue}]
```

**Нет дополнительных Firestore-запросов** — только данные из кеша `useOrders()`.

Для resolve `uid → displayName` в `StaffTable`: компонент вызывает `useUsers()` (хук feature #17, уже существует) и делает join клиент-сайд.

---

## Безопасность

### Firestore Rules

`orders` уже доступны admin для чтения (существующее правило feature #21):

```javascript
match /orders/{orderId} {
  allow read: if isAdmin() || isManager() || isMechanic();
  ...
}
```

Аналитика использует только `read` на `orders` — **новые правила не нужны**.

### UI-защита

Маршрут `/dashboard/analytics` обёрнут в `<RoleGuard allowed={['admin']}>` — только admin видит страницу. Mechanic и manager перенаправляются на `/dashboard`.

### Принципы

1. `analyticsService.js` — чистый модуль без Firebase-импортов. Не имеет прямого доступа к Firestore.
2. Данные поступают только через `useOrders()` — существующий авторизованный запрос.
3. Страница аналитики не экспортирует данные на MVP — нет риска утечки через file download.

---

## Интерфейс аналитического сервиса

Файл: `src/services/analyticsService.js`

```javascript
filterByPeriod(orders, period)     → OrderDoc[]
  — period: 'today'|'week'|'month'|'all'
  — сравнение по полю date (ISO YYYY-MM-DD)

computeRevenue(orders)             → number
  — сумма totalAmount только completed заказов

computeOrderCount(orders)          → number
  — count всех заказов в массиве (любой статус)

computeAvgTicket(orders)           → number
  — computeRevenue / кол-во completed заказов, или 0

computeTopServices(orders, limit=5) → Array<{name,count,revenue}>
  — группировка по services[*].name
  — сортировка по revenue desc, limit

computeStaffStats(orders)          → Array<{uid,count,revenue}>
  — группировка по createdBy
  — count = все заказы, revenue = сумма totalAmount completed
  — сортировка по revenue desc
```

---

## Архитектура компонентов

```
/dashboard/analytics    ←→  AnalyticsPage       (pages/dashboard/AnalyticsPage.jsx)
    │
    ├── useAnalytics(period)              (hooks/useAnalytics.js)
    │       └── useOrders() + useMemo
    │
    ├── PeriodFilter.jsx                  (features/analytics/PeriodFilter.jsx)
    │       └── button group: today/week/month/all
    │
    ├── KpiCard.jsx × 3                   (features/analytics/KpiCard.jsx)
    │       └── revenue, orderCount, avgTicket
    │
    ├── RevenueChart.jsx                  (features/analytics/RevenueChart.jsx)
    │       └── CSS flex bars, groupByDay(filtered)
    │
    ├── TopServicesTable.jsx              (features/analytics/TopServicesTable.jsx)
    │       └── название | кол-во | выручка ₼
    │
    └── StaffTable.jsx                    (features/analytics/StaffTable.jsx)
            ├── useUsers() — resolve uid → displayName
            └── сотрудник | заказов | выручка ₼
```

---

## Созданные / обновлённые файлы

| Файл | Описание |
|------|----------|
| `docs/arch/feature-22-analytics.md` | Этот документ |
| `src/services/analyticsService.js` | Чистые функции аналитики |
| `src/hooks/useAnalytics.js` | Хук: useOrders + useMemo агрегации |
| `src/features/analytics/KpiCard.jsx` | Карточка KPI-метрики |
| `src/features/analytics/PeriodFilter.jsx` | Кнопки фильтра периода |
| `src/features/analytics/RevenueChart.jsx` | CSS-only столбчатая диаграмма |
| `src/features/analytics/TopServicesTable.jsx` | Таблица топ-услуг |
| `src/features/analytics/StaffTable.jsx` | Таблица статистики сотрудников |
| `src/pages/dashboard/AnalyticsPage.jsx` | Главная страница аналитики |
| `src/config/navigation.js` | +Аналитика в nav admin |
| `src/App.jsx` | +маршрут /dashboard/analytics (admin only) |
| `firestore.rules` | Без изменений — orders читаемы admin уже |

---

## Вне scope (MVP)

- Экспорт в CSV / PDF
- Сравнение периодов (текущий vs предыдущий)
- Фильтр по конкретному сотруднику
- График динамики заказов (не выручки)
- Уведомления по KPI-порогам
- Серверная агрегация (Cloud Functions scheduled)
