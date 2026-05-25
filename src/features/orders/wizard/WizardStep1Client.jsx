import { useState, useEffect, useRef } from 'react'
import { useClients } from '../../../hooks/useClients.js'
import SearchableSelect from '../../../components/ui/SearchableSelect.jsx'
import CreateClientModal from './CreateClientModal.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
}

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
 * Шаг 1 мастера создания заказа — выбор клиента с поиском.
 * Поддерживает создание нового клиента через модальное окно.
 *
 * @param {{
 *   register: Function,
 *   errors: Object,
 *   setValue: Function,
 *   watch: Function,
 *   uid: string,
 * }} props
 */
function WizardStep1Client({ register, errors, setValue, watch, uid }) {
  const { data: clients = [], isLoading } = useClients()
  const [showModal, setShowModal] = useState(false)

  // pendingClientIdRef — ждём появления нового клиента в списке после создания.
  // useRef вместо useState — не вызывает ре-рендер и не нарушает
  // react-hooks/set-state-in-effect.
  const pendingClientIdRef = useRef(null)

  useEffect(() => {
    const pid = pendingClientIdRef.current
    if (pid && clients.some((c) => c.id === pid)) {
      setValue('clientId', pid, { shouldValidate: true })
      pendingClientIdRef.current = null
    }
  }, [clients, setValue])

  function handleCreated(newId) {
    pendingClientIdRef.current = newId
    setShowModal(false)
  }

  // Текущее значение clientId из формы (для SearchableSelect)
  const currentClientId = watch ? watch('clientId') : ''

  // Опции для SearchableSelect: label = ФИО, sublabel = телефон (поиск по обоим)
  const options = clients.map((c) => ({
    value: c.id,
    label: c.fullName,
    sublabel: c.phone,
  }))

  function handleChange(selectedId) {
    setValue('clientId', selectedId, { shouldValidate: true })
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

        {/* Скрытый input для регистрации поля в RHF (валидация) */}
        <input
          type="hidden"
          {...register('clientId', { required: 'Выберите клиента' })}
        />

        <SearchableSelect
          testId="order-select-client"
          options={options}
          value={currentClientId}
          onChange={handleChange}
          placeholder="— Начните вводить имя или телефон —"
          loading={isLoading}
          hasError={Boolean(errors.clientId)}
        />

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
