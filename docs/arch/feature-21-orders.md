# Architecture: Feature #21 — Заказ-наряд (Work Orders)

_Дата: 2026-05-20 | Автор: architect_

---

## ADR (Architecture Decision Records)

### ADR-21-01: Wizard-состояние через React Hook Form + useState шагов (не URL-шаги)

**Статус:** Accepted

**Контекст:**
7-шаговый мастер создания заказа требует управления состоянием между шагами. Варианты:
- URL-навигация (/orders/new/step-1, /orders/new/step-2, …) — каждый шаг в отдельном маршруте
- React Hook Form + `useState(step)` в контейнерном компоненте — шаги как UI-состояние

**Решение:** Один маршрут `/dashboard/orders/new` (NewOrderPage). Состояние текущего шага хранится в `useState(step)` в `NewOrderPage`. Одна экземпляр `useForm()` создаётся в `NewOrderPage` и пробрасывается в каждый шаговый компонент через props (`control`, `register`, `watch`, `setValue`). При переходе между шагами данные не теряются, так как форма живёт в родительском компоненте.

**Обоснование:**
- Нет необходимости в закладках/шаринге URL-шагов — мастер создания не является самостоятельной страницей
- Единый `handleSubmit` в конце — submit происходит только на последнем шаге
- Не нужен router history для «назад» — достаточно `setStep(step - 1)`
- Совместимо с React Hook Form: `useForm()` на родительском уровне, `Controller` или `register` в дочерних через props

**Последствия:** `NewOrderPage` является state-owner. Шаговые компоненты — presentational (принимают control/register через props). При необходимости персистентности в progress (пользователь закрыл вкладку) — добавить sessionStorage-serialize в отдельном PR.

---

### ADR-21-02: services[] хранится как снапшот (name+price копируются в момент создания заказа)

**Статус:** Accepted

**Контекст:**
Заказ ссылается на услуги из каталога (`services/{id}`). Вариант 1: хранить только `[serviceId]` и join с каталогом при отображении. Вариант 2: хранить снапшот `{ serviceId, name, price }` в момент создания.

**Решение:** Массив `services[]` содержит объекты `{ serviceId: string, name: string, price: number }` — значения копируются из каталога в момент создания заказа.

**Обоснование:**
- Историческая точность: цена услуги может измениться, но в заказе должна остаться та цена, что была на момент создания
- Упрощённые queries: отображение заказа не требует join с коллекцией `services`
- `totalAmount` вычисляется как `sum(services[*].price)` при создании — хранится денормализовано для быстрого отображения в списке

**Последствия:** При изменении цены услуги в каталоге — старые заказы сохраняют старую цену (желаемое поведение). При отображении заказа не нужен дополнительный запрос к `services`.

---

### ADR-21-03: componentParams как гибкий объект, не субколлекции по типу узла

**Статус:** Accepted

**Контекст:**
Каждый тип узла автомобиля (`engine`, `gearbox`, `suspension`, …) имеет разные параметры. Варианты:
- Отдельные субколлекции `orders/{id}/engineParams`, `orders/{id}/gearboxParams`, …
- Единое поле `componentParams: object` с разной формой в зависимости от `vehicleComponent`
- Отдельные top-level поля с null для незаполненных (`oilVolume: null` если не engine)

**Решение:** Единое поле `componentParams: object` в документе заказа. Форма объекта зависит от `vehicleComponent`.

**Обоснование:**
- Субколлекции увеличивают количество reads (N+1 для каждого типа) и усложняют Rules
- Firestore не поддерживает schema validation — документ с разной формой `componentParams` одинаково корректен
- Единый документ заказа (< 1 MB) — нет смысла в субколлекции для 3–8 полей параметров
- Степ-4 мастера динамически рендерит форму по `vehicleComponent` — `componentParams` как единый объект удобнее передавать через `setValue('componentParams', {...})`

