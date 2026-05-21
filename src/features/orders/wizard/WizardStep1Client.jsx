import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useClients, useCreateClient } from '../../../hooks/useClients.js'

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
}

const selectStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}

const selectErrorStyle = { ...selectStyle, borderColor: '#ef4444' }

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

const inlineFormStyle = {
  marginTop: '16px',
  padding: '16px',
  background: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
}

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  fontSize: '13px',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
}

const saveBtnStyle = {
  padding: '7px 16px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
}

const cancelBtnStyle = {
  padding: '7px 14px',
  background: '#f1f5f9',
  color: '#475569',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
}

// ─── Inline client creation form ───────────────────────────────────────────────

function InlineClientForm({ uid, onCreated, onCancel }) {
  const { mutateAsync: createClient } = useCreateClient()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { fullName: '', phone: '' } })

  async function onSubmit(values) {
    const { id } = await createClient({ ...values, createdBy: uid ?? '' })
    onCreated(id)
  }

  return (
    <div data-testid="inline-client-form" style={inlineFormStyle}>
      <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#0369a1' }}>
        Новый клиент
      </p>

      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>ФИО *</label>
        <input
          data-testid="inline-client-fullName"
          style={errors.fullName ? inputErrorStyle : inputStyle}
          placeholder="Мамедов Эльшан Фарид"
          {...register('fullName', { required: 'Обязательно', minLength: { value: 2, message: 'Минимум 2 символа' } })}
        />
        {errors.fullName && <p style={errorMsgStyle}>{errors.fullName.message}</p>}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Телефон *</label>
        <input
          data-testid="inline-client-phone"
          type="tel"
          style={errors.phone ? inputErrorStyle : inputStyle}
          placeholder="+994 50 123 45 67"
          {...register('phone', { required: 'Обязательно' })}
        />
        {errors.phone && <p style={errorMsgStyle}>{errors.phone.message}</p>}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          data-testid="inline-client-save"
          type="button"
          disabled={isSubmitting}
          style={{ ...saveBtnStyle, opacity: isSubmitting ? 0.7 : 1 }}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting ? 'Создание...' : 'Создать клиента'}
        </button>
        <button type="button" style={cancelBtnStyle} onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  )
}

// ─── Main step component ───────────────────────────────────────────────────────

/**
 * Шаг 1 мастера создания заказа — выбор клиента.
 * Поддерживает inline-создание нового клиента без перехода в другой раздел.
 *
 * @param {{
 *   register: Function,
 *   errors: Object,
 *   setValue: Function,
 *   uid: string,
 * }} props
 */
function WizardStep1Client({ register, errors, setValue, uid }) {
  const { data: clients = [], isLoading } = useClients()
  const [showCreate, setShowCreate] = useState(false)

  function handleCreated(newId) {
    setShowCreate(false)
    setValue('clientId', newId, { shouldValidate: true })
  }

  return (
    <div data-testid="wizard-step-1">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        Шаг 1 из 7 — Выбор клиента
      </h2>

      <div style={{ marginBottom: '4px' }}>
        <label htmlFor="order-clientId" style={labelStyle}>
          Клиент <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <select
          id="order-clientId"
          data-testid="order-select-client"
          disabled={isLoading}
          style={errors.clientId ? selectErrorStyle : selectStyle}
          {...register('clientId', { required: 'Выберите клиента' })}
        >
          <option value="">
            {isLoading ? 'Загрузка клиентов...' : '— Выберите клиента —'}
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} ({c.phone})
            </option>
          ))}
        </select>
        {errors.clientId && (
          <p style={errorMsgStyle}>{errors.clientId.message}</p>
        )}
      </div>

      {!showCreate && (
        <button
          data-testid="wizard-create-client-toggle"
          type="button"
          style={{ ...linkBtnStyle, marginTop: '8px' }}
          onClick={() => setShowCreate(true)}
        >
          + Создать нового клиента
        </button>
      )}

      {showCreate && (
        <InlineClientForm
          uid={uid}
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

export default WizardStep1Client
