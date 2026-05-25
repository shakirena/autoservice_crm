# Architecture: Feature #64 — Канбан-доска записи клиентов

## Component Tree

```
AppointmentsPage                      (src/pages/dashboard/AppointmentsPage.jsx)
  ├── [view === 'calendar']
  │     └── AppointmentCalendar       (src/features/appointments/AppointmentCalendar.jsx)
  │           ├── CalendarHeader      (inline — навигация, переключатель День/Неделя/Месяц)
  │           ├── CalendarGrid        (inline — сетка слотов по времени)
  │           └── AppointmentCard     (src/features/appointments/AppointmentCard.jsx)
  │
  ├── [view === 'kanban']
  │     └── AppointmentKanban        (src/features/appointments/AppointmentKanban.jsx)
  │           ├── KanbanColumn        (inline — одна колонка статуса)
  │           └── AppointmentCard     (src/features/appointments/AppointmentCard.jsx)
  │
  ├── AppointmentForm                 (src/features/appointments/AppointmentForm.jsx)
  │     ├── SearchableSelect          (src/components/ui/SearchableSelect.jsx) [режим 1]
  │     ├── CreateClientModal         (src/features/orders/wizard/CreateClientModal.jsx) [режим 1+2]
  │     └── [inline fields]           режим 2: ФИО+телефон+email / режим 3: ФИО+телефон
  │
  └── [modal/overlay для просмотра/редактирования AppointmentCard]
```

---

## Data Flow Diagram

```
AppointmentsPage
      │
      ├── useAppointments()          ←── onSnapshot(collection 'appointments') ──► Firestore
      │     └── returns: { data, isLoading, error }
      │
      ├── useCreateAppointment()     ──► appointmentsService.createAppointment() ──► Firestore
      │     └── onSuccess: invalidate ['appointments']
      │
      ├── useUpdateAppointment()     ──► appointmentsService.updateAppointment() ──► Firestore
      │     └── onSuccess: real-time onSnapshot уже обновил данные
      │
      └── appointmentsStore (Zustand)
            ├── selectedView: 'calendar' | 'kanban'
            ├── calendarPeriod: 'day' | 'week' | 'month'
            ├── currentDate: Date
            ├── isFormOpen: boolean
            ├── editingAppointmentId: string | null
            └── clientMode: 'directory' | 'new' | 'anonymous'

Роль-фильтрация:
  useAuth() → role === 'mechanic'
    → appointmentsService фильтрует по mechanicId == uid
    → manager/admin получают все записи
```

---

## New Files to Create

### Feature module
| Путь | Назначение |
|------|-----------|
| `src/features/appointments/AppointmentCalendar.jsx` | Календарное представление (день/неделя/месяц) |
| `src/features/appointments/AppointmentKanban.jsx` | Канбан-доска по статусам |
| `src/features/appointments/AppointmentForm.jsx` | Форма создания/редактирования (3 режима) |
| `src/features/appointments/AppointmentCard.jsx` | Карточка записи (мини для канбана и календаря) |

### Service & hooks
| Путь | Назначение |
|------|-----------|
| `src/services/appointmentsService.js` | CRUD + onSnapshot для коллекции appointments |
| `src/hooks/useAppointments.js` | TanStack Query-обёртки + real-time listener |

### State & page
| Путь | Назначение |
|------|-----------|
| `src/store/appointmentsStore.js` | Zustand: UI-состояние (вид, дата, модал, режим клиента) |
| `src/pages/dashboard/AppointmentsPage.jsx` | Страница-контейнер, маршрут /dashboard/appointments |

---

## Firestore Schema

```
appointments/{appointmentId}
{
  date:        string,          // "YYYY-MM-DD"
  time:        string,          // "HH:MM"
  duration:    number,          // минуты: 30 | 60 | 90 | 120
  serviceType: string,          // тип услуги (строка или ID из catalog)
  status:      string,          // "waiting"|"confirmed"|"in_progress"|"completed"|"cancelled"
  clientId:    string | null,   // null = анонимная запись
  clientPhone: string,          // всегда заполнен
  clientName:  string,          // всегда заполнен
  mechanicId:  string | null,   // UID из users/{uid}
  notes:       string,          // свободный текст
  createdBy:   string,          // UID создателя
  createdAt:   Timestamp,       // serverTimestamp()
  updatedAt:   Timestamp,       // serverTimestamp() при каждом update
}
```

**Статусный граф:**
```
waiting → confirmed → in_progress → completed
    └──────────────────────────────→ cancelled
```

---

## Zustand Store Shape

```js
// src/store/appointmentsStore.js
{
  // UI-состояние представления
  selectedView: 'calendar',       // 'calendar' | 'kanban'
  calendarPeriod: 'week',         // 'day' | 'week' | 'month'
  currentDate: new Date(),        // текущая точка навигации в календаре

  // Форма
  isFormOpen: false,
  editingAppointmentId: null,     // string | null (null = создание нового)
  clientMode: 'directory',        // 'directory' | 'new' | 'anonymous'
  prefillDate: null,              // string | null — предзаполнение из клика по слоту
  prefillTime: null,              // string | null

  // Actions
  setView(view),
  setCalendarPeriod(period),
  setCurrentDate(date),
  openForm(opts?),                // opts: { appointmentId?, prefillDate?, prefillTime? }
  closeForm(),
  setClientMode(mode),
}
```

---

## React Query Hooks Needed

```js
// src/hooks/useAppointments.js

// Список всех записей (real-time через onSnapshot)
useAppointments(filters?)
// filters: { mechanicId?, dateFrom?, dateTo?, status? }

// Создание записи
useCreateAppointment()
// mutationFn: appointmentsService.createAppointment(data)
// onSuccess: invalidate ['appointments']

// Обновление записи (поля + статус)
useUpdateAppointment()
// mutationFn: appointmentsService.updateAppointment(id, patch)
// onSuccess: invalidate ['appointments'], ['appointments', id]

// Одиночная запись
useAppointment(id)
// queryFn: appointmentsService.getAppointment(id)

// Обновление статуса (оптимистичное)
useUpdateAppointmentStatus()
// mutationFn: appointmentsService.updateAppointmentStatus(id, status)
// onMutate: optimistic update в кеше
// onError: rollback
// onSettled: invalidate ['appointments']
```

---

## Reuse Patterns

- **SearchableSelect** (`src/components/ui/SearchableSelect.jsx`) — выбор клиента в форме (режим 1), выбор механика.
- **CreateClientModal** (`src/features/orders/wizard/CreateClientModal.jsx`) — переиспользуется без изменений для создания клиента из формы записи.
- **DataTable styles** — стили карточек в духе существующих OrderTable/ServiceTable (inline style-objects).
- **onSnapshot pattern** — аналогично `useClients` если там используется real-time; иначе реализовать в `appointmentsService` через `onSnapshot` + Zustand/ref для unsubscribe.

---

## Routing

Добавить в `src/App.jsx` (или router config):
```jsx
<Route path="/dashboard/appointments" element={<AppointmentsPage />} />
```

Добавить ссылку в sidebar/nav под «Заказы».

---

## Implementation Order (recommended)

1. **Story S1**: `appointmentsService.js` + `useAppointments.js` — фундамент
2. **Story S2**: `AppointmentForm.jsx` + `appointmentsStore.js` — создание записей
3. **Story S3**: `AppointmentCalendar.jsx` — визуализация по датам
4. **Story S4**: `AppointmentKanban.jsx` + `AppointmentCard.jsx` — статусный pipeline
5. **Story S5**: страница `AppointmentsPage.jsx` + роутинг + привязка клиента