**Последствия:** Код валидации параметров зависит от `vehicleComponent` — реализован в `WizardStep4Params.jsx` через условный рендер. Firestore Rules не валидируют структуру `componentParams` — это делает UI.

---

### ADR-21-04: Клиент-сайд сортировка (без orderBy в Firestore)

**Статус:** Accepted

**Контекст:**
Единообразие с паттерном всех остальных сервисов проекта (ADR-19-01, ADR-20-03).

**Решение:** Сортировка заказов по полю `date` (строка ISO YYYY-MM-DD) выполняется на клиенте в `getOrders()` — лексикографическое сравнение строк даёт правильный порядок для ISO-дат. Нет `orderBy` в Firestore-запросах.

**Обоснование:**
- Избегаем составных индексов при фильтрации по `status` + `orderBy date`
- MVP-объём заказов (< 5 000) допускает полную загрузку
- Единообразие с остальными сервисами

**Последствия:** При фильтрации по статусу — фильтрация выполняется клиент-сайд после загрузки всех заказов. При росте > 10 000 документов — переход на пагинацию с серверным `orderBy`.

---

## Модель данных

### Firestore коллекция: `orders/{orderId}`

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `clientId` | string | да | Ссылка на `clients/{id}` |
| `vehicleId` | string | да | Ссылка на `vehicles/{id}` |
| `vehicleComponent` | string | да | `'engine'|'gearbox'|'suspension'|'brakes'|'electrics'|'tires'|'body'|'other'` |
| `componentParams` | object | да | Параметры узла (форма зависит от vehicleComponent, см. ниже) |
| `services` | array | да | `[{ serviceId, name, price }]` — снапшот услуг на момент создания (ADR-21-02) |
| `totalAmount` | number | да | Сумма цен всех услуг в ₼ |
| `date` | string | да | Дата заказа ISO YYYY-MM-DD |
| `createdBy` | string | да | UID пользователя, создавшего заказ |
| `status` | string | да | `'draft'|'in_progress'|'completed'` |
| `completedAt` | Timestamp\|null | да | Timestamp завершения или null |
| `createdAt` | Timestamp | да | `serverTimestamp()` при создании |

### Формы componentParams по типу узла

```
engine:     { oilVolume: string, oilType: string, saeFull: string, mileage: string }
gearbox:    { transmissionType: 'manual'|'auto'|'cvt', oilVolume: string, oilBrand: string }
suspension: { defects: string, mileage: string, shockType: string }
brakes:     { padType: string, discDiameter: string, axle: 'front'|'rear'|'all' }
electrics:  { description: string, errorCode: string }
tires:      { tireSize: string, tireType: 'summer'|'winter'|'allseason' }
body:       { damages: string, description: string }
other:      { notes: string }
```

---

## Firestore Security Rules

```javascript
// ─── orders ────────────────────────────────────────────────────────────────────
// Feature #21: admin+manager = полный CRUD; mechanic = read all + update status only;
// client = нет веб-доступа (только Android).

match /orders/{orderId} {
  allow read: if isAdmin() || isManager() || isMechanic();
  allow create: if isAdmin() || isManager();
  allow update: if isAdmin() || isManager() ||
    (isMechanic() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'completedAt']));
  allow delete: if false;
}
```

**RBAC матрица:**

| Роль | read | create | update | delete |
|------|------|--------|--------|--------|
| admin | да | да | да (все поля) | нет |
| manager | да | да | да (все поля) | нет |
| mechanic | да | нет | да (только status + completedAt) | нет |
| client | нет (Android only) | нет | нет | нет |
| аноним | нет | нет | нет | нет |

---

## Service Layer Interface

Файл: `src/services/ordersService.js`

