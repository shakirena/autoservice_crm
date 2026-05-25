/**
 * AppointmentForm — Форма создания и редактирования записи клиента.
 *
 * Поддерживает три режима выбора клиента:
 *   'directory' — из справочника (SearchableSelect + автозаполнение)
 *   'new'       — создание нового клиента inline (ФИО + телефон + email)
 *   'anonymous' — анонимная запись (только ФИО + телефон, clientId = null)
 *
 * @module AppointmentForm
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useClients, useCreateClient } from '../../hooks/useClients.js'
import { useUsers } from '../../hooks/useUsers.js'
import { useCreateAppointment, useUpdateAppointment } from '../../hooks/useAppointments.js'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'

// ─── Типы услуг ───────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  'Замена масла',
  'Диагностика',
  'Шиномонтаж',
  'Кузовной ремонт',
  'ТО',
  'Другое',
]

const DURATIONS = [
  { value: 30, label: '30 минут' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
  { value: 180, label: '3 часа' },
]

const CLIENT_MODES = [
  { value: 'directory', label: 'Из справочника' },
  { value: 'new',       label: 'Новый клиент' },
  { value: 'anonymous', label: 'Анонимная запись' },
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
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const inputErrorStyle = { ...inputStyle, borderColor: '#ef4444' }

const errorMsgStyle = { color: '#ef4444', fontSize: '12px', marginTop: '4px' }

const fieldStyle = { marginBottom: '16px' }

const footerStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  marginTop: '24px',
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   appointment?:  import('../../services/appointmentsService.js').AppointmentDoc,
 *   onSuccess:     () => void,
 *   onCancel:      () => void,
 *   prefillDate?:  string,
 *   prefillTime?:  string,
 * }} props
 */
