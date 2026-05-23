# Arch: Feature #50 — Modal-создание клиента и автомобиля в wizard

## Решение

Заменить inline-формы в `WizardStep1Client` и `WizardStep2Vehicle` на модальные окна.
Создать два новых компонента-модалки специально для wizard-контекста.

## Новые файлы

```
src/features/orders/wizard/
  CreateClientModal.jsx   ← модалка создания клиента (wizard-контекст)
  CreateVehicleModal.jsx  ← модалка создания автомобиля (wizard-контекст)
```

## Изменяемые файлы

```
src/features/orders/wizard/WizardStep1Client.jsx
  - Удалить: InlineClientForm, inlineFormStyle, связанные стили
  - Добавить: import CreateClientModal; showModal state; рендер <CreateClientModal>

src/features/orders/wizard/WizardStep2Vehicle.jsx
  - Удалить: InlineVehicleForm, inlineFormStyle, связанные стили
  - Добавить: import CreateVehicleModal; showModal state; рендер <CreateVehicleModal>
```

## Компонент CreateClientModal

```jsx
// Props
{
  uid: string,          // createdBy
  onCreated: (id) => void,  // вызывается с ID нового клиента
  onClose: () => void,      // закрыть без создания
}

// Поведение
- overlay onClick → onClose()
- Escape → onClose() (useEffect + keydown listener)
- form submit → createClient() → onCreated(id)
- Поля: fullName (required, min 2), phone (required), email (optional, email format)
```

## Компонент CreateVehicleModal

```jsx
// Props
{
  clientId: string,     // предзаполнен из wizard, не редактируется в форме
  onCreated: (id) => void,
  onClose: () => void,
}

// Поведение
- overlay onClick → onClose()
- Escape → onClose()
- form submit → createVehicle({ ...values, clientId }) → onCreated(id)
- Поля: make*, model*, year*, licensePlate*, vin (optional)
```

## Стилевое решение

Переиспользуем паттерн из `ClientForm.jsx` и `VehicleForm.jsx`:
- `overlayStyle`: `position: fixed; inset: 0; background: rgba(0,0,0,0.5); display:flex; align/justify: center; z-index: 1000`
- `modalStyle`: `background: #fff; border-radius: 10px; padding: 28px 32px; width: 440px; max-width: 95vw; max-height: 90vh; overflow-y: auto`
- `e.stopPropagation()` на modal div (клик внутри не закрывает)

## Dataflow

```
WizardStep1Client
  └─ [+ Новый клиент] onClick → setShowModal(true)
      └─ <CreateClientModal uid onCreated onClose>
           ├─ useCreateClient() → mutateAsync() → Firestore
           ├─ useQueryClient.invalidateQueries(['clients'])
           └─ onCreated(newId) → setValue('clientId', newId)
                → RHF обновляет <select> (clients список обновляется через query)
```

## Test IDs (data-testid)

| Элемент | testid |
|---------|--------|
| Overlay клиента | `wizard-client-modal-overlay` |
| Modal клиента | `wizard-client-modal` |
| Кнопка «Создать клиента» (submit) | `wizard-client-modal-submit` |
| Кнопка отмены клиента | `wizard-client-modal-cancel` |
| Overlay автомобиля | `wizard-vehicle-modal-overlay` |
| Modal автомобиля | `wizard-vehicle-modal` |
| Кнопка «Добавить автомобиль» (submit) | `wizard-vehicle-modal-submit` |
| Кнопка отмены автомобиля | `wizard-vehicle-modal-cancel` |
| Кнопка-триггер клиента | `wizard-create-client-toggle` (существующий) |
| Кнопка-триггер автомобиля | `wizard-create-vehicle-toggle` (существующий) |

## Архитектурные решения

- **Не переиспользуем** `ClientForm.jsx` / `VehicleForm.jsx` напрямую: они предназначены для страниц клиентов/авто, имеют другой callback-контракт (только `onClose` без возврата ID) и требуют дополнительного `clientId`-селекта в VehicleForm
- **Wizard-specific modals** — легковесные, без лишних полей, с `onCreated(id)` callback
- Escape key — `useEffect` с `window.addEventListener('keydown')` + cleanup в return
- После успеха `invalidateQueries` уже делает `useCreateClient` hook → select обновится автоматически
