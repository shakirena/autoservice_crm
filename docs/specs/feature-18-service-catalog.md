# Feature 18: Справочник услуг (категории + услуги с ценами)

_Создан: 2026-05-20_

## Overview

Справочник услуг — центральный реестр автосервисных операций. Реализует двухуровневую структуру: категории услуг (ТО, ремонт двигателя и т.д.) и сами услуги с ценой и привязкой к узлу автомобиля. Используется в заказ-нарядах (#21) как источник позиций.

**Роли:** admin (полный CRUD), manager (только просмотр).

**Зависит от:** #12 (DashboardLayout, RoleGuard, маршрутизация).  
**Используется в:** #21 (заказ-наряд — выбор услуг из справочника).

---

## Functional Requirements

| ID | Требование |
|----|-----------|
| FR-1 | Страница `/dashboard/services` отображает список категорий и список услуг. Доступна ролям admin и manager. |
| FR-2 | Категория содержит поля: name, description, vehicleComponent. |
| FR-3 | Услуга содержит поля: name, description, price (число >= 0), categoryId, vehicleComponent, archived (boolean). |
| FR-4 | vehicleComponent принимает одно из значений: engine, gearbox, suspension, brakes, electrics, tires, body, other. |
| FR-5 | Admin может создавать, редактировать и удалять категории услуг. Удаление запрещено если к категории привязаны услуги. |
| FR-6 | Admin может создавать, редактировать и удалять услуги. |
| FR-7 | Admin может архивировать и разархивировать услугу (поле `archived`). Архивная услуга скрыта из активного выбора, но сохраняется в Firestore. |
| FR-8 | Список услуг фильтруется по vehicleComponent (локальная фильтрация, без дополнительных запросов к Firestore). |
| FR-9 | Архивные услуги скрыты по умолчанию; отображаются при включении toggle «Показать архивные». |
| FR-10 | Все формы управляются через React Hook Form 7 с клиентской валидацией. |

---

## Non-Functional Requirements

| ID | Требование |
|----|-----------|
| NFR-1 | Страница загружается менее чем за 2 с при до 500 услуг в Firestore. |
| NFR-2 | Skeleton-лоудер отображается во время ожидания данных (не блокирующий спиннер). |
| NFR-3 | После создания/обновления/удаления данные обновляются без перезагрузки страницы (TanStack Query invalidateQueries). |
| NFR-4 | Firestore Security Rules: запись только для role=='admin', чтение для role=='admin' или role=='manager'. |
| NFR-5 | Компоненты не импортируют Firestore SDK напрямую — только через сервисные функции. |
| NFR-6 | Фильтрация по vehicleComponent выполняется на клиенте, не инициирует повторные запросы к Firestore. |
| NFR-7 | E2E-селекторы используют только атрибуты `data-testid='*'`. |

---

## Firestore Schema

### `serviceCategories/{id}`
```
{
  name:             string (required)
  description:      string (optional)
  vehicleComponent: 'engine'|'gearbox'|'suspension'|'brakes'|'electrics'|'tires'|'body'|'other'
  createdAt:        Timestamp
  updatedAt:        Timestamp
}
```

### `services/{id}`
```
{
  name:             string (required)
  description:      string (optional)
  price:            number >= 0 (required)
  categoryId:       string (ref → serviceCategories/{id}, required)
  vehicleComponent: 'engine'|'gearbox'|'suspension'|'brakes'|'electrics'|'tires'|'body'|'other'
  archived:         boolean (default: false)
  createdAt:        Timestamp
  updatedAt:        Timestamp
}
```

---

## User Stories

| Story | Issue | Title | Priority | Size | Role |
|-------|-------|-------|----------|------|------|
| US-18-1 | #28 | Список категорий и услуг | high | m | manager + admin |
| US-18-2 | #29 | CRUD категорий услуг | high | m | admin |
| US-18-3 | #30 | CRUD услуг с ценой и узлом | high | m | admin |
| US-18-4 | #31 | Архивирование услуги | high | s | admin |
| US-18-5 | #32 | Фильтрация по узлу автомобиля | high | s | manager + admin |

---

## Acceptance Criteria

### US-18-1 — Список категорий и услуг (#28)
**Given** авторизованный пользователь с ролью manager или admin находится в дашборде  
**When** он переходит по маршруту /dashboard/services  
**Then** отображается страница с двумя панелями: список категорий (название, описание, узел) и список услуг (название, цена, категория, узел, статус архива)

### US-18-2 — CRUD категорий услуг (#29)
**Given** администратор находится на странице /dashboard/services  
**When** он создаёт новую категорию (вводит название, описание, выбирает vehicleComponent) и сохраняет форму  
**Then** новая категория появляется в списке категорий без перезагрузки страницы

### US-18-3 — CRUD услуг с ценой и узлом (#30)
**Given** администратор находится на странице /dashboard/services и категории уже созданы  
**When** он создаёт новую услугу (вводит название, описание, цену, выбирает категорию и vehicleComponent) и сохраняет форму  
**Then** новая услуга появляется в списке услуг с корректными данными и отображается как активная

### US-18-4 — Архивирование услуги (#31)
**Given** администратор видит список услуг на странице /dashboard/services  
**When** он нажимает кнопку «Архивировать» у активной услуги (или «Восстановить» у архивной)  
**Then** поле archived услуги меняется в Firestore, а услуга визуально помечается как архивная (бейдж «Архив», приглушённый цвет строки)

### US-18-5 — Фильтрация по узлу автомобиля (#32)
**Given** пользователь с ролью manager или admin находится на странице /dashboard/services  
**When** он выбирает значение из фильтра vehicleComponent  
**Then** список услуг немедленно обновляется и показывает только услуги с соответствующим vehicleComponent

---

## Planned Architecture

```
src/
  pages/dashboard/ServicesPage.jsx          # Маршрут /dashboard/services
  features/services/
    CategoriesList.jsx                      # Список категорий
    CategoryForm.jsx                        # Форма создания/редактирования категории
    ServicesList.jsx                        # Список услуг
    ServiceForm.jsx                         # Форма создания/редактирования услуги
    VehicleComponentFilter.jsx              # Фильтр по узлу
  services/
    categoriesService.js                    # Firestore CRUD для serviceCategories
    servicesService.js                      # Firestore CRUD для services
  hooks/
    useCategories.js                        # useQuery + useMutation для категорий
    useServices.js                          # useQuery + useMutation для услуг
```

---

## Out of Scope

- Архивирование категорий (только услуги)
- Импорт/экспорт прайс-листа (CSV, Excel)
- История изменений цен
- Пакетное архивирование
- Фильтрация по цене или названию
- Сохранение состояния фильтра между сессиями
- Привязка услуг к конкретным маркам/моделям автомобилей
- Интеграция с внешними справочниками (нормо-часы и т.д.)

---

## Firestore Security Rules (additions)

```js
// serviceCategories — чтение: admin + manager; запись: только admin
match /serviceCategories/{id} {
  allow read: if request.auth != null
    && request.auth.token.role in ['admin', 'manager'];
  allow write: if request.auth != null
    && request.auth.token.role == 'admin';
}

// services — чтение: admin + manager; запись: только admin
match /services/{id} {
  allow read: if request.auth != null
    && request.auth.token.role in ['admin', 'manager'];
  allow write: if request.auth != null
    && request.auth.token.role == 'admin';
}
```
