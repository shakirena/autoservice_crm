# Architecture: Feature #70 — Open/Create Order from Appointment Card

## Schema Changes

### `appointments` collection
Add optional field:
```
orderId?: string | null   // ID заказа, созданного из этой записи
```
No migration needed — Firestore is schemaless. Existing documents without `orderId` behave as `orderId = null/undefined`.

### `orders` collection
Add optional field:
```
appointmentId?: string | null  // ID записи, из которой создан заказ
```
Backwards compatible — existing orders have no `appointmentId`.

## Component Changes

### `AppointmentCard.jsx`
- New props: `onCreateOrder`, `onOpenOrder`, `role`
- In kanban mode, bottom action buttons row:
  - `role === 'admin' || role === 'manager'` + `!appointment.orderId` → "Создать заказ" button
  - `appointment.orderId` → "Открыть заказ" button (all roles)
- Calendar mode: no order buttons (compact view, space-limited)

### New: `QuickOrderForm.jsx`
- Location: `src/features/appointments/QuickOrderForm.jsx`
- Uses React Hook Form
- Pre-filled from `appointment` prop: clientName, clientPhone, serviceType, mechanicId, date
- Fields: clientName (required), clientPhone (required), serviceType (select), scheduledDate, notes, mechanic (SearchableSelect)
- Submit flow: `createOrder(data)` → `linkOrderToAppointment(appointment.id, orderId)` → `onSuccess(orderId)`

### `AppointmentsPage.jsx`
- New state: `quickOrderAppt` (null | AppointmentDoc)
- New handlers: `handleCreateOrder(appt)`, `handleOpenOrder(orderId)`, `handleQuickOrderSuccess(orderId)`
- QuickOrderForm modal similar to existing AppointmentForm modal
- Pass `onCreateOrder`, `onOpenOrder`, `role` props to AppointmentCalendar and AppointmentKanban

### `AppointmentCalendar.jsx`
- Accept and pass through `onCreateOrder`, `onOpenOrder`, `role` props to AppointmentCard

### `AppointmentKanban.jsx`
- Accept and pass through `onCreateOrder`, `onOpenOrder`, `role` props to AppointmentCard (via KanbanColumn)

## Service Layer Changes

### `appointmentsService.js`
- Add `linkOrderToAppointment(appointmentId, orderId)` function
- Update `AppointmentDoc` typedef to include `orderId?: string|null`

### `ordersService.js`
- Update `createOrder` to accept and persist optional `appointmentId` field

## Hook Changes

### `useAppointments.js`
- Add `useLinkOrder()` mutation hook

### `useOrders.js`
- `useCreateOrder` already exists — no change needed (passes all data fields through)

## Data Flow

```
Manager clicks "Создать заказ"
  → AppointmentsPage.handleCreateOrder(appt)
    → setQuickOrderAppt(appt)
      → QuickOrderForm modal opens (pre-filled)
        → user submits
          → createOrder({ ...formData, appointmentId: appt.id })
            → Firestore: orders/{newId}
          → linkOrderToAppointment(appt.id, newId)
            → Firestore: appointments/{appt.id}.orderId = newId
          → onSuccess(newId)
            → setQuickOrderAppt(null)
            → navigate('/dashboard/orders/' + newId)
```

## Security
- Role check in `AppointmentCard`: mechanic cannot see "Создать заказ"
- Firestore rules (existing): `request.auth != null` baseline
- No direct Firestore calls in components — all via services

## Story Breakdown
- **Story A**: Service layer (appointmentsService + ordersService + useAppointments hook)
- **Story B**: UI (AppointmentCard buttons + QuickOrderForm + AppointmentsPage wiring)
