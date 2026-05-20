import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../lib/authContext.jsx'
import { useCreateClient, useUpdateClient } from '../../hooks/useClients.js'

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
  width: '420px',
  maxWidth: '95vw',
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

/**
 * Модальная форма создания / редактирования клиента.
 *
 * @param {{
 *   initialData?: import('../../services/clientsService.js').ClientDoc | null,
 *   onClose: () => void,
 * }} props
 */
function ClientForm({ initialData = null, onClose }) {
  const { user } = useAuth()
  const isEdit = initialData !== null

  const { mutateAsync: createClient, isPending: isCreating } = useCreateClient()
  const { mutateAsync: updateClient, isPending: isUpdating } = useUpdateClient()
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: initialData?.fullName ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
    },
  })

  // Синхронизируем форму при смене initialData
  useEffect(() => {
    reset({
      fullName: initialData?.fullName ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
    })
  }, [initialData, reset])

  async function onSubmit(values) {
    try {
      if (isEdit) {
        await updateClient({ id: initialData.id, data: values })
      } else {
        await createClient({
          ...values,
          createdBy: user?.uid ?? '',
        })
      }
      onClose()
    } catch (err) {
      console.error('ClientForm submit error:', err)
    }
  }

  return (
    <div data-testid="client-form-overlay" style={overlayStyle} onClick={onClose}>
      <div
        data-testid="client-form-modal"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
          {isEdit ? 'Редактировать клиента' : 'Новый клиент'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ФИО */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="client-fullName" style={labelStyle}>
              ФИО <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="client-fullName"
              data-testid="client-input-fullName"
              type="text"
              placeholder="Иванов Иван Иванович"
              style={errors.fullName ? inputErrorStyle : inputStyle}
              {...register('fullName', {
                required: 'ФИО обязательно',
                minLength: { value: 2, message: 'Минимум 2 символа' },
              })}
            />
            {errors.fullName && (
              <p style={errorMsgStyle}>{errors.fullName.message}</p>
            )}
          </div>

          {/* Телефон */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="client-phone" style={labelStyle}>
              Телефон <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="client-phone"
              data-testid="client-input-phone"
              type="tel"
              placeholder="+994 50 123 45 67"
              style={errors.phone ? inputErrorStyle : inputStyle}
              {...register('phone', {
                required: 'Телефон обязателен',
              })}
            />
            {errors.phone && (
              <p style={errorMsgStyle}>{errors.phone.message}</p>
            )}
          </div>

          {/* Email (необязательный) */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="client-email" style={labelStyle}>
              Email
            </label>
            <input
              id="client-email"
              data-testid="client-input-email"
              type="email"
              placeholder="example@mail.com"
              style={errors.email ? inputErrorStyle : inputStyle}
              {...register('email', {
                validate: (v) =>
                  !v ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                  'Некорректный формат email',
              })}
            />
            {errors.email && (
              <p style={errorMsgStyle}>{errors.email.message}</p>
            )}
          </div>

          <div style={footerStyle}>
            <button
              data-testid="client-form-cancel"
              type="button"
              onClick={onClose}
              disabled={isPending}
              style={cancelBtnStyle}
            >
              Отмена
            </button>
            <button
              data-testid="client-form-submit"
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

export default ClientForm