function AppointmentForm({ appointment, onSuccess, onCancel, prefillDate, prefillTime }) {
  const isEdit = Boolean(appointment?.id)

  const [clientMode, setClientMode] = useState(
    appointment?.clientId === null ? 'anonymous' : 'directory',
  )
  const [submitError, setSubmitError] = useState(null)

  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: users = [], isLoading: usersLoading } = useUsers()
  const { mutateAsync: createClient } = useCreateClient()
  const { mutateAsync: createAppointment, isPending: isCreating } = useCreateAppointment()
  const { mutateAsync: updateAppointment, isPending: isUpdating } = useUpdateAppointment()
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientId:    appointment?.clientId   ?? '',
      clientName:  appointment?.clientName ?? '',
      clientPhone: appointment?.clientPhone ?? '',
      clientEmail: '',
      date:        appointment?.date   ?? prefillDate ?? '',
      time:        appointment?.time   ?? prefillTime ?? '',
      duration:    appointment?.duration  ?? 60,
      serviceType: appointment?.serviceType ?? '',
      mechanicId:  appointment?.mechanicId  ?? '',
      notes:       appointment?.notes       ?? '',
    },
  })

  const clientIdValue   = watch('clientId')
  const mechanicIdValue = watch('mechanicId')

  // Опции для SearchableSelect клиентов
  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.fullName,
    sublabel: c.phone,
  }))

  // Опции для механиков (только роль mechanic)
  const mechanicOptions = users
    .filter((u) => u.role === 'mechanic')
    .map((u) => ({
      value: u.uid ?? u.id,
      label: u.displayName ?? u.email ?? u.uid,
    }))

  function handleClientSelect(id) {
    setValue('clientId', id, { shouldValidate: true })
    const client = clients.find((c) => c.id === id)
    if (client) {
      setValue('clientName', client.fullName)
      setValue('clientPhone', client.phone)
    }
  }

  async function onSubmit(values) {
    setSubmitError(null)
    try {
      let clientId = values.clientId || null
      let clientName = values.clientName
      let clientPhone = values.clientPhone

      if (clientMode === 'new') {
        const result = await createClient({
          fullName: values.clientName,
          phone: values.clientPhone,
          email: values.clientEmail ?? '',
          createdBy: 'system',
        })
        clientId = result.id
      }

      if (clientMode === 'anonymous') {
        clientId = null
      }

      const payload = {
        date: values.date,
        time: values.time,
        duration: Number(values.duration),
        serviceType: values.serviceType,
        status: appointment?.status ?? 'waiting',
        clientId,
        clientName,
        clientPhone,
        mechanicId: values.mechanicId || null,
        notes: values.notes ?? '',
      }

      if (isEdit) {
        await updateAppointment({ id: appointment.id, data: payload })
      } else {
        await createAppointment(payload)
      }
      onSuccess()
    } catch (err) {
      console.error('AppointmentForm submit error:', err)
      // Показываем пользователю человекочитаемое сообщение об ошибке
      const code = err?.code ?? ''
      if (code === 'permission-denied') {
        setSubmitError('Нет прав для сохранения записи. Обратитесь к администратору.')
      } else if (code.startsWith('unavailable') || code.startsWith('network')) {
        setSubmitError('Нет соединения с сервером. Проверьте интернет и попробуйте снова.')
      } else {
        setSubmitError(err?.message ?? 'Не удалось сохранить запись. Попробуйте ещё раз.')
      }
    }
  }

  return (
    <div data-testid="appointment-form">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        {isEdit ? 'Редактировать запись' : 'Новая запись'}
      </h2>

      {/* Переключатель режима клиента */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {CLIENT_MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            data-testid={`client-mode-${m.value}`}
            onClick={() => {
              setClientMode(m.value)
              clearErrors() // Очищаем ошибки предыдущего режима
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              background: clientMode === m.value ? '#2563eb' : '#f1f5f9',
              color: clientMode === m.value ? '#fff' : '#475569',
              fontWeight: clientMode === m.value ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/*
          clientId всегда зарегистрирован (вне условного блока), чтобы избежать
          бага RHF shouldUnregister:false — при размонтировании скрытого поля его
          правило required сохранялось, и форма тихо блокировала сабмит в режиме
          'anonymous'/'new'. Валидация теперь динамическая через validate.
        */}
        <input
          type="hidden"
          {...register('clientId', {
            validate: (v) =>
              clientMode !== 'directory' || Boolean(v) || 'Выберите клиента из справочника',
          })}
        />

        {/* ── Режим: из справочника ── */}
        {clientMode === 'directory' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Клиент <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <SearchableSelect
                testId="appt-select-client"
                options={clientOptions}
                value={clientIdValue}
                onChange={handleClientSelect}
                placeholder="— Начните вводить имя или телефон —"
                loading={clientsLoading}
                hasError={Boolean(errors.clientId)}
              />
              {errors.clientId && <p style={errorMsgStyle}>{errors.clientId.message}</p>}
            </div>
          </>
        )}

        {/* ── Режим: новый клиент ── */}
        {clientMode === 'new' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>ФИО <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                data-testid="appt-input-clientName"
                type="text"
                placeholder="Иванов Иван Иванович"
                style={errors.clientName ? inputErrorStyle : inputStyle}
                {...register('clientName', { required: 'Введите ФИО' })}
              />
              {errors.clientName && <p style={errorMsgStyle}>{errors.clientName.message}</p>}
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Телефон <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                data-testid="appt-input-clientPhone"
                type="tel"
                placeholder="+994 50 123 45 67"
                style={errors.clientPhone ? inputErrorStyle : inputStyle}
                {...register('clientPhone', { required: 'Введите телефон' })}
              />
              {errors.clientPhone && <p style={errorMsgStyle}>{errors.clientPhone.message}</p>}
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input
                data-testid="appt-input-clientEmail"
                type="email"
                placeholder="example@mail.com"
                style={inputStyle}
                {...register('clientEmail')}
              />
            </div>
          </>
        )}

        {/* ── Режим: анонимная запись ── */}
        {clientMode === 'anonymous' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Имя <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                data-testid="appt-input-clientName"
                type="text"
                placeholder="Имя клиента"
                style={errors.clientName ? inputErrorStyle : inputStyle}
                {...register('clientName', { required: 'Введите имя' })}
              />
              {errors.clientName && <p style={errorMsgStyle}>{errors.clientName.message}</p>}
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Телефон <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                data-testid="appt-input-clientPhone"
                type="tel"
                placeholder="+994 50 123 45 67"
                style={errors.clientPhone ? inputErrorStyle : inputStyle}
                {...register('clientPhone', { required: 'Введите телефон' })}
              />
              {errors.clientPhone && <p style={errorMsgStyle}>{errors.clientPhone.message}</p>}
            </div>
          </>
        )}

        {/* ── Общие поля ── */}

        {/* Дата */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Дата <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            data-testid="appt-input-date"
            type="date"
            style={errors.date ? inputErrorStyle : inputStyle}
            {...register('date', { required: 'Укажите дату' })}
          />
          {errors.date && <p style={errorMsgStyle}>{errors.date.message}</p>}
        </div>

        {/* Время */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Время <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            data-testid="appt-input-time"
            type="time"
            style={errors.time ? inputErrorStyle : inputStyle}
            {...register('time', { required: 'Укажите время' })}
          />
          {errors.time && <p style={errorMsgStyle}>{errors.time.message}</p>}
        </div>

        {/* Длительность */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Длительность</label>
          <select
            data-testid="appt-select-duration"
            style={{ ...inputStyle, cursor: 'pointer' }}
            {...register('duration')}
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Тип услуги */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Услуга <span style={{ color: '#ef4444' }}>*</span></label>
          <select
            data-testid="appt-select-serviceType"
            style={errors.serviceType ? { ...inputStyle, ...inputErrorStyle, cursor: 'pointer' } : { ...inputStyle, cursor: 'pointer' }}
            {...register('serviceType', { required: 'Выберите тип услуги' })}
          >
            <option value="">— Выберите услугу —</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.serviceType && <p style={errorMsgStyle}>{errors.serviceType.message}</p>}
        </div>

        {/* Механик */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Механик (необязательно)</label>
          <input type="hidden" {...register('mechanicId')} />
          <SearchableSelect
            testId="appt-select-mechanic"
            options={mechanicOptions}
            value={mechanicIdValue}
            onChange={(v) => setValue('mechanicId', v)}
            placeholder="— Не назначен —"
            loading={usersLoading}
          />
        </div>

        {/* Примечания */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Примечания</label>
          <textarea
            data-testid="appt-input-notes"
            rows={3}
            placeholder="Дополнительная информация..."
            style={{ ...inputStyle, resize: 'vertical' }}
            {...register('notes')}
          />
        </div>

        {/* Ошибка сохранения */}
        {submitError && (
          <div
            data-testid="appt-submit-error"
            role="alert"
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              color: '#b91c1c',
              fontSize: '13px',
            }}
          >
            {submitError}
          </div>
        )}

        {/* Кнопки */}
        <div style={footerStyle}>
          <button
            data-testid="appt-form-cancel"
            type="button"
            onClick={onCancel}
            disabled={isPending}
            style={{
              padding: '8px 18px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            data-testid="appt-form-submit"
            type="submit"
            disabled={isPending}
            style={{
              padding: '8px 18px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать запись'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AppointmentForm
