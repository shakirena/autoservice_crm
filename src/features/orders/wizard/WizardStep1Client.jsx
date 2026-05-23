import { useState } from 'react'
import { useClients } from '../../../hooks/useClients.js'
import CreateClientModal from './CreateClientModal.jsx'

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

const errorMsgStyle = { color: '#ef4444', fontSize: '12px', marginTop: '4px' }

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  fontSize: '13px',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
}

// ─── Main step component ───────────────────────────────────────────────────────

/**
 * Шаг 1 мастера создания заказа — выбор клиента.
 * Поддерживает создание нового клиента через модальное окно.
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
  const [showModal, setShowModal] = useState(false)

  function handleCreated(newId) {
    setShowModal(false)
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

      <button
        data-testid="wizard-create-client-toggle"
        type="button"
        style={{ ...linkBtnStyle, marginTop: '8px' }}
        onClick={() => setShowModal(true)}
      >
        + Создать нового клиента
      </button>

      {showModal && (
        <CreateClientModal
          uid={uid}
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

export default WizardStep1Client
