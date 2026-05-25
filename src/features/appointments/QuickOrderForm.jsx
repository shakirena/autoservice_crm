/**
 * QuickOrderForm — быстрое создание заказа из записи клиента.
 * Предзаполняет поля из объекта appointment.
 *
 * Последовательность при сабмите:
 *   1. createOrder({ ...data, appointmentId }) — создаёт заказ в Firestore
 *   2. linkOrderToAppointment(appointmentId, orderId) — обновляет appointment.orderId
 *   3. onSuccess(orderId) — родитель выполняет навигацию
 *
 * @module QuickOrderForm
 */

import { useForm } from 'react-hook-form'
import { useAuth } from '../../lib/authContext.jsx'
import { useCreateOrder } from '../../hooks/useOrders.js'
import { useLinkOrder } from '../../hooks/useAppointments.js'
import { useUsers } from '../../hooks/useUsers.js'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'

// ─── Типы услуг (синхронизировано с AppointmentForm) ─────────────────────────

const SERVICE_TYPES = [
  'Замена масла',
  'Диагностика',
  'Шиномонтаж',
  'Кузовной ремонт',
  'ТО',
  'Другое',
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const inputErrorStyle = {
  ...inputStyle,
  borderColor: '#ef4444',
}

const fieldStyle = {
  marginBottom: '16px',
}

const errorTextStyle = {
  color: '#ef4444',
  fontSize: '12px',
  marginTop: '4px',
}

const footerStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  marginTop: '24px',
  paddingTop: '16px',
  borderTop: '1px solid #e2e8f0',
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   appointment: import('../../services/appointmentsService.js').AppointmentDoc,
 *   onSuccess:   (orderId: string) => void,
 *   onCancel:    () => void,
 * }} props
 */
function QuickOrderForm({ appointment, onSuccess, onCancel }) {
  const { user } = useAuth()
  const { mutateAsync: createOrder, isPending: isCreating } = useCreateOrder()
  const { mutate: linkOrder } = useLinkOrder()
  const { data: users = [], isLoading: usersLoading } = useUsers()

  // Фильтруем только механиков для выпадающего списка
  const mechanicOptions = users
    .filter((u) => u.role === 'mechanic' || u.role === 'admin' || u.role === 'manager')
    .map((u) => ({
      value: u.uid,
      label: u.displayName || u.email,
      sublabel: u.role,
    }))

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientName:    appointment.clientName ?? '',
      clientPhone:   appointment.clientPhone ?? '',
      serviceType:   appointment.serviceType ?? '',
      scheduledDate: appointment.date ?? new Date().toISOString().slice(0, 10),
      mechanicId:    appointment.mechanicId ?? '',
      notes:         appointment.notes ?? '',
    },
  })

  const mechanicId = watch('mechanicId')

  async function onSubmit(values) {
    if (!user?.uid) return
    try {
      const { id: orderId } = await createOrder({
        clientId:         appointment.clientId ?? null,
        vehicleId:        null,
        vehicleComponent: values.serviceType ?? '',
        componentParams:  {},
        services:         [],
        totalAmount:      0,
        date:             values.scheduledDate,
        createdBy:        user.uid,
        status:           'draft',
        appointmentId:    appointment.id,
        notes:            values.notes ?? '',
      })

      // Привязываем orderId к записи
      linkOrder({ appointmentId: appointment.id, orderId })

      onSuccess(orderId)
    } catch (err) {
      console.error('QuickOrderForm submit error:', err)
    }
  }

  const isSubmitting = isCreating

  return (
    <div data-testid="quick-order-form">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        Создать заказ
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
        Заказ будет создан и привязан к этой записи клиента.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* Имя клиента */}
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="qof-clientName">
            Имя клиента *
          </label>
          <input
            id="qof-clientName"
            data-testid="qof-clientName"
            type="text"
            style={errors.clientName ? inputErrorStyle : inputStyle}
            {...register('clientName', { required: 'Введите имя клиента' })}
          />
          {errors.clientName && (
            <p style={errorTextStyle}>{errors.clientName.message}</p>
          )}
        </div>

        {/* Телефон */}
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="qof-clientPhone">
            Телефон *
          </label>
          <input
            id="qof-clientPhone"
            data-testid="qof-clientPhone"
            type="tel"
            style={errors.clientPhone ? inputErrorStyle : inputStyle}
            {...register('clientPhone', { required: 'Введите телефон' })}
          />
          {errors.clientPhone && (
            <p style={errorTextStyle}>{errors.clientPhone.message}</p>
          )}
        </div>

        {/* Тип услуги */}
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="qof-serviceType">
            Тип услуги
          </label>
          <select
            id="qof-serviceType"
            data-testid="qof-serviceType"
            style={{ ...inputStyle, cursor: 'pointer' }}
            {...register('serviceType')}
          >
            <option value="">— Выберите тип услуги —</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Дата */}
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="qof-scheduledDate">
            Дата *
          </label>
          <input
            id="qof-scheduledDate"
            data-testid="qof-scheduledDate"
            type="date"
            style={errors.scheduledDate ? inputErrorStyle : inputStyle}
            {...register('scheduledDate', { required: 'Укажите дату' })}
          />
          {errors.scheduledDate && (
            <p style={errorTextStyle}>{errors.scheduledDate.message}</p>
          )}
        </div>

        {/* Механик */}
        <div style={fieldStyle}>
          <label style={labelStyle}>
            Механик
          </label>
          {/* Скрытый input для RHF-регистрации */}
          <input type="hidden" {...register('mechanicId')} />
          <SearchableSelect
            testId="qof-mechanicId"
            options={mechanicOptions}
            value={mechanicId}
            onChange={(val) => setValue('mechanicId', val)}
            placeholder="— Выберите механика —"
            loading={usersLoading}
          />
        </div>

        {/* Примечания */}
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="qof-notes">
            Примечания
          </label>
          <textarea
            id="qof-notes"
            data-testid="qof-notes"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            {...register('notes')}
          />
        </div>

        {/* Кнопки */}
        <div style={footerStyle}>
          <button
            data-testid="qof-cancel-btn"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '9px 20px',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            data-testid="qof-submit-btn"
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '9px 20px',
              background: isSubmitting ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Создание...' : 'Создать заказ'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default QuickOrderForm
