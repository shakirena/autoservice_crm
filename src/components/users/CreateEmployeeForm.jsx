import { useForm } from 'react-hook-form'

/**
 * Переиспользуемая форма создания сотрудника.
 * Управляется React Hook Form 7.
 * Не выполняет мутацию напрямую — вызывает onSubmit(data) из пропсов.
 *
 * @param {{
 *   onSubmit: (data: { displayName: string, email: string, password: string, role: string }) => Promise<void>,
 *   onCancel: () => void,
 *   isPending?: boolean,
 *   serverError?: string,
 * }} props
 */

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

function CreateEmployeeForm({ onSubmit, onCancel, isPending = false, serverError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { displayName: '', email: '', password: '', role: 'manager' },
  })

  return (
    <form
      data-testid="create-employee-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {/* Имя */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="emp-displayName">
          Имя *
        </label>
        <input
          id="emp-displayName"
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
          <span data-testid="create-user-name-error" style={errorMsgStyle}>
            {errors.displayName.message}
          </span>
        )}
      </div>

      {/* Email */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="emp-email">
          Email *
        </label>
        <input
          id="emp-email"
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
          <span data-testid="create-user-email-error" style={errorMsgStyle}>
            {errors.email.message}
          </span>
        )}
      </div>

      {/* Пароль */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="emp-password">
          Временный пароль *
        </label>
        <input
          id="emp-password"
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
          <span data-testid="create-user-password-error" style={errorMsgStyle}>
            {errors.password.message}
          </span>
        )}
      </div>

      {/* Роль */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="emp-role">
          Роль *
        </label>
        {/*
          RoleSelect — управляемый компонент; register() не работает напрямую с кастомными
          компонентами, поэтому используем скрытый input + нативный select через register.
        */}
        <select
          id="emp-role"
          data-testid="field-role"
          style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}
          {...register('role', { required: true })}
        >
          <option value="manager">Менеджер</option>
          <option value="mechanic">Механик</option>
        </select>
      </div>

      {/* Серверная ошибка */}
      {serverError && (
        <p
          data-testid="create-user-server-error"
          style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 12px' }}
        >
          {serverError}
        </p>
      )}

      <div style={footerStyle}>
        <button
          data-testid="create-user-cancel"
          type="button"
          onClick={onCancel}
          disabled={isPending}
          style={{ ...btnBaseStyle, background: '#f3f4f6', color: '#374151' }}
        >
          Отмена
        </button>
        <button
          data-testid="submit-create-employee"
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
  )
}

export default CreateEmployeeForm
