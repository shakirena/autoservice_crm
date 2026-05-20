# Architecture: Feature #20 — База автомобилей (Vehicles)

_Дата: 2026-05-20 | Автор: architect_

---

## ADR (Architecture Decision Records)

### ADR-20-01: Верхнеуровневая коллекция, не субколлекция клиента

**Статус:** Accepted

**Контекст:**
Автомобиль принадлежит клиенту (поле `clientId`). Можно хранить данные как субколлекцию `clients/{clientId}/vehicles/{vehicleId}` или как top-level коллекцию `vehicles/{vehicleId}`.

**Решение:** Top-level коллекция `vehicles/{vehicleId}` со ссылкой `clientId` на клиента.

**Обоснование:**
- Feature #21 (заказ-наряд) будет хранить `vehicleId` в документе заказа. Запросы типа «все заказы на автомобиль X» — прямой `where('vehicleId', '==', id)` по top-level коллекции.
- Субколлекция потребует Collection Group queries (`collectionGroup('vehicles')`) с составными индексами, которые нужно создавать вручную.
- Top-level коллекция позволяет читать автомобиль напрямую по ID без необходимости знать `clientId`.

**Последствия:** Поле `clientId` обязательно и является единственной связью «автомобиль → клиент». При необходимости вывода списка машин клиента — фильтрация client-side или `where('clientId', '==', id)` (без orderBy, один индекс).

---

### ADR-20-02: Нет физического удаления автомобилей

**Статус:** Accepted

**Контекст:**
Автомобиль будет привязываться к заказам (#21). Физическое удаление приведёт к осиротевшим ссылкам `vehicleId` в коллекции `orders`.

**Решение:** Hard delete не реализован. `vehiclesService.js` предоставляет только `getVehicles`, `getVehiclesByClient`, `createVehicle`, `updateVehicle`. При необходимости деактивации — добавить поле `archived: boolean` и функцию `archiveVehicle` в отдельном PR (аналогично `archiveService` в #18).

**Последствия:** UI не предоставляет кнопки удаления на MVP. Осиротевшие заказы при необходимости обрабатываются через отдельную задачу миграции.

---

### ADR-20-03: Клиент-сайд сортировка (без orderBy в Firestore)

**Статус:** Accepted

**Контекст:**
Для отображения автомобилей по дате создания (новые первые) можно использовать Firestore `orderBy('createdAt', 'desc')` или сортировать после загрузки.

**Решение:** Сортировка выполняется на клиенте в `getVehicles()` и `getVehiclesByClient()` — `array.sort()` по `createdAt.toMillis()`.

**Обоснование:**
- Запросы без `orderBy` не требуют составных индексов в Firestore — каждый дополнительный `where` вместе с `orderBy` нуждается в отдельном индексе.
- MVP-объём автомобилей (< 5 000 записей) допускает полную загрузку и сортировку в памяти.
- Единообразие с паттерном `clientsService.js` (ADR-19-01) и остальными сервисами проекта.

**Последствия:** При росте коллекции > 10 000 документов перейти на пагинацию (startAfter) + серверный `orderBy` с созданием индекса.

---

## Модель данных

### Firestore коллекция: `vehicles/{vehicleId}`

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `clientId` | string | да | ID клиента-владельца (`clients/{clientId}`) |
| `make` | string | да | Марка автомобиля (Toyota, BMW, …) |
| `model` | string | да | Модель (Camry, X5, …) |
| `year` | number | да | Год выпуска (1900 – текущий год) |
| `licensePlate` | string | да | Государственный номер |
| `vin` | string | нет | VIN-номер (17 символов, необязательный) |
| `createdAt` | Timestamp | да | `serverTimestamp()` при создании |

Индексы: не требуются (сортировка по `createdAt desc` выполняется на клиенте).

---

## Firestore Security Rules

```javascript
// ─── vehicles ──────────────────────────────────────────────────────────────────
// Feature #20: admin+manager = CRUD; mechanic, client = нет доступа.
// Автомобили — внутренние операционные данные, не раскрываются клиентам.

match /vehicles/{vehicleId} {
  allow read: if isAdmin() || isManager();
  allow write: if isAdmin() || isManager();
}
```

**RBAC матрица:**

| Роль | read (list + get) | write (create + update + delete) |
|------|-------------------|---------------------------------|
| admin | да | да |
| manager | да | да |
| mechanic | нет | нет |
| client | нет | нет |
| аноним | нет | нет |

Примечание: mechanic не имеет доступа к автомобилям — в отличие от клиентов (#19, где mechanic может читать). Это намеренно: автомобили — операционный CRM-ресурс, механик работает с заказами (#21), которые содержат `vehicleId`. При необходимости разрешить механику read — изменить правило на `allow read: if isAdmin() || isManager() || isMechanic();`.

---

## Service Layer Interface

Файл: `src/services/vehiclesService.js`

```
getVehicles()                           → Promise<VehicleDoc[]>
getVehiclesByClient(clientId)           → Promise<VehicleDoc[]>
createVehicle(data)                     → Promise<{ id: string }>
updateVehicle(id, data)                 → Promise<void>
```

Нет `deleteVehicle` — см. ADR-20-02.

Типы:

```javascript
/**
 * @typedef {Object} VehicleDoc
 * @property {string} id
 * @property {string} clientId
 * @property {string} make
 * @property {string} model
 * @property {number} year
 * @property {string} licensePlate
 * @property {string} [vin]
 * @property {import('firebase/firestore').Timestamp} createdAt
 */
```

---

## Component Architecture

```
/dashboard/vehicles  ←→  VehiclesPage (pages/dashboard/VehiclesPage.jsx)
    │
    ├── useVehicles()              (hooks/useVehicles.js)
    ├── useClients()               (hooks/useClients.js)   ← для select в форме
    ├── useCreateVehicle()         (hooks/useVehicles.js)
    ├── useUpdateVehicle()         (hooks/useVehicles.js)
    │
    ├── VehicleTable.jsx           (features/vehicles/VehicleTable.jsx)
    │       └── VehicleRow.jsx     (features/vehicles/VehicleRow.jsx)
    │               ├── кнопка «Редактировать» — только admin/manager
    │               └── read-only для остальных
    │
    └── VehicleForm.jsx            (features/vehicles/VehicleForm.jsx)
            ├── режим create (без initialData)
            ├── режим edit   (initialData = VehicleDoc)
            └── select клиента из useClients()
```

### Компонент VehiclesPage

- Хранит состояние поиска (`search`) в `useState` — фильтрует по make/model/licensePlate
- Фильтрует список через `useMemo` (клиент-сайд, ADR-20-03)
- Управляет состоянием формы: `showCreate`, `editTarget` (VehicleDoc | null)
- Получает роль из `useAuth()` — `const { role } = useAuth()`
- Маршрут доступен только admin и manager (route guard через роль в навигации)

### Компонент VehicleTable

- Принимает `vehicles[]`, `role`, `onEdit`, `isLoading`, `search`, `onAddFirst`
- Показывает скелетон при загрузке (7 колонок)
- Колонки: Марка, Модель, Год, Гос.номер, VIN, Клиент, Действия
- Рендерит `<VehicleRow>` для каждой записи

### Компонент VehicleRow

- Принимает `vehicle`, `role`, `clients[]`, `onEdit`
- Кнопка «Редактировать» — только `admin` / `manager`
- Отображает имя клиента из переданного списка (lookup по `clientId`)

### Компонент VehicleForm

- Управляется через React Hook Form
- `make` — required
- `model` — required
- `year` — required, validate: 1900 ≤ year ≤ currentYear
- `licensePlate` — required
- `vin` — optional
- `clientId` — required, select из `useClients()`
- При `initialData` — режим редактирования, вызывает `updateVehicle`
- При отсутствии `initialData` — режим создания, вызывает `createVehicle`

---

## Security Considerations

1. **Firestore Rules** применяют RBAC на стороне сервера — UI-уровень является дополнительным слоем UX-защиты, а не единственным барьером.
2. **Mechanic не имеет доступа** — ни read, ни write. Если механику потребуется видеть автомобиль по заказу (#21), можно передать данные через денормализацию в документе заказа (`orderDoc.vehicleMake`, `orderDoc.vehicleModel`) вместо разрешения read на коллекцию.
3. **Нет hard delete** (ADR-20-02) — исключает осиротевшие ссылки в заказах.
4. **clientId** — обязательное поле, не передаётся пользователем напрямую как строка: берётся из select-a с реальными данными из Firestore.
5. **VIN** — необязательный, формат не валидируется на MVP (17 символов). Добавить regex-валидацию при необходимости.
6. **year** — число, валидируется на клиенте React Hook Form (1900–currentYear). Firestore Rules не проверяют диапазон — при необходимости добавить `request.resource.data.year is int && request.resource.data.year >= 1900`.

---

## Out of Scope

- История заказов по автомобилю — зависит от Feature #21 (заказ-наряды)
- Страница автомобиля (детали + заказы) — зависит от #21
- Мягкое удаление (archived) — отложено до появления требования
- Полнотекстовый поиск VIN/госномер через Algolia — MVP не требует

---

## Notes for Developer

- Маршрут `/dashboard/vehicles` нужно зарегистрировать в роутере (`src/App.jsx` или эквивалентный файл роутера).
- `useClients()` уже реализован в `src/hooks/useClients.js` — переиспользуется в `VehicleForm` для populate select.
- Сортировка: `getVehicles()` возвращает записи, отсортированные по `createdAt desc` (клиент-сайд sort, ADR-20-03).
- При реализации #21 (заказы): поле `vehicleId` в заказе ссылается на `vehicles/{vehicleId}`.