```
getOrders()                             → Promise<OrderDoc[]>
  — все заказы, клиент-сайд сортировка по date desc

getOrdersByMechanic(uid)               → Promise<OrderDoc[]>
  — заглушка: загружает все заказы, фильтрует клиент-сайд по createdBy == uid
  — в MVP механик видит всё; при необходимости добавить поле mechanicId

getOrder(id)                            → Promise<OrderDoc>
  — одиночный getDoc

createOrder(data)                       → Promise<{ id: string }>
  — addDoc с serverTimestamp() + completedAt: null

updateOrderStatus(id, status, uid)      → Promise<void>
  — updateDoc: status + completedAt (если status === 'completed': serverTimestamp(), иначе null)
```

Типы:

```javascript
/**
 * @typedef {Object} OrderServiceItem
 * @property {string} serviceId
 * @property {string} name
 * @property {number} price
 */

/**
 * @typedef {Object} OrderDoc
 * @property {string} id
 * @property {string} clientId
 * @property {string} vehicleId
 * @property {string} vehicleComponent
 * @property {Object} componentParams
 * @property {OrderServiceItem[]} services
 * @property {number} totalAmount
 * @property {string} date
 * @property {string} createdBy
 * @property {'draft'|'in_progress'|'completed'} status
 * @property {import('firebase/firestore').Timestamp|null} completedAt
 * @property {import('firebase/firestore').Timestamp} createdAt
 */
```

---

## Component Architecture

```
/dashboard/orders       ←→  OrdersPage          (pages/dashboard/OrdersPage.jsx)
    │
    ├── useOrders()                   (hooks/useOrders.js)
    ├── useUpdateOrderStatus()         (hooks/useOrders.js)
    │
    └── OrderList.jsx                 (features/orders/OrderList.jsx)
            └── OrderRow.jsx          (features/orders/OrderRow.jsx)
                    └── OrderStatusBadge.jsx (features/orders/OrderStatusBadge.jsx)

/dashboard/orders/new   ←→  NewOrderPage        (pages/dashboard/NewOrderPage.jsx)
    │   (step: 1–7, useState в NewOrderPage; useForm() здесь)
    │
    ├── WizardStep1Client.jsx         (features/orders/wizard/WizardStep1Client.jsx)
    │       └── useClients()
    │
    ├── WizardStep2Vehicle.jsx        (features/orders/wizard/WizardStep2Vehicle.jsx)
    │       └── useVehiclesByClient(clientId)
    │
    ├── WizardStep3Component.jsx      (features/orders/wizard/WizardStep3Component.jsx)
    │       └── radio/select из VEHICLE_COMPONENTS константы
    │
    ├── WizardStep4Params.jsx         (features/orders/wizard/WizardStep4Params.jsx)
    │       └── динамические поля по vehicleComponent
    │
    ├── WizardStep5Services.jsx       (features/orders/wizard/WizardStep5Services.jsx)
    │       └── useServices() — чекбоксы, автосчёт totalAmount
    │
    ├── WizardStep6Summary.jsx        (features/orders/wizard/WizardStep6Summary.jsx)
    │       └── date picker + итоговая сумма
    │
    └── WizardStep7Preview.jsx        (features/orders/wizard/WizardStep7Preview.jsx)
            └── превью перед сохранением → useCreateOrder()

/dashboard/orders/:id   ←→  OrderDetailPage     (pages/dashboard/OrderDetailPage.jsx)
    │
    ├── useOrder(id)                  (hooks/useOrders.js)
    └── useUpdateOrderStatus()         (hooks/useOrders.js)
```

---

## State Flow — 7-шаговый мастер

