# Feature #64 — Канбан-доска записи клиентов

## Feature Overview

Канбан/календарная доска для записи клиентов на услуги автосервиса. Администратор или менеджер быстро записывает клиентов на конкретную дату и время, выбирает тип услуги. Клиент может быть уже в справочнике, создан прямо во время записи, либо записан «частично» (только телефон/ФИО) — до его фактического прихода, после которого создаётся полноценная карточка.

Данные хранятся в Firestore-коллекции `appointments`. Доступ только аутентифицированным пользователям. Роль `mechanic` видит только свои назначенные записи; `manager`/`admin` — все.

---

## User Stories

### US-1: Календарное представление записей
**As a** manager/admin,  
**I want** to see all appointments on a calendar (day/week/month view),  
**so that** I can quickly navigate the schedule and spot conflicts or gaps.

**Acceptance Criteria:**
- [ ] AC-1.1: Страница «Запись» отображает три вкладки: «День», «Неделя», «Месяц».
- [ ] AC-1.2: Каждый слот записи показывает: имя клиента (или телефон если анонимный), время, тип услуги.
- [ ] AC-1.3: Кнопка «Сегодня» возвращает к текущей дате.
- [ ] AC-1.4: Клик на слот открывает карточку записи с полной информацией.
- [ ] AC-1.5: Кнопка «+ Добавить запись» в заголовке открывает форму создания.

---

### US-2: Канбан-представление по статусам
**As a** manager/admin,  
**I want** to see appointments grouped by status columns on a kanban board,  
**so that** I can track the pipeline from new bookings to completed services.

**Acceptance Criteria:**
- [ ] AC-2.1: Канбан содержит 5 колонок: «Ожидает» / «Подтверждено» / «В работе» / «Завершено» / «Отменено».
- [ ] AC-2.2: Каждая карточка показывает: клиент, дата/время, тип услуги, механик (если назначен).
- [ ] AC-2.3: Клик кнопки «→ Следующий статус» на карточке переводит запись в следующий статус без перезагрузки.
- [ ] AC-2.4: Количество записей отображается в заголовке каждой колонки.
- [ ] AC-2.5: Запись видна и в календарном, и в канбан-представлении одновременно (единый источник данных).

---

### US-3: Создание записи — клиент из справочника
**As a** manager/admin,  
**I want** to create an appointment by selecting an existing client from the directory,  
**so that** the appointment is linked to the full client profile.

**Acceptance Criteria:**
- [ ] AC-3.1: Форма записи содержит SearchableSelect для выбора клиента (поиск по ФИО и телефону).
- [ ] AC-3.2: После выбора клиента поле `clientId` заполняется, `clientPhone` и `clientName` подставляются автоматически.
- [ ] AC-3.3: Форма содержит поля: дата, время, продолжительность (мин), тип услуги, механик (опционально), примечания.
- [ ] AC-3.4: Все обязательные поля валидируются через React Hook Form перед сохранением.
- [ ] AC-3.5: После сохранения запись сразу появляется в календаре и канбане (real-time onSnapshot).

---

### US-4: Создание записи — новый клиент inline
**As a** manager/admin,  
**I want** to create a new client directly from the appointment form without leaving the page,  
**so that** I can handle new customers in a single workflow.

**Acceptance Criteria:**
- [ ] AC-4.1: Кнопка «+ Создать нового клиента» открывает модальное окно (аналогично CreateClientModal из мастера заказов).
- [ ] AC-4.2: После создания клиента модал закрывается, новый клиент автоматически выбирается в SearchableSelect.
- [ ] AC-4.3: Новый клиент сохраняется в коллекцию `clients` и сразу доступен в других формах.
- [ ] AC-4.4: Если создание клиента завершилось ошибкой — форма записи остаётся открытой и показывает сообщение об ошибке.

---

### US-5: Создание анонимной записи (частичные данные)
**As a** manager/admin,  
**I want** to create an appointment with only phone number and name (no full client profile),  
**so that** I can book slots quickly when a client calls and hasn't visited yet.

**Acceptance Criteria:**
- [ ] AC-5.1: В форме есть переключатель/radio: «Клиент из справочника» / «Новый клиент» / «Анонимная запись».
- [ ] AC-5.2: При выборе «Анонимная запись» поля ФИО и телефон обязательны, `clientId` остаётся пустым.
- [ ] AC-5.3: Анонимная запись отображается в канбане и календаре с пометкой «Анон.» и телефоном.
- [ ] AC-5.4: Запись сохраняется в Firestore с `clientId: null`, `clientPhone`, `clientName` заполненными.

---

### US-6: Привязка клиента к анонимной записи
**As a** manager/admin,  
**I want** to link an existing or newly created client to an anonymous appointment when the client arrives,  
**so that** the booking history is properly associated with the full client profile.

**Acceptance Criteria:**
- [ ] AC-6.1: Карточка анонимной записи имеет кнопку «Привязать клиента».
- [ ] AC-6.2: Нажатие открывает SearchableSelect для выбора существующего клиента или форму создания нового.
- [ ] AC-6.3: После выбора `clientId` в документе обновляется через `updateAppointment`.
- [ ] AC-6.4: Карточка перестаёт отображаться как анонимная после привязки.

---

