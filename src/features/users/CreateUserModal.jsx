import { useForm } from 'react-hook-form'
import { useCreateEmployee } from '../../hooks/useUsers.js'

/**
 * Модальное окно создания нового сотрудника.
 *
 * @param {{ onClose: () => void }} props
 */

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
  borderRadius: '8px',
  padding: '28px',
  maxWidth: '460px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  maxHeight: '90vh',
  overflowY: 'auto',
}

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '16px',
}

const labelStyle = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
}

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
}

const inputErrorStyle = {
  ...inputStyle,
  border: '1px solid #dc2626',
}

const errorMsgStyle = {
  fontSize: '12px',
  color: '#dc2626',
}

const footerStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '8px',
}

const btnBaseStyle = {
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
}

function CreateUserModal({ onClose }) {
  const { mutateAsync, isPending } = useCreateEmployee()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: { displayName: '', email: '', password: '', role: 'manager' },
  })

  async function onSubmit(values) {
    try {
      await mutateAsync(values)
      onClose()
    } catch (err) {
      setError('root', {
        message: err.message ?? 'Ошибка создания пользователя. Попробуйте снова',
      })
    }
  }

  return (
    <div data-testid="modal-create-user" style={overlayStyle}>
      <div style={modalStyle} role="dialog" aria-modal="true">
        <h3 style={{ marginTop: 0 }}>Добавить сотрудника</h3>

        <form
          data-testid="create-employee-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {/* Имя */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="create-displayName">
              Имя *
            </label>
            <input
              id="create-displayName"
              data-testid="field-displayName"
              type="text"
              placeholder="Иван Иванов"
              style={errors.displayName ? inputErrorStyle : inputStyle}
              {...register('displayName', {
                required: 'Введите имя',
                minLength: { value: 2, message: 'Минимум 2 символа' },
              })}
            />
            {errors.displayName && (
              <span
                data-testid="create-user-name-error"
                style={errorMsgStyle}
              >
                {errors.displayName.message}
              </span>
            )}
          </div>

          {/* Email */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="create-email">
              Email *
            </label>
            <input
              id="create-email"
              data-testid="field-email"
              type="email"
              placeholder="ivan@autoservice.ru"
              style={errors.email ? inputErrorStyle : inputStyle}
              {...register('email', {
                required: 'Введите email',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Некорректный формат email',
                },
              })}
            />
            {errors.email && (
              <span
                data-testid="create-user-email-error"
                style={errorMsgStyle}
              >
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Пароль */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="create-password">
              Временный пароль *
            </label>
            <input
              id="create-password"
              data-testid="field-password"
              type="password"
              placeholder="Минимум 8 символов"
              style={errors.password ? inputErrorStyle : inputStyle}
              {...register('password', {
                required: 'Введите пароль',
                minLength: {
                  value: 8,
                  message: 'Пароль должен содержать минимум 8 символов',
                },
              })}
            />
            {errors.password && (
              <span
                data-testid="create-user-password-error"
                style={errorMsgStyle}
              >
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Роль */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="create-role">
              Роль *
            </label>
            <select
              id="create-role"
              data-testid="field-role"
              style={{
                ...inputStyle,
                background: '#fff',
                cursor: 'pointer',
              }}
              {...register('role', { required: true })}
            >
              <option value="manager">Менеджер</option>
              <option value="mechanic">Механик</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          {/* Серверная ошибка */}
          {errors.root && (
            <p
              data-testid="create-user-server-error"
              style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 12px' }}
            >
              {errors.root.message}
            </p>
          )}

          <div style={footerStyle}>
            <button
              data-testid="create-user-cancel"
              type="button"
              onClick={onClose}
              disabled={isPending}
              style={{ ...btnBaseStyle, background: '#f3f4f6', color: '#374151' }}
            >
              Отмена
            </button>
            <button
              data-testid="create-user-submit"
              type="submit"
              disabled={isPending}
              style={{
                ...btnBaseStyle,
                background: '#2563eb',
                color: '#fff',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateUserModal
