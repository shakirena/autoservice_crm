# Architecture: Feature #57 — Таблицы данных

## Status: ready-for-dev

## Текущее состояние кода

### Что уже реализовано (переиспользуем)
- `VehicleTable.jsx` — полноценная `<table>` с SkeletonRow, empty state, VehicleRow
- `OrderList.jsx` — полноценная `<table>` с SkeletonRow, empty state, OrderRow + OrderStatusBadge
- `VehicleComponentBadge.jsx` — бейдж узла (переиспользуем в ServiceTable)
- `OrderStatusBadge.jsx` — бейдж статуса заказа
- `useServiceCatalog.js` — useServices(filters), useCategories(), useArchiveService()
- `useVehicles.js` — useVehicles()
- `useOrders.js` — useOrders()

### Что требует создания
- `DataTable.jsx` — общий shell с консистентными стилями
- `ServiceTable.jsx` — таблица услуг (сейчас ServiceList рендерит ServiceCard-карточки)

### Что требует доработки
- `VehicleTable.jsx` — применить striped/hover/sticky styles
- `OrderList.jsx` — добавить колонку №, применить общие стили (или заменить на DataTable)

## Architecture Decision Records

### ADR-57-01: DataTable — оболочка vs. полное управление данными

**Решение:** DataTable — только layout/style оболочка. Он не знает о данных.

**Причина:** ServiceTable, VehicleTable, OrderList имеют разные props-контракты, разные empty state (с кнопками), разные SkeletonRow (разное количество колонок). Полная параметризация усложнила бы компонент без реальной выгоды.

**DataTable API:**
```jsx
<DataTable testId="..." stickyHeader>
  <DataTable.Head>
    <tr><th>...</th></tr>
  </DataTable.Head>
  <DataTable.Body>
    {/* rows | skeleton | empty */}
  </DataTable.Body>
</DataTable>
```

Альтернативно — просто экспортировать style-константы и SkeletonCell:
```js
export { tableWrapStyle, tableStyle, thStyle, tdStyle, trStripeStyle, trHoverStyle }
```

**Выбран:** экспорт общих стилей + SkeletonRow helper — меньше coupling, проще адаптировать существующие компоненты.

### ADR-57-02: ServiceTable — данные из hooks или через props?

**Решение:** ServiceTable получает данные через props (services, categories), состояния loading/error обрабатывает ServiceList-обёртка (остаётся в ServicesPage).

**Причина:** Согласуется с паттерном VehicleTable (данные через props) и OrderList (данные через props). Изоляция fetching в Pages/hooks слое.

### ADR-57-03: Переименование OrderList → OrderTable

**Решение:** НЕ переименовывать файл. Внутри файла переименовать функцию `OrderList` → `OrderTable` и обновить дефолтный экспорт. Файл остаётся `OrderList.jsx` для совместимости (или переименовать и обновить импорт в OrdersPage).

**Выбрано:** создать новый `OrderTable.jsx` рядом с OrderList.jsx как чистый переработанный компонент, обновить импорт в OrdersPage. OrderList.jsx оставить (backward compat).

### ADR-57-04: Striped rows — CSS vs inline

**Решение:** Inline styles через `:nth-child` невозможен. Реализовать через `index % 2` в row-компонентах.

```jsx
vehicles.map((v, i) => (
  <VehicleRow key={v.id} vehicle={v} striped={i % 2 === 1} ... />
))
```

В VehicleRow:
```jsx
style={{ ...tdBaseStyle, background: striped ? '#f9fafb' : '#ffffff' }}
```

### ADR-57-05: Hover effect — inline styles

**Решение:** useState на уровне Row-компонента для hover.

```jsx
const [hovered, setHovered] = useState(false)
<tr
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  style={{ background: hovered ? '#f0f9ff' : (striped ? '#f9fafb' : '#fff') }}
>
```

### ADR-57-06: Sticky header — inline styles

```jsx
// th style:
position: 'sticky',
top: 0,
zIndex: 1,
background: '#f9fafb', // нужен явный фон чтобы не просвечивал контент
```

