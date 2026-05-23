import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCreateVehicle } from '../../../hooks/useVehicles.js'

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyle = {
  background: '#fff',
  borderRadius: '10px',
  padding: '28px 32px',
  width: '460px',
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
}

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

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  marginBottom: '16px',
}

const footerStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  marginTop: '24px',
}

const cancelBtnStyle = {
  padding: '8px 18px',
  background: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  cursor: 'pointer',
}

const submitBtnStyle = {
  padding: '8px 18px',
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

// ─── Component ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Модальное окно создания автомобиля в контексте wizard заказа.
 * clientId передаётся как prop (предзаполнен из контекста wizard).
 * После создания вызывает onCreated(id) — wizard вставляет авто в select.
 *
 * @param {{
 *   clientId: string,
 *   onCreated: (id: string) => void,
 *   onClose: () => void,
 * }} props
 */
function CreateVehicleModal({ clientId, onCreated, onClose }) {
  const { mutateAsync: createVehicle } = useCreateVehicle()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      make: '',
      model: '',
      year: CURRENT_YEAR,
      licensePlate: '',
      vin: '',
    },
  })

  // Закрытие по Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function onSubmit(values) {
    setServerError(null)
    try {
      const { id } = await createVehicle({
        ...values,
        clientId,
        year: Number(values.year),
      })
      onCreated(id)
    } catch (err) {
      console.error('CreateVehicleModal submit error:', err)
      setServerError(err?.message ?? 'Ошибка сохранения. Попробуйте снова.')
    }
  }

  return (
    <div
      data-testid="wizard-vehicle-modal-overlay"
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        data-testid="wizard-vehicle-modal"
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-vehicle-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="wizard-vehicle-modal-title"
          style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}
        >
          Новый автомобиль
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Марка + Модель */}
          <div style={rowStyle}>
            <div>
              <label htmlFor="wvm-make" style={labelStyle}>
                Марка <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="wvm-make"
                data-testid="wizard-vehicle-modal-make"
                type="text"
                placeholder="Toyota"
                style={errors.make ? inputErrorStyle : inputStyle}
                {...register('make', {
                  required: 'Марка обязательна',
                  minLength: { value: 2, message: 'Минимум 2 символа' },
                })}
              />
              {errors.make && (
                <p style={errorMsgStyle}>{errors.make.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="wvm-model" style={labelStyle}>
                Модель <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="wvm-model"
                data-testid="wizard-vehicle-modal-model"
                type="text"
                placeholder="Camry"
                style={errors.model ? inputErrorStyle : inputStyle}
                {...register('model', {
                  required: 'Модель обязательна',
                  minLength: { value: 1, message: 'Минимум 1 символ' },
                })}
              />
              {errors.model && (
                <p style={errorMsgStyle}>{errors.model.message}</p>
              )}
            </div>
          </div>

          {/* Год + Гос. номер */}
          <div style={rowStyle}>
            <div>
              <label htmlFor="wvm-year" style={labelStyle}>
                Год <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="wvm-year"
                data-testid="wizard-vehicle-modal-year"
                type="number"
                min="1900"
                max={CURRENT_YEAR}
                style={errors.year ? inputErrorStyle : inputStyle}
                {...register('year', {
                  required: 'Год обязателен',
                  min: { value: 1900, message: 'Минимум 1900' },
                  max: { value: CURRENT_YEAR, message: `Максимум ${CURRENT_YEAR}` },
                  valueAsNumber: true,
                })}
              />
              {errors.year && (
                <p style={errorMsgStyle}>{errors.year.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="wvm-licensePlate" style={labelStyle}>
                Гос. номер <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="wvm-licensePlate"
                data-testid="wizard-vehicle-modal-licensePlate"
                type="text"
                placeholder="10-AA-001"
                style={errors.licensePlate ? inputErrorStyle : inputStyle}
                {...register('licensePlate', {
                  required: 'Гос. номер обязателен',
                })}
              />
              {errors.licensePlate && (
                <p style={errorMsgStyle}>{errors.licensePlate.message}</p>
              )}
            </div>
          </div>

          {/* VIN (необязательный) */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="wvm-vin" style={labelStyle}>VIN</label>
            <input
              id="wvm-vin"
              data-testid="wizard-vehicle-modal-vin"
              type="text"
              placeholder="WVWZZZ3CZ5E123456"
              style={inputStyle}
              {...register('vin')}
            />
          </div>

          {serverError && (
            <p
              data-testid="wizard-vehicle-modal-error"
              style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 12px' }}
            >
              {serverError}
            </p>
          )}

          <div style={footerStyle}>
            <button
              data-testid="wizard-vehicle-modal-cancel"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={cancelBtnStyle}
            >
              Отмена
            </button>
            <button
              data-testid="wizard-vehicle-modal-submit"
              type="submit"
              disabled={isSubmitting}
              style={{
                ...submitBtnStyle,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Создание...' : 'Добавить автомобиль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateVehicleModal
