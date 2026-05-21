import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useVehiclesByClient, useCreateVehicle } from '../../../hooks/useVehicles.js'

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
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
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
  background: '#16a34a',
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

const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }

// ─── Inline vehicle creation form ──────────────────────────────────────────────

function InlineVehicleForm({ clientId, onCreated, onCancel }) {
  const { mutateAsync: createVehicle } = useCreateVehicle()
  const currentYear = new Date().getFullYear()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { make: '', model: '', year: currentYear, licensePlate: '', vin: '' },
  })

  async function onSubmit(values) {
    const { id } = await createVehicle({ ...values, clientId, year: Number(values.year) })
    onCreated(id)
  }

  return (
    <div data-testid="inline-vehicle-form" style={inlineFormStyle}>
      <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#15803d' }}>
        Новый автомобиль
      </p>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Марка *</label>
          <input
            data-testid="inline-vehicle-make"
            style={errors.make ? inputErrorStyle : inputStyle}
            placeholder="Toyota"
            {...register('make', { required: 'Обязательно' })}
          />
          {errors.make && <p style={errorMsgStyle}>{errors.make.message}</p>}
        </div>
        <div>
          <label style={labelStyle}>Модель *</label>
          <input
            data-testid="inline-vehicle-model"
            style={errors.model ? inputErrorStyle : inputStyle}
            placeholder="Camry"
            {...register('model', { required: 'Обязательно' })}
          />
          {errors.model && <p style={errorMsgStyle}>{errors.model.message}</p>}
        </div>
      </div>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Год *</label>
          <input
            data-testid="inline-vehicle-year"
            type="number"
            min="1900"
            max={currentYear}
            style={errors.year ? inputErrorStyle : inputStyle}
            {...register('year', {
              required: 'Обязательно',
              min: { value: 1900, message: 'Минимум 1900' },
              max: { value: currentYear, message: `Максимум ${currentYear}` },
              valueAsNumber: true,
            })}
          />
          {errors.year && <p style={errorMsgStyle}>{errors.year.message}</p>}
        </div>
        <div>
          <label style={labelStyle}>Гос. номер *</label>
          <input
            data-testid="inline-vehicle-licensePlate"
            style={errors.licensePlate ? inputErrorStyle : inputStyle}
            placeholder="10-AA-001"
            {...register('licensePlate', { required: 'Обязательно' })}
          />
          {errors.licensePlate && <p style={errorMsgStyle}>{errors.licensePlate.message}</p>}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>VIN (необязательно)</label>
        <input
          data-testid="inline-vehicle-vin"
          style={inputStyle}
          placeholder="WVWZZZ3CZ5E123456"
          {...register('vin')}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          data-testid="inline-vehicle-save"
          type="button"
          disabled={isSubmitting}
          style={{ ...saveBtnStyle, opacity: isSubmitting ? 0.7 : 1 }}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting ? 'Создание...' : 'Добавить автомобиль'}
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
 * Шаг 2 мастера — выбор автомобиля клиента.
 * Поддерживает inline-создание нового автомобиля без перехода в другой раздел.
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
  const [showCreate, setShowCreate] = useState(false)

  function handleCreated(newId) {
    setShowCreate(false)
    setValue('vehicleId', newId, { shouldValidate: true })
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

          {!showCreate && (
            <button
              data-testid="wizard-create-vehicle-toggle"
              type="button"
              style={{ ...linkBtnStyle, marginTop: '8px' }}
              onClick={() => setShowCreate(true)}
            >
              + Добавить новый автомобиль
            </button>
          )}

          {showCreate && (
            <InlineVehicleForm
              clientId={clientId}
              onCreated={handleCreated}
              onCancel={() => setShowCreate(false)}
            />
          )}
        </>
      )}
    </div>
  )
}

export default WizardStep2Vehicle