### US-7: Просмотр записей для механика
**As a** mechanic,  
**I want** to see only my assigned appointments on the calendar and kanban,  
**so that** I can focus on my work without seeing other mechanics' schedules.

**Acceptance Criteria:**
- [ ] AC-7.1: При роли `mechanic` Firestore-запрос фильтрует по `mechanicId == auth.uid`.
- [ ] AC-7.2: Механик не может изменить `mechanicId` или создать запись с другим механиком.
- [ ] AC-7.3: Механик может переводить статус своих записей: «Подтверждено» → «В работе» → «Завершено».
- [ ] AC-7.4: Администратор и менеджер видят все записи без фильтра.

---

## Data Model: `appointments` Firestore Collection

```
appointments/{appointmentId}
```

| Поле | Тип | Обяз. | Описание |
|------|-----|-------|----------|
| `appointmentId` | string | auto | Firestore document ID |
| `date` | string | да | ISO дата, YYYY-MM-DD |
| `time` | string | да | HH:MM (24h) |
| `duration` | number | да | Продолжительность в минутах (30, 60, 90, 120) |
| `serviceType` | string | да | ID или название типа услуги |
| `status` | string | да | `waiting` / `confirmed` / `in_progress` / `completed` / `cancelled` |
| `clientId` | string\|null | нет | Ссылка на `clients/{clientId}`, null для анонимных |
| `clientPhone` | string | да | Телефон (всегда заполнен) |
| `clientName` | string | да | ФИО или имя (всегда заполнен) |
| `mechanicId` | string\|null | нет | Ссылка на `users/{uid}` с ролью mechanic |
| `notes` | string | нет | Свободный текст-примечания |
| `createdBy` | string | да | UID пользователя-создателя |
| `createdAt` | Timestamp | да | `serverTimestamp()` |
| `updatedAt` | Timestamp | да | `serverTimestamp()` при обновлении |

**Индексы (рекомендуемые):**
- `date ASC, status ASC` — для календарного view
- `mechanicId ASC, date ASC` — для фильтра по механику
- `status ASC, date ASC` — для канбан-колонок

**Firestore Security Rules (дополнение):**
```javascript
match /appointments/{apptId} {
  allow read: if request.auth != null
    && (request.auth.token.role in ['admin', 'manager']
        || resource.data.mechanicId == request.auth.uid);
  allow create: if request.auth != null
    && request.auth.token.role in ['admin', 'manager'];
  allow update: if request.auth != null
    && (request.auth.token.role in ['admin', 'manager']
        || resource.data.mechanicId == request.auth.uid);
  allow delete: if request.auth != null
    && request.auth.token.role == 'admin';
}
```

---

## UI Flows

### Flow 1: Календарное представление

```
AppointmentsPage
  ├── Заголовок: «Записи» + кнопка «+ Добавить запись»
  ├── Переключатель вида: [Календарь] [Канбан]
  └── AppointmentCalendar
        ├── Переключатель периода: [День] [Неделя] [Месяц]
        ├── Навигация: ← Пред. | Сегодня | След. →
        └── Сетка слотов
              └── AppointmentCard (мини) — клик → детальная карточка
```

**Взаимодействие:**
1. Пользователь открывает `/dashboard/appointments` — по умолчанию «Неделя».
2. Навигация по датам через кнопки ← / →.
3. Клик на пустой слот → открывает `AppointmentForm` с предзаполненными датой/временем.
4. Клик на существующую карточку → открывает `AppointmentCard` в режиме просмотра/редактирования.

---

### Flow 2: Канбан-представление

```
AppointmentKanban
  └── Колонки: [Ожидает] [Подтверждено] [В работе] [Завершено] [Отменено]
        └── AppointmentCard (канбан) — кнопка «→ Следующий статус»
```

**Взаимодействие:**
1. Клик «→ Следующий статус» → вызов `updateAppointmentStatus(id, nextStatus)`.
2. Real-time `onSnapshot` обновляет UI без reload.
3. Кнопка «Отменить» всегда доступна (кроме завершённых).

---

### Flow 3: Форма добавления записи (3 режима клиента)

```
AppointmentForm
  ├── Переключатель режима клиента:
  │     ● Из справочника  ○ Новый клиент  ○ Анонимная запись
  │
  ├── [Режим 1 — из справочника]
  │     └── SearchableSelect (clients) → автозаполняет clientPhone, clientName
  │         + кнопка «+ Создать нового» → CreateClientModal
  │
  ├── [Режим 2 — новый клиент]
  │     └── Inline-форма: ФИО, телефон, email (опц.)
  │         → createClient() → затем createAppointment() с полученным clientId
  │
  ├── [Режим 3 — анонимная запись]
  │     └── Поля: clientName (ФИО/имя), clientPhone
  │         clientId = null при сохранении
  │
  ├── Поля записи (общие для всех режимов):
  │     date, time, duration, serviceType, mechanicId (опц.), notes
  │
  └── Кнопки: [Отмена] [Сохранить]
```

**Валидация (React Hook Form):**
- Режим 1: `clientId` required
- Режим 2: `clientName` required, `clientPhone` required (+ создание клиента перед сохранением)
- Режим 3: `clientName` required, `clientPhone` required
- Общие: `date` required, `time` required, `duration` required, `serviceType` required
