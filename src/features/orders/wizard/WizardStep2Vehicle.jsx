import { useState, useEffect, useRef } from 'react'
import { useVehiclesByClient } from '../../../hooks/useVehicles.js'
import SearchableSelect from '../../../components/ui/SearchableSelect.jsx'
import CreateVehicleModal from './CreateVehicleModal.jsx'

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
 * Шаг 2 мастера — выбор автомобиля клиента с поиском.
 * Поддерживает создание нового автомобиля через модальное окно.
 *
 * @param {{
 *   clientId: string,
 *   register: Function,
 *   errors: Object,
 *   setValue: Function,
 *   watch: Function,
 * }} props
 */
function WizardStep2Vehicle({ clientId, register, errors, setValue, watch }) {
  const { data: vehicles = [], isLoading } = useVehiclesByClient(clientId)
  const [showModal, setShowModal] = useState(false)

  // pendingVehicleIdRef — ждём появления нового авто в списке после создания.
  // useRef вместо useState — не нарушает react-hooks/set-state-in-effect.
  const pendingVehicleIdRef = useRef(null)

  useEffect(() => {
    const pid = pendingVehicleIdRef.current
    if (pid && vehicles.some((v) => v.id === pid)) {
      setValue('vehicleId', pid, { shouldValidate: true })
      pendingVehicleIdRef.current = null
    }
  }, [vehicles, setValue])

  function handleCreated(newId) {
    pendingVehicleIdRef.current = newId
    setShowModal(false)
  }

  const currentVehicleId = watch ? watch('vehicleId') : ''

  // Опции: label = Марка Модель Год, sublabel = гос.номер (поиск по обоим)
  const options = vehicles.map((v) => ({
    value: v.id,
    label: `${v.make} ${v.model} ${v.year}`,
    sublabel: v.licensePlate,
  }))

  function handleChange(selectedId) {
    setValue('vehicleId', selectedId, { shouldValidate: true })
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

            {/* Скрытый input для регистрации поля в RHF (валидация) */}
            <input
              type="hidden"
              {...register('vehicleId', { required: 'Выберите автомобиль' })}
            />

            <SearchableSelect
              testId="order-select-vehicle"
              options={options}
              value={currentVehicleId}
              onChange={handleChange}
              placeholder={
                isLoading
                  ? 'Загрузка...'
                  : vehicles.length === 0
                    ? 'Нет автомобилей — добавьте ниже'
                    : '— Введите марку или гос. номер —'
              }
              loading={isLoading}
              hasError={Boolean(errors.vehicleId)}
            />

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
