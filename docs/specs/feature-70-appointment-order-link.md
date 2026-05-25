# Spec: Feature #70 — Open/Create Order from Appointment Card

## Summary
Add "Открыть заказ" / "Создать заказ" buttons to appointment cards so managers can create or navigate to orders directly from appointments.

## User Stories
- As a manager/admin, I want to create an order from an appointment card so I can start work faster.
- As a mechanic, I want to open an existing order from an appointment card so I can see order details.

## Behaviour

### When `orderId` is null (no linked order)
- **admin/manager**: shows "Создать заказ" button in kanban card (not in calendar compact view).
- **mechanic/client**: button is hidden — they cannot create orders.
- Clicking opens `QuickOrderForm` modal pre-filled with appointment data.

### When `orderId` is set (linked order exists)
- All roles see "Открыть заказ" button.
- Clicking navigates to `/dashboard/orders/{orderId}`.

## Acceptance Criteria
- [ ] `appointmentsService.linkOrderToAppointment(appointmentId, orderId)` — helper function
- [ ] `useAppointments.useLinkOrder()` — mutation hook
- [ ] `ordersService.createOrder` accepts optional `appointmentId` field
- [ ] `AppointmentCard` shows correct button based on `orderId` and `role`
- [ ] `QuickOrderForm` pre-fills clientName, clientPhone, serviceType, mechanicId, date
- [ ] On form submit: create order → link orderId to appointment → navigate to order
- [ ] Mechanic cannot see "Создать заказ"
- [ ] No direct Firestore calls in components

## Out of Scope
- Full order wizard from appointment (uses quick form only)
- Order edit from appointments page
