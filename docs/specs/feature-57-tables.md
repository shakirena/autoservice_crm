# Spec: Feature #57 — Таблицы данных для Services, Vehicles, Orders

## Контекст

Отображение данных Услуг, Автомобилей и Заказов в виде красиво оформленных таблиц. В текущем состоянии:
- **VehicleTable** — уже реализован как `<table>` в `src/features/vehicles/VehicleTable.jsx` (с SkeletonRow, empty state, VehicleRow)
- **OrderList** — уже реализован как `<table>` в `src/features/orders/OrderList.jsx` (с SkeletonRow, empty state, OrderRow, OrderStatusBadge)
- **ServiceList** — реализован как список карточек `ServiceCard` — **НЕ таблица** (подлежит замене)

## Acceptance Criteria

| ID | Критерий | Покрытие |
|----|----------|----------|
| AC-1 | `/dashboard/services` — таблица: Название, Категория, Узел, Цена, Статус, Действия | ServiceTable новый компонент |
| AC-2 | `/dashboard/vehicles` — таблица: Марка/Модель, Год, Гос. номер, VIN, Клиент, Действия | VehicleTable уже имеет нужные колонки, требует полировки |
| AC-3 | `/dashboard/orders` — таблица: №, Клиент, Автомобиль, Статус, Сумма, Дата, Действия | OrderList(→ OrderTable) нужно добавить № заказа |
| AC-4 | Striped rows, hover-эффект, sticky-заголовок | Единый DataTable обеспечивает стили |
| AC-5 | Loading/error/empty состояния внутри таблицы | SkeletonRow уже есть; унифицировать в DataTable |
| AC-6 | `data-testid` сохранены | Сохранить все существующие testid |

## User Stories

### US-1: Shared DataTable Component
**Как** разработчик,  
**я хочу** единый переиспользуемый компонент `DataTable`,  
**чтобы** все таблицы имели консистентный внешний вид (striped, hover, sticky header).

**Acceptance Criteria:**
- `DataTable` принимает `columns`, `data`, `isLoading`, `emptyNode` props
- Striped rows: нечётные строки `#ffffff`, чётные `#f9fafb`
- Hover: строка подсвечивается `#f0f9ff` при наведении
- Sticky header: `position: sticky; top: 0; z-index: 1`
- SkeletonRow — N штук при `isLoading`
- `data-testid="data-table"` на корневом элементе

### US-2: ServiceTable
**Как** менеджер или admin,  
**я хочу** видеть услуги в виде таблицы со столбцами: Название, Категория, Узел, Цена, Статус, Действия,  
**чтобы** быстро находить и редактировать услуги.

**Acceptance Criteria:**
- Столбцы: Название | Категория | Узел | Цена (₼) | Статус | Действия
- Статус: "Активна" (зелёный бейдж) / "Архив" (серый бейдж) на основе `service.archived`
- Категория: отображать имя по `categoryId` из `useCategories()`
- Узел: `VehicleComponentBadge`
- Действия (isAdmin): кнопки "Редактировать" и "Архивировать/Восстановить"
- `data-testid="service-table"` на таблице; строки `data-testid="service-row-{id}"`
- Фильтры (vehicleComponent, archived) — остаются в `ServicesPage`

### US-3: VehicleTable — доработка
**Как** пользователь,  
**я хочу** видеть автомобили в таблице с hover/striped стилями,  
**чтобы** удобно читать данные.

**Acceptance Criteria:**
- Существующие колонки: Марка | Модель | Год | Гос.номер | VIN | Клиент | Действия — сохраняются
- Применить единые стили из DataTable: striped, hover, sticky header
- Все `data-testid` сохраняются

### US-4: OrderTable
**Как** менеджер или admin,  
**я хочу** видеть заказы в таблице со столбцом "Номер заказа",  
**чтобы** быстро идентифицировать заказы.

**Acceptance Criteria:**
- Столбцы: № | Клиент | Автомобиль | Статус | Сумма | Дата | Действия
- № — короткий ID из `order.id` (первые 6 символов) с `#` префиксом
- Применить единые стили (striped, hover, sticky header)
- Существующие `data-testid` сохраняются

## Data Contracts

### ServiceDoc (из serviceCatalogService.js)
```js
{
  id: string,
  name: string,
  description?: string,
  price: number | null,
  categoryId: string,
  vehicleComponent: 'engine'|'gearbox'|'suspension'|'brakes'|'electrics'|'tires'|'body'|'other',
  archived: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### VehicleDoc (из vehiclesService.js)
```js
{ id, make, model, year, licensePlate, vin, clientId, createdAt }
```

### OrderDoc (из ordersService.js)
```js
{ id, clientId, vehicleId, vehicleComponent, date, totalAmount, status, createdAt }
```

## Existing data-testid (обязательно сохранить)

### Vehicles
- `vehicles-table`, `vehicles-skeleton`, `vehicles-empty`
- `vehicle-row-{id}`, `vehicle-cell-make-{id}`, `vehicle-cell-model-{id}`, `vehicle-cell-year-{id}`
- `vehicle-cell-plate-{id}`, `vehicle-cell-vin-{id}`, `vehicle-cell-client-{id}`
- `btn-edit-vehicle-{id}`

### Orders
- `orders-table-wrapper`, `orders-table`
- `order-row-{id}`, `order-client-{id}`, `order-vehicle-{id}`
- `order-detail-link-{id}`, `order-status-badge-{status}`

### Services (новые)
- `service-table`, `service-table-skeleton`, `service-table-empty`
- `service-row-{id}`, `service-cell-name-{id}`, `service-cell-category-{id}`
- `service-cell-component-{id}`, `service-cell-price-{id}`, `service-cell-status-{id}`
- `service-edit-btn-{id}`, `service-archive-btn-{id}`

## Scope

| Файл | Действие |
|------|---------|
| `src/components/ui/DataTable.jsx` | СОЗДАТЬ (новый) |
| `src/features/services/ServiceTable.jsx` | СОЗДАТЬ (новый) |
| `src/features/vehicles/VehicleTable.jsx` | ОБНОВИТЬ (применить DataTable стили) |
| `src/features/orders/OrderList.jsx` | ОБНОВИТЬ (переименовать в OrderTable, добавить №) |
| `src/pages/dashboard/ServicesPage.jsx` | ОБНОВИТЬ (заменить ServiceList → ServiceTable) |
| `src/pages/dashboard/OrdersPage.jsx` | ОБНОВИТЬ (импорт OrderTable) |
| `src/features/services/ServiceList.jsx` | СОХРАНИТЬ (не удалять — может использоваться в wizard) |
| `src/features/services/ServiceCard.jsx` | СОХРАНИТЬ |

## Out of Scope
- Серверная пагинация
- Сортировка колонок (кликабельные заголовки)
- Экспорт в CSV/Excel
- Inline редактирование ячеек
