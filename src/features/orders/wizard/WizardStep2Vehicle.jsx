import { useState, useEffect } from 'react'
import { useVehiclesByClient } from '../../../hooks/useVehicles.js'
import CreateVehicleModal from './CreateVehicleModal.jsx'

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
 * Шаг 2 мастера — выбор автомобиля клиента.
 * Поддерживает создание нового автомобиля через модальное окно.
 * clientId из wizard предзаполняется в модалку.
 *
 * @param {{
 *   clientId: string,
 *   register: Function,
 *   errors: Object,
 *   setValue: Function,
 * }} props
 */
function WizardStep2Vehicle({ clientId, register, errors, setValue }) {
  const { data: vehicles = [], isLoading } = useVehiclesByClient(clientId)
  const [showModal, setShowModal] = useState(false)
  // Ожидаем появления нового авто в списке перед вызовом setValue.
  // Без этого браузер игнорирует select.value = id, если <option> ещё нет в DOM.
  const [pendingVehicleId, setPendingVehicleId] = useState(null)

  useEffect(() => {
    if (pendingVehicleId && vehicles.some((v) => v.id === pendingVehicleId)) {
      setValue('vehicleId', pendingVehicleId, { shouldValidate: true })
      setPendingVehicleId(null)
    }
  }, [vehicles, pendingVehicleId, setValue])

  function handleCreated(newId) {
    setShowModal(false)
    setPendingVehicleId(newId)
  }

  return (
    <div data-testid="wizard-step-2">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        Шаг 2 из 7 — Автомобиль
      </h2>

      {!clientId && (
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Сначала выберите клиента на предыдущем шаге.
        </p>
      )}

      {clientId && (
        <>
          <div style={{ marginBottom: '4px' }}>
            <label htmlFor="order-vehicleId" style={labelStyle}>
              Автомобиль <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="order-vehicleId"
              data-testid="order-select-vehicle"
              disabled={isLoading}
              style={errors.vehicleId ? selectErrorStyle : selectStyle}
              {...register('vehicleId', { required: 'Выберите автомобиль' })}
            >
              <option value="">
                {isLoading
                  ? 'Загрузка...'
                  : vehicles.length === 0
                    ? 'Нет автомобилей — добавьте ниже'
                    : '— Выберите автомобиль —'}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} {v.year} — {v.licensePlate}
                </option>
              ))}
            </select>
            {errors.vehicleId && (
              <p style={errorMsgStyle}>{errors.vehicleId.message}</p>
            )}
          </div>

          <button
            data-testid="wizard-create-vehicle-toggle"
            type="button"
            style={{ ...linkBtnStyle, marginTop: '8px' }}
            onClick={() => setShowModal(true)}
          >
            + Добавить новый автомобиль
          </button>

          {showModal && (
            <CreateVehicleModal
              clientId={clientId}
              onCreated={handleCreated}
              onClose={() => setShowModal(false)}
            />
          )}
        </>
      )}
    </div>
  )
}

export default WizardStep2Vehicle