Для работы sticky необходим `overflowX: 'auto'` на wrapper, а не `overflow: 'hidden'`.
VehicleTable использует `overflow: 'hidden'` — нужно исправить на `overflowX: 'auto'`.

## Component Tree (после реализации)

```
ServicesPage
  ├── CategoryList
  ├── CategoryForm (modal)
  ├── ServiceTable          ← новый компонент
  │     ├── SkeletonRow (×3 при loading)
  │     ├── EmptyRow
  │     └── ServiceRow (×N) ← встроен в ServiceTable
  └── ServiceForm (modal)

VehiclesPage
  └── VehicleTable          ← обновлённый
        ├── SkeletonRow (×3)
        ├── EmptyRow
        └── VehicleRow (×N) ← получает prop striped, hover

OrdersPage
  └── OrderTable            ← новый файл (рефактор OrderList)
        ├── SkeletonRow (×3)
        ├── EmptyRow
        └── OrderRow (×N)   ← обновить: добавить №, striped, hover
```

## DataTable.jsx — shared style exports

```jsx
// src/components/ui/DataTable.jsx
// Экспортирует общие стили и SkeletonCell для переиспользования

export const tableWrapStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  overflowX: 'auto',  // ← важно: не 'hidden', иначе sticky не работает
}

export const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
}

export const thStyle = {
  padding: '11px 16px',
  borderBottom: '2px solid #e5e7eb',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#6b7280',
  whiteSpace: 'nowrap',
  background: '#f9fafb',
  position: 'sticky',
  top: 0,
  zIndex: 1,
}

export const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: '14px',
  verticalAlign: 'middle',
}

// Цвет строки по индексу и hover-состоянию
export function rowBackground(index, hovered) {
  if (hovered) return '#f0f9ff'
  return index % 2 === 1 ? '#f9fafb' : '#ffffff'
}

// SkeletonCell — заглушка при загрузке
export function SkeletonCell({ width = 80 }) {
  return (
    <td style={tdStyle}>
      <div style={{
        height: '14px',
        background: '#e5e7eb',
        borderRadius: '4px',
        width,
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
    </td>
  )
}
```

## ServiceTable.jsx — структура

```jsx
// src/features/services/ServiceTable.jsx
import { useState } from 'react'
import { useServices } from '../../hooks/useServiceCatalog.js'
import { useCategories } from '../../hooks/useServiceCatalog.js'
import { useArchiveService } from '../../hooks/useServiceCatalog.js'
import VehicleComponentBadge from './VehicleComponentBadge.jsx'
import { tableWrapStyle, tableStyle, thStyle, tdStyle, rowBackground } from '../../components/ui/DataTable.jsx'

// Props: { filters, isAdmin, onEdit }
// Данные: загружает сам через useServices(filters) + useCategories()
```

## File Change Summary

| Файл | Тип изменения | Story |
|------|--------------|-------|
| `src/components/ui/DataTable.jsx` | CREATE | A |
| `src/features/services/ServiceTable.jsx` | CREATE | B |
| `src/features/vehicles/VehicleTable.jsx` | UPDATE — sticky/striped/hover | B |
| `src/features/vehicles/VehicleRow.jsx` | UPDATE — striped prop, hover state | B |
| `src/features/orders/OrderTable.jsx` | CREATE (рефактор OrderList) | C |
| `src/features/orders/OrderRow.jsx` | UPDATE — № колонка, striped, hover | C |
| `src/pages/dashboard/ServicesPage.jsx` | UPDATE — ServiceList → ServiceTable | B |
| `src/pages/dashboard/OrdersPage.jsx` | UPDATE — OrderList → OrderTable | C |

## Risks & Mitigations

| Риск | Митигация |
|------|-----------|
| Sticky header не работает с `overflow: hidden` | Заменить на `overflowX: auto` в table wrappers |
| Нарушить существующие тесты `ServiceCard.test.jsx` | ServiceCard.jsx остаётся нетронутым |
| Нарушить wizard (использует ServiceList) | ServiceList.jsx остаётся нетронутым |
| Колонка "Категория" в ServiceTable требует join с categories | useCategories() в ServiceTable, map по categoryId |
