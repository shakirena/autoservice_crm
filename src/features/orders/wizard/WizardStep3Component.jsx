import { VEHICLE_COMPONENT_OPTIONS } from '../orderConstants.js'

// ─── Styles ───────────────────────────────────────────────────────────────────

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: '10px',
  marginBottom: '16px',
}

const errorMsgStyle = {
  color: '#ef4444',
  fontSize: '12px',
  marginTop: '4px',
}

/**
 * Шаг 3 мастера — выбор узла автомобиля (radio buttons).
 *
 * @param {{
 *   register: Function,
 *   errors: Object,
 *   currentValue: string,
 * }} props
 */
function WizardStep3Component({ register, errors, currentValue }) {
  return (
    <div data-testid="wizard-step-3">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        Шаг 3 из 7 — Узел автомобиля
      </h2>

      <div style={gridStyle}>
        {VEHICLE_COMPONENT_OPTIONS.map(({ value, label }) => {
          const isSelected = currentValue === value
          return (
            <label
              key={value}
              data-testid={`order-component-option-${value}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                border: isSelected ? '2px solid #2563eb' : '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? '#1d4ed8' : '#374151',
                background: isSelected ? '#eff6ff' : '#fff',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                value={value}
                style={{ accentColor: '#2563eb' }}
                {...register('vehicleComponent', { required: 'Выберите узел' })}
              />
              {label}
            </label>
          )
        })}
      </div>

      {errors.vehicleComponent && (
        <p style={errorMsgStyle}>{errors.vehicleComponent.message}</p>
      )}
    </div>
  )
}

export default WizardStep3Component
