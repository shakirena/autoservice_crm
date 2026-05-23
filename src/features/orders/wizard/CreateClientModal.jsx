import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { useCreateClient } from '../../../hooks/useClients.js'

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
  width: '440px',
  maxWidth: '95vw',
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
 * Модальное окно создания клиента в контексте wizard заказа.
 * После создания вызывает onCreated(id) — wizard вставляет клиента в select.
 *
 * @param {{
 *   uid: string,
 *   onCreated: (id: string) => void,
 *   onClose: () => void,
 * }} props
 */
function CreateClientModal({ uid, onCreated, onClose }) {
  const { mutateAsync: createClient } = useCreateClient()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { fullName: '', phone: '', email: '' },
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
      const { id } = await createClient({ ...values, createdBy: uid ?? '' })
      onCreated(id)
    } catch (err) {
      console.error('CreateClientModal submit error:', err)
      setServerError(err?.message ?? 'Ошибка сохранения. Попробуйте снова.')
    }
  }

  // Portal: рендерим в document.body, вне DOM-дерева wizard-формы.
  // Это исправляет nested-form баг: браузер ассоциировал button[type=submit]
  // с внешней <form> wizard вместо формы модалки → createClient никогда не вызывался.
  return createPortal(
    <div
      data-testid="wizard-client-modal-overlay"
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        data-testid="wizard-client-modal"
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-client-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="wizard-client-modal-title"
          style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}
        >
          Новый клиент
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ФИО */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="wcm-fullName" style={labelStyle}>
              ФИО <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="wcm-fullName"
              data-testid="wizard-client-modal-fullName"
              type="text"
              placeholder="Мамедов Эльшан Фарид"
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
            <label htmlFor="wcm-phone" style={labelStyle}>
              Телефон <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="wcm-phone"
              data-testid="wizard-client-modal-phone"
              type="tel"
              placeholder="+994 50 123 45 67"
              style={errors.phone ? inputErrorStyle : inputStyle}
              {...register('phone', { required: 'Телефон обязателен' })}
            />
            {errors.phone && (
              <p style={errorMsgStyle}>{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="wcm-email" style={labelStyle}>Email</label>
            <input
              id="wcm-email"
              data-testid="wizard-client-modal-email"
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

          {serverError && (
            <p
              data-testid="wizard-client-modal-error"
              style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 12px' }}
            >
              {serverError}
            </p>
          )}

          <div style={footerStyle}>
            <button
              data-testid="wizard-client-modal-cancel"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={cancelBtnStyle}
            >
              Отмена
            </button>
            <button
              data-testid="wizard-client-modal-submit"
              type="submit"
              disabled={isSubmitting}
              style={{
                ...submitBtnStyle,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Создание...' : 'Создать клиента'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default CreateClientModal