```
NewOrderPage
  ├── step: number (useState, 1–7)
  ├── useForm() — ОДИН экземпляр для всего wizard
  │     ├── clientId: string
  │     ├── vehicleId: string
  │     ├── vehicleComponent: string
  │     ├── componentParams: object
  │     ├── services: OrderServiceItem[]
  │     ├── totalAmount: number
  │     └── date: string (ISO)
  │
  ├── Шаг 1 (WizardStep1Client)
  │     └── select клиента → register('clientId')
  │
  ├── Шаг 2 (WizardStep2Vehicle)
  │     └── watch('clientId') → useVehiclesByClient → select авто → register('vehicleId')
  │
  ├── Шаг 3 (WizardStep3Component)
  │     └── radio/select узла → register('vehicleComponent')
  │
  ├── Шаг 4 (WizardStep4Params)
  │     └── watch('vehicleComponent') → динамические поля → register('componentParams.*')
  │
  ├── Шаг 5 (WizardStep5Services)
  │     └── useServices() → чекбоксы → setValue('services', [...])
  │                                  → setValue('totalAmount', sum)
  │
  ├── Шаг 6 (WizardStep6Summary)
  │     └── date input → register('date')
  │         watch('totalAmount') → display + optional adjustment
  │
  └── Шаг 7 (WizardStep7Preview)
        └── watch(all) → preview таблица
            onSubmit → useCreateOrder().mutateAsync(data) → navigate('/dashboard/orders')
```

---

## Security Considerations

1. Firestore Rules — основной барьер; UI-защита через RoleGuard является дополнительным слоем.
2. `createdBy` устанавливается из `auth.currentUser.uid` в сервисе/хуке, не из пользовательского ввода.
3. `services[]` — снапшот данных из каталога на момент создания; не может быть изменён после создания через стандартный UI.
4. Mechanic может изменить только `status` и `completedAt` — Firestore Rules используют `affectedKeys().hasOnly([...])` для жёсткого ограничения.
5. `completedAt` устанавливается через `serverTimestamp()` в `updateOrderStatus`, не принимается от клиента.
6. `totalAmount` вычисляется клиент-сайд как сумма цен выбранных услуг; Firestore Rules не валидируют соответствие.

---

## Files Created / Updated

| Файл | Описание |
|------|----------|
| `docs/arch/feature-21-orders.md` | Этот документ |
| `src/services/ordersService.js` | CRUD + status update |
| `src/hooks/useOrders.js` | useOrders, useOrder, useCreateOrder, useUpdateOrderStatus |
| `src/features/orders/OrderList.jsx` | Таблица заказов |
| `src/features/orders/OrderRow.jsx` | Строка таблицы |
| `src/features/orders/OrderStatusBadge.jsx` | Цветной бейдж статуса |
| `src/features/orders/wizard/WizardStep1Client.jsx` | Шаг 1: выбор клиента |
| `src/features/orders/wizard/WizardStep2Vehicle.jsx` | Шаг 2: выбор авто |
| `src/features/orders/wizard/WizardStep3Component.jsx` | Шаг 3: выбор узла |
| `src/features/orders/wizard/WizardStep4Params.jsx` | Шаг 4: параметры узла |
| `src/features/orders/wizard/WizardStep5Services.jsx` | Шаг 5: услуги + сумма |
| `src/features/orders/wizard/WizardStep6Summary.jsx` | Шаг 6: дата + итог |
| `src/features/orders/wizard/WizardStep7Preview.jsx` | Шаг 7: превью + submit |
| `src/pages/dashboard/OrdersPage.jsx` | Список заказов (замена заглушки) |
| `src/pages/dashboard/NewOrderPage.jsx` | Wizard-контейнер |
| `src/pages/dashboard/OrderDetailPage.jsx` | Детальная страница (заглушка) |
| `firestore.rules` | Обновлено правило /orders с mechanic-ограничением |
| `src/App.jsx` | Добавлены маршруты orders/new и orders/:id |

---

## Out of Scope (MVP)

- Назначение механика на заказ (поле `mechanicId`) — зависит от дизайна #22
- История изменений статуса — отдельная субколлекция `statusHistory`
- PDF-генерация заказ-наряда
- Поиск и расширенная фильтрация заказов (по клиенту, авто, механику)
- Пагинация (актуально при > 10 000 заказов)
- Редактирование созданного заказа (MVP: только смена статуса)
