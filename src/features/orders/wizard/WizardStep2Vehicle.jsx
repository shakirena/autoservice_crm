import { useVehiclesByClient } from '../../../hooks/useVehicles.js'

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

const selectErrorStyle = {
  ...selectStyle,
  borderColor: '#ef4444',
}

const errorMsgStyle = {
  color: '#ef4444',
  fontSize: '12px',
  marginTop: '4px',
}

/**
 * Шаг 2 мастера — выбор автомобиля клиента.
 * Список авто фильтруется по выбранному clientId (шаг 1).
 *
 * @param {{
 *   clientId: string,
 *   register: Function,
 *   errors: Object,
 * }} props
 */
function WizardStep2Vehicle({ clientId, register, errors }) {
  const { data: vehicles = [], isLoading } = useVehiclesByClient(clientId)

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
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="order-vehicleId" style={labelStyle}>
            Автомобиль <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            id="order-vehicleId"
            data-testid="order-select-vehicle"
            disabled={isLoading || !clientId}
            style={errors.vehicleId ? selectErrorStyle : selectStyle}
            {...register('vehicleId', { required: 'Выберите автомобиль' })}
          >
            <option value="">
              {isLoading
                ? 'Загрузка...'
                : vehicles.length === 0
                  ? 'Нет автомобилей у этого клиента'
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
      )}
    </div>
  )
}

export default WizardStep2Vehicle
