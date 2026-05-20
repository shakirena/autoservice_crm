import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCreateVehicle, useUpdateVehicle } from '../../hooks/useVehicles.js'
import { useClients } from '../../hooks/useClients.js'

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
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
  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
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

const inputErrorStyle = {
  ...inputStyle,
  borderColor: '#ef4444',
}

const errorMsgStyle = {
  color: '#ef4444',
  fontSize: '12px',
  marginTop: '4px',
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
  background: '#2563eb',
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
 * Модальная форма создания / редактирования автомобиля.
 *
 * @param {{
 *   initialData?: import('../../services/vehiclesService.js').VehicleDoc | null,
 *   onClose: () => void,
 * }} props
 */
function VehicleForm({ initialData = null, onClose }) {
  const isEdit = initialData !== null

  const { mutateAsync: createVehicle, isPending: isCreating } = useCreateVehicle()
  const { mutateAsync: updateVehicle, isPending: isUpdating } = useUpdateVehicle()
  const isPending = isCreating || isUpdating

  const { data: clients = [], isLoading: isClientsLoading } = useClients()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientId: initialData?.clientId ?? '',
      make: initialData?.make ?? '',
      model: initialData?.model ?? '',
      year: initialData?.year ?? '',
      licensePlate: initialData?.licensePlate ?? '',
      vin: initialData?.vin ?? '',
    },
  })

  // Синхронизируем форму при смене initialData
  useEffect(() => {
    reset({
      clientId: initialData?.clientId ?? '',
      make: initialData?.make ?? '',
      model: initialData?.model ?? '',
      year: initialData?.year ?? '',
      licensePlate: initialData?.licensePlate ?? '',
      vin: initialData?.vin ?? '',
    })
  }, [initialData, reset])

  async function onSubmit(values) {
    try {
      if (isEdit) {
        await updateVehicle({ id: initialData.id, data: values })
      } else {
        await createVehicle(values)
      }
      onClose()
    } catch (err) {
      console.error('VehicleForm submit error:', err)
    }
  }

  return (
    <div data-testid="vehicle-form-overlay" style={overlayStyle} onClick={onClose}>
      <div
        data-testid="vehicle-form-modal"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
          {isEdit ? 'Редактировать автомобиль' : 'Новый автомобиль'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Клиент */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="vehicle-clientId" style={labelStyle}>
              Клиент <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="vehicle-clientId"
              data-testid="vehicle-input-clientId"
              style={errors.clientId ? inputErrorStyle : inputStyle}
              {...register('clientId', { required: 'Клиент обязателен' })}
              disabled={isClientsLoading}
            >
              <option value="">
                {isClientsLoading ? 'Загрузка клиентов...' : '— Выберите клиента —'}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p style={errorMsgStyle}>{errors.clientId.message}</p>
            )}
          </div>

          {/* Марка */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="vehicle-make" style={labelStyle}>
              Марка <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="vehicle-make"
              data-testid="vehicle-input-make"
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

          {/* Модель */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="vehicle-model" style={labelStyle}>
              Модель <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="vehicle-model"
              data-testid="vehicle-input-model"
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

          {/* Год */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="vehicle-year" style={labelStyle}>
              Год выпуска <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="vehicle-year"
              data-testid="vehicle-input-year"
              type="number"
              placeholder={String(CURRENT_YEAR)}
              style={errors.year ? inputErrorStyle : inputStyle}
              {...register('year', {
                required: 'Год обязателен',
                min: { value: 1900, message: 'Год не может быть раньше 1900' },
                max: {
                  value: CURRENT_YEAR,
                  message: `Год не может быть позже ${CURRENT_YEAR}`,
                },
                valueAsNumber: true,
              })}
            />
            {errors.year && (
              <p style={errorMsgStyle}>{errors.year.message}</p>
            )}
          </div>

          {/* Государственный номер */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="vehicle-licensePlate" style={labelStyle}>
              Государственный номер <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="vehicle-licensePlate"
              data-testid="vehicle-input-licensePlate"
              type="text"
              placeholder="10-AA-001"
              style={errors.licensePlate ? inputErrorStyle : inputStyle}
              {...register('licensePlate', {
                required: 'Государственный номер обязателен',
              })}
            />
            {errors.licensePlate && (
              <p style={errorMsgStyle}>{errors.licensePlate.message}</p>
            )}
          </div>

          {/* VIN (необязательный) */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="vehicle-vin" style={labelStyle}>
              VIN
            </label>
            <input
              id="vehicle-vin"
              data-testid="vehicle-input-vin"
              type="text"
              placeholder="1HGBH41JXMN109186"
              style={errors.vin ? inputErrorStyle : inputStyle}
              {...register('vin')}
            />
            {errors.vin && (
              <p style={errorMsgStyle}>{errors.vin.message}</p>
            )}
          </div>

          <div style={footerStyle}>
            <button
              data-testid="vehicle-form-cancel"
              type="button"
              onClick={onClose}
              disabled={isPending}
              style={cancelBtnStyle}
            >
              Отмена
            </button>
            <button
              data-testid="vehicle-form-submit"
              type="submit"
              disabled={isPending}
              style={{
                ...submitBtnStyle,
                opacity: isPending ? 0.7 : 1,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehicleForm
