# Feature #21 — Заказ-наряд: Test Cases

_Создано: 2026-05-21_

---

## TC-21-001: Таблица заказов отображается для admin, manager и mechanic

**Priority:** High
**Type:** Functional
**Related AC:** US-21-1 (#42)

### Preconditions
- Пользователь авторизован с ролью admin (или manager, или mechanic)
- Firestore коллекция `orders` содержит 3 документа с полями clientId, vehicleId, vehicleComponent, date, totalAmount, status

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/orders | Страница загружается без ошибок |
| 2 | Проверить наличие data-testid="orders-table" | Элемент таблицы присутствует в DOM |
| 3 | Проверить заголовки колонок | Видны колонки «Клиент», «Автомобиль», «Узел», «Дата», «Сумма», «Статус» |
| 4 | Подсчитать строки таблицы | В таблице 3 строки (data-testid="order-row-{id}") |
| 5 | Проверить наличие фильтра по статусу | data-testid="status-filter-select" присутствует |

### Expected Result
Таблица заказов отображается со всеми колонками и тремя строками данных. Фильтр по статусу присутствует на странице.

### Test Data
- order-1: { clientId: "client-001", vehicleId: "vehicle-001", vehicleComponent: "engine", date: "2026-05-10", totalAmount: 350, status: "draft" }
- order-2: { clientId: "client-002", vehicleId: "vehicle-002", vehicleComponent: "brakes", date: "2026-05-15", totalAmount: 180, status: "in_progress" }
- order-3: { clientId: "client-003", vehicleId: "vehicle-003", vehicleComponent: "tires", date: "2026-05-20", totalAmount: 120, status: "completed" }

---

## TC-21-002: Пустой список заказов — отображается заглушка «Нет заказов»

**Priority:** Medium
**Type:** Functional / Edge Case
**Related AC:** US-21-1 (#42)

### Preconditions
- Пользователь авторизован с ролью manager
- Firestore коллекция `orders` пуста (нет ни одного документа)

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/orders | Страница загружается без ошибок |
| 2 | Проверить наличие таблицы или заглушки | Таблица либо отсутствует, либо содержит 0 строк данных |
| 3 | Проверить наличие сообщения о пустом состоянии | Отображается текст «Нет заказов» (или аналогичное сообщение) |
| 4 | Убедиться, что нет спиннера или ошибок | Страница стабильна, индикатор загрузки не застывает |

### Expected Result
При отсутствии заказов в Firestore страница показывает пустое состояние без ошибок и зависающего загрузчика.

### Test Data
- Firestore collection `orders` — пуста

---

## TC-21-003: RBAC — mechanic видит таблицу, но не видит кнопку «Создать заказ»

**Priority:** High
**Type:** Security / RBAC
**Related AC:** US-21-1 (#42)

### Preconditions
- Пользователь авторизован с ролью mechanic
- Firestore коллекция `orders` содержит 2 документа

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/orders | Страница загружается, редиректа нет |
| 2 | Проверить наличие data-testid="orders-table" | Таблица присутствует в DOM |
| 3 | Проверить наличие строк заказов | Видны строки (data-testid="order-row-{id}") |
| 4 | Проверить наличие data-testid="create-order-btn" | Кнопка «Создать заказ» отсутствует в DOM |

### Expected Result
Механик видит таблицу заказов, но кнопка создания заказа скрыта. Данные отображаются корректно.

### Test Data
- user: { role: "mechanic", uid: "mech-001" }
- orders: [{ status: "in_progress" }, { status: "completed" }]

---

## TC-21-004: Wizard — шаг 1 требует выбора клиента, переход на шаг 2 заблокирован без него

**Priority:** High
**Type:** Validation
**Related AC:** US-21-2 (#43)

### Preconditions
- Пользователь авторизован с ролью manager
- Страница /dashboard/orders открыта
- В Firestore коллекции `clients` есть 2 клиента

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Нажать кнопку data-testid="create-order-btn" | Открывается wizard, отображается шаг 1 (data-testid="wizard-step-1") |
| 2 | Убедиться, что поле выбора клиента пустое (data-testid="client-select") | Клиент не выбран |
| 3 | Нажать кнопку «Далее» (data-testid="wizard-next-btn") без выбора клиента | Переход не происходит |
| 4 | Убедиться, что шаг 1 всё ещё отображается | data-testid="wizard-step-1" присутствует |
| 5 | Проверить сообщение об ошибке | Отображается ошибка валидации рядом с полем client-select |
| 6 | Выбрать клиента из списка (data-testid="client-select") | Клиент "Іваненко Іван" выбран |
| 7 | Нажать «Далее» | Wizard переходит к шагу 2 (data-testid="wizard-step-2") |

### Expected Result
React Hook Form блокирует переход на следующий шаг пока поле clientId пустое. После выбора клиента переход разрешён.

### Test Data
- clients: [{ id: "client-001", fullName: "Іваненко Іван" }, { id: "client-002", fullName: "Петренко Олег" }]

---

## TC-21-005: Wizard — прохождение всех 7 шагов создаёт заказ в Firestore и редиректит на страницу заказа

**Priority:** High
**Type:** Functional (Happy Path)
**Related AC:** US-21-2 (#43)

### Preconditions
- Пользователь авторизован с ролью manager
- В Firestore: клиент "client-001", автомобиль "vehicle-001" (clientId=client-001), услуги из каталога
- Страница /dashboard/orders/new открыта

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Шаг 1: выбрать клиента (data-testid="client-select") | Клиент "Іваненко Іван" выбран |
| 2 | Нажать «Далее» | Переход к шагу 2 (data-testid="wizard-step-2") |
| 3 | Шаг 2: выбрать автомобиль клиента (data-testid="vehicle-select") | Авто "Toyota Camry 2020" выбрано |
| 4 | Нажать «Далее» | Переход к шагу 3 (data-testid="wizard-step-3") |
| 5 | Шаг 3: выбрать узел «Двигатель» (data-testid="component-select") | Узел "engine" выбран |
| 6 | Нажать «Далее» | Переход к шагу 4 (data-testid="wizard-step-4") |
| 7 | Шаг 4: заполнить параметры двигателя (volume="2.0", oilType="синтетика", saeSpec="5W-40", mileage=45000) | Значения введены |
| 8 | Нажать «Далее» | Переход к шагу 5 (data-testid="wizard-step-5") |
| 9 | Шаг 5: выбрать 2 услуги (data-testid="services-checkbox-{id}") | Услуги отмечены, totalAmount обновился |
| 10 | Нажать «Далее» | Переход к шагу 6 (data-testid="wizard-step-6") |
| 11 | Шаг 6: убедиться, что дата = сегодня и totalAmount отображается | Дата и сумма заполнены |
| 12 | Нажать «Далее» | Переход к шагу 7 (data-testid="wizard-step-7") |
| 13 | Шаг 7: проверить превью — все данные отображены | Клиент, авто, узел, параметры, услуги, сумма видны |
| 14 | Нажать «Сохранить» (data-testid="save-order-btn") | Кнопка блокируется (loading state), затем происходит редирект |
| 15 | Проверить URL после редиректа | URL = /dashboard/orders/{orderId} |

### Expected Result
Документ создаётся в Firestore `orders/{id}` со статусом 'draft', полями clientId, vehicleId, vehicleComponent, componentParams, services (снапшот), totalAmount, date, createdBy. После сохранения пользователь оказывается на странице деталей заказа.

### Test Data
- client: { id: "client-001", fullName: "Іваненко Іван" }
- vehicle: { id: "vehicle-001", clientId: "client-001", make: "Toyota", model: "Camry", year: 2020 }
- services: [{ id: "svc-001", name: "Замена масла", price: 200 }, { id: "svc-002", name: "Замена фильтра", price: 150 }]

---

## TC-21-006: Wizard — manager может создать заказ (RBAC: кнопка видна и доступна)

**Priority:** High
**Type:** Security / RBAC
**Related AC:** US-21-2 (#43)

### Preconditions
- Пользователь авторизован с ролью manager
- Страница /dashboard/orders открыта

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Проверить наличие data-testid="create-order-btn" | Кнопка «Создать заказ» присутствует в DOM |
| 2 | Нажать кнопку «Создать заказ» | Происходит переход на /dashboard/orders/new |
| 3 | Убедиться, что wizard отображается | data-testid="wizard-step-1" присутствует |

### Expected Result
Manager имеет право создавать заказы наравне с admin. Кнопка видна, переход в wizard возможен.

### Test Data
- user: { role: "manager", uid: "mgr-001" }

---

## TC-21-007: Страница деталей заказа отображает все поля: клиент, авто, узел, параметры, услуги, сумма, статус

**Priority:** High
**Type:** Functional (Happy Path)
**Related AC:** US-21-3 (#44)

### Preconditions
- Пользователь авторизован с ролью admin
- Firestore содержит заказ { id: "order-001", clientId: "client-001", vehicleId: "vehicle-001", vehicleComponent: "engine", componentParams: { volume: "2.0", oilType: "синтетика" }, services: [{ serviceId: "svc-001", name: "Замена масла", price: 200 }], totalAmount: 200, date: "2026-05-10", status: "in_progress" }

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/orders/order-001 | Страница загружается без ошибок (skeleton виден, затем исчезает) |
| 2 | Проверить секцию «Клиент» (data-testid="order-detail-client") | Отображается имя клиента |
| 3 | Проверить секцию «Автомобиль» (data-testid="order-detail-vehicle") | Отображается марка, модель, год |
| 4 | Проверить секцию «Узел» (data-testid="order-detail-component") | Отображается "Двигатель" |
| 5 | Проверить технические параметры | Параметры componentParams отображаются (volume, oilType) |
| 6 | Проверить секцию «Работы» (data-testid="order-detail-services") | Видна строка "Замена масла — 200 ₼" |
| 7 | Проверить секцию «Итоговая сумма» (data-testid="order-detail-total") | Отображается "200 ₼" |
| 8 | Проверить секцию «Статус» (data-testid="order-detail-status") | Отображается badge "В работе" жёлтого цвета |

### Expected Result
Все секции страницы деталей заполнены данными из Firestore. Skeleton loader исчезает после загрузки.

### Test Data
- order: { id: "order-001", clientId: "client-001", vehicleId: "vehicle-001", vehicleComponent: "engine", componentParams: { volume: "2.0", oilType: "синтетика", saeSpec: "5W-40", mileage: 45000 }, services: [{ serviceId: "svc-001", name: "Замена масла", price: 200 }], totalAmount: 200, date: "2026-05-10", status: "in_progress" }
- client: { id: "client-001", fullName: "Іваненко Іван" }
- vehicle: { id: "vehicle-001", make: "Toyota", model: "Camry", year: 2020 }

---

## TC-21-008: Статус-badge отображает правильный цвет и текст для каждого из трёх статусов

**Priority:** High
**Type:** Functional / UI
**Related AC:** US-21-3 (#44)

### Preconditions
- Пользователь авторизован с ролью admin
- Три заказа с разными статусами: order-draft (status: "draft"), order-progress (status: "in_progress"), order-done (status: "completed")

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/orders/order-draft | Страница загружается |
| 2 | Проверить data-testid="order-status-badge" | Badge отображает «Черновик», цвет — серый |
| 3 | Перейти на /dashboard/orders/order-progress | Страница загружается |
| 4 | Проверить data-testid="order-status-badge" | Badge отображает «В работе», цвет — жёлтый |
| 5 | Перейти на /dashboard/orders/order-done | Страница загружается |
| 6 | Проверить data-testid="order-status-badge" | Badge отображает «Выполнен», цвет — зелёный |

### Expected Result
OrderStatusBadge корректно отображает все три статуса с правильными метками и цветами (draft=серый, in_progress=жёлтый, completed=зелёный).

### Test Data
- order-draft: { id: "order-draft", status: "draft" }
- order-progress: { id: "order-progress", status: "in_progress" }
- order-done: { id: "order-done", status: "completed" }

---

## TC-21-009: RBAC — mechanic может открыть страницу деталей заказа

**Priority:** High
**Type:** Security / RBAC
**Related AC:** US-21-3 (#44)

### Preconditions
- Пользователь авторизован с ролью mechanic
- Firestore содержит заказ { id: "order-002", status: "in_progress", clientId: "client-001", vehicleId: "vehicle-001" }

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/orders | Таблица заказов отображается |
| 2 | Кликнуть на строку заказа (data-testid="order-row-order-002") | Происходит переход на /dashboard/orders/order-002 |
| 3 | Убедиться, что страница загрузилась | data-testid="order-detail-client" присутствует |
| 4 | Проверить, что данные отображаются | Секции клиент, авто, статус видны |
| 5 | Убедиться, что кнопка data-testid="mark-completed-btn" присутствует | Кнопка для смены статуса доступна механику |

### Expected Result
Механик имеет доступ к странице деталей заказа. Все данные отображаются. Кнопка «Отметить выполненным» видна.

### Test Data
- user: { role: "mechanic", uid: "mech-001" }
- order: { id: "order-002", status: "in_progress", clientId: "client-001", vehicleId: "vehicle-001" }

---

## TC-21-010: Механик нажимает «Отметить выполненным» — статус меняется на completed, completedAt записывается

**Priority:** High
**Type:** Functional (Happy Path)
**Related AC:** US-21-4 (#45)

### Preconditions
- Пользователь авторизован с ролью mechanic
- Firestore содержит заказ { id: "order-003", status: "in_progress", completedAt: null }
- Страница /dashboard/orders/order-003 открыта

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Убедиться, что badge отображает «В работе» (data-testid="order-status-badge") | Статус "in_progress" виден |
| 2 | Нажать кнопку data-testid="mark-completed-btn" | Открывается диалог подтверждения (data-testid="confirm-complete-dialog") |
| 3 | Нажать «Подтвердить» в диалоге | Диалог закрывается |
| 4 | Дождаться обновления страницы | Страница обновляется без полного reload |
| 5 | Проверить data-testid="order-status-badge" | Badge отображает «Выполнен», цвет — зелёный |
| 6 | Проверить данные в Firestore | Документ `orders/order-003`: status="completed", completedAt — не null (Timestamp) |

### Expected Result
После подтверждения: поле `status` обновлено до 'completed', `completedAt` = Timestamp.now(). Страница отражает новый статус без перезагрузки (TanStack Query invalidation).

### Test Data
- user: { role: "mechanic", uid: "mech-001" }
- order: { id: "order-003", status: "in_progress", completedAt: null }

---

## TC-21-011: После смены статуса на completed кнопка «Отметить выполненным» становится неактивной

**Priority:** High
**Type:** Functional / Edge Case
**Related AC:** US-21-4 (#45)

### Preconditions
- Пользователь авторизован с ролью mechanic
- Firestore содержит заказ { id: "order-004", status: "completed", completedAt: <Timestamp> }
- Страница /dashboard/orders/order-004 открыта

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Проверить data-testid="order-status-badge" | Badge отображает «Выполнен» |
| 2 | Найти кнопку data-testid="mark-completed-btn" | Кнопка присутствует в DOM |
| 3 | Проверить атрибут кнопки | Кнопка имеет атрибут disabled (заблокирована) |
| 4 | Попытаться нажать заблокированную кнопку | Диалог не открывается, Firestore не вызывается |

### Expected Result
Для заказа со статусом 'completed' кнопка «Отметить выполненным» отображается, но недоступна для нажатия. Повторная установка статуса невозможна через UI.

### Test Data
- user: { role: "mechanic", uid: "mech-001" }
- order: { id: "order-004", status: "completed", completedAt: "2026-05-20T10:00:00Z" }

---

## TC-21-012: Admin может сменить статус заказа

**Priority:** High
**Type:** Security / RBAC
**Related AC:** US-21-4 (#45)

### Preconditions
- Пользователь авторизован с ролью admin
- Firestore содержит заказ { id: "order-005", status: "in_progress", completedAt: null }
- Страница /dashboard/orders/order-005 открыта

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Убедиться, что badge отображает «В работе» | Статус "in_progress" виден |
| 2 | Найти кнопку data-testid="mark-completed-btn" | Кнопка присутствует и активна |
| 3 | Нажать кнопку | Открывается диалог подтверждения (data-testid="confirm-complete-dialog") |
| 4 | Подтвердить смену статуса | Диалог закрывается, страница обновляется |
| 5 | Проверить data-testid="order-status-badge" | Badge отображает «Выполнен» |

### Expected Result
Admin имеет право менять статус заказа на 'completed' наравне с mechanic. Кнопка активна, диалог появляется, статус обновляется.

### Test Data
- user: { role: "admin", uid: "admin-001" }
- order: { id: "order-005", status: "in_progress", completedAt: null }

---

## TC-21-013: Фильтр по статусу — выбор «Выполнен» показывает только completed заказы

**Priority:** High
**Type:** Functional
**Related AC:** US-21-1 (#42)

### Preconditions
- Пользователь авторизован с ролью manager
- Firestore коллекция `orders` содержит 5 документов: 2 draft, 2 in_progress, 1 completed
- Страница /dashboard/orders загружена, отображаются все 5 строк

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Убедиться, что все 5 строк видны (без фильтра) | Таблица показывает 5 строк |
| 2 | Открыть фильтр по статусу (data-testid="status-filter-select") | Выпадающий список с вариантами: «Все», «Черновик», «В работе», «Выполнен» |
| 3 | Выбрать «Выполнен» | Таблица обновляется |
| 4 | Подсчитать строки | Отображается 1 строка (только completed заказ) |
| 5 | Убедиться, что draft и in_progress заказы скрыты | Строки с другим статусом не отображаются |
| 6 | Убедиться, что сетевой запрос не выполнялся | В Network нет новых вызовов к Firestore (фильтрация client-side) |
| 7 | Выбрать «Все» в фильтре | Таблица снова показывает все 5 строк |

### Expected Result
Фильтрация по статусу выполняется клиентски без обращения к Firestore. Выбор «Выполнен» оставляет только заказы со status='completed'. Сброс фильтра на «Все» восстанавливает полный список.

### Test Data
- orders: [
    { id: "o1", status: "draft" },
    { id: "o2", status: "draft" },
    { id: "o3", status: "in_progress" },
    { id: "o4", status: "in_progress" },
    { id: "o5", status: "completed" }
  ]
